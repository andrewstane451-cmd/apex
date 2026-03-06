import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ArrowUpDown, X, User, TrendingUp, TrendingDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// ── Volatility indices ──
const VOLATILITIES = [
  { id: "v10", label: "Vol 10", speed: 0.3, amplitude: 0.4 },
  { id: "v25", label: "Vol 25", speed: 0.5, amplitude: 0.8 },
  { id: "v50", label: "Vol 50", speed: 0.8, amplitude: 1.2 },
  { id: "v75", label: "Vol 75", speed: 1.1, amplitude: 1.8 },
  { id: "v100", label: "Vol 100", speed: 1.5, amplitude: 2.5 },
];

const BASE_PRICE = 1000;
const CHART_POINTS = 120;
const TICK_MS = 500;

// Seeded PRNG so all users see the same chart at the same wall-clock time
function seededRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  s = (s * 16807) % 2147483647;
  return (s - 1) / 2147483646;
}

interface Position {
  id: string;
  type: "buy" | "sell";
  entryPrice: number;
  stake: number;
  volume: number;
  openedAt: number;
  volatility: string;
}

const DashboardCFDs = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // ── Account state ──
  const [activeTab, setActiveTab] = useState<"demo" | "real">(() => {
    const saved = localStorage.getItem("cfds_active_tab");
    return saved === "demo" || saved === "real" ? saved : "real";
  });
  const [switching, setSwitching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0);
  const [cfdBalance, setCfdBalance] = useState(0);
  const [cfdAccountId, setCfdAccountId] = useState<string | null>(null);
  const [parentAccountId, setParentAccountId] = useState<string | null>(null);

  // ── Transfer modal ──
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferDirection, setTransferDirection] = useState<"to_cfd" | "from_cfd">("to_cfd");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferring, setTransferring] = useState(false);

  // ── Chart state ──
  const [selectedVol, setSelectedVol] = useState(VOLATILITIES[2]); // Vol 50 default
  const [volSwitching, setVolSwitching] = useState(false);
  const [chartData, setChartData] = useState<number[]>([]);
  const [currentPrice, setCurrentPrice] = useState(BASE_PRICE);
  const chartCanvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  // ── Trading state ──
  const [stake, setStake] = useState("10");
  const [positions, setPositions] = useState<Position[]>([]);
  const positionsRef = useRef<Position[]>([]);
  positionsRef.current = positions;
  const currentPriceRef = useRef(currentPrice);
  currentPriceRef.current = currentPrice;
  const cfdBalanceRef = useRef(cfdBalance);
  cfdBalanceRef.current = cfdBalance;

  // ── Fetch balances ──
  const fetchBalances = useCallback(async () => {
    if (!user) return;
    const { data: accounts } = await supabase
      .from("accounts")
      .select("id, balance, type, currency")
      .eq("user_id", user.id)
      .eq("type", activeTab);
    if (accounts && accounts.length > 0) {
      const account = accounts[0];
      setWalletBalance(account.balance);
      setParentAccountId(account.id);
      const { data: tradingAccounts } = await supabase
        .from("trading_accounts")
        .select("*")
        .eq("account_id", account.id)
        .eq("platform", "CFDs");
      if (tradingAccounts && tradingAccounts.length > 0) {
        setCfdBalance(tradingAccounts[0].balance);
        setCfdAccountId(tradingAccounts[0].id);
      }
    }
    setLoading(false);
    setSwitching(false);
  }, [user, activeTab]);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  // ── Price generation (deterministic per wall-clock second) ──
  useEffect(() => {
    let priceHistory: number[] = [];
    let lastPrice = BASE_PRICE;

    // Build initial history
    const now = Date.now();
    const startTick = Math.floor(now / TICK_MS) - CHART_POINTS;
    for (let i = 0; i <= CHART_POINTS; i++) {
      const tick = startTick + i;
      const r = seededRandom(tick * 7919 + selectedVol.id.charCodeAt(1) * 1000);
      const change = (r - 0.5) * selectedVol.amplitude;
      lastPrice = Math.max(100, lastPrice + change);
      priceHistory.push(parseFloat(lastPrice.toFixed(2)));
    }

    setChartData([...priceHistory]);
    setCurrentPrice(priceHistory[priceHistory.length - 1]);

    const interval = setInterval(() => {
      const tick = Math.floor(Date.now() / TICK_MS);
      const r = seededRandom(tick * 7919 + selectedVol.id.charCodeAt(1) * 1000);
      const change = (r - 0.5) * selectedVol.amplitude;
      lastPrice = Math.max(100, lastPrice + change);
      lastPrice = parseFloat(lastPrice.toFixed(2));

      priceHistory.push(lastPrice);
      if (priceHistory.length > CHART_POINTS) priceHistory = priceHistory.slice(-CHART_POINTS);

      setChartData([...priceHistory]);
      setCurrentPrice(lastPrice);
    }, TICK_MS);

    return () => clearInterval(interval);
  }, [selectedVol]);

  // ── Auto-close positions that hit loss limit ──
  useEffect(() => {
    const checkPositions = () => {
      const price = currentPriceRef.current;
      const toClose: string[] = [];
      let balanceChange = 0;

      positionsRef.current.forEach((pos) => {
        const priceDiff = pos.type === "buy" ? price - pos.entryPrice : pos.entryPrice - price;
        const pl = priceDiff * pos.volume;
        // Auto-close if loss >= stake
        if (pl <= -pos.stake) {
          toClose.push(pos.id);
          balanceChange += 0; // Lost full stake, nothing returned
        }
      });

      if (toClose.length > 0) {
        setPositions((prev) => prev.filter((p) => !toClose.includes(p.id)));
        // Balance already reduced on open, no further DB update needed for loss
      }
    };

    const interval = setInterval(checkPositions, TICK_MS);
    return () => clearInterval(interval);
  }, []);

  // ── Draw chart on canvas ──
  useEffect(() => {
    const canvas = chartCanvasRef.current;
    if (!canvas || chartData.length < 2) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const min = Math.min(...chartData);
    const max = Math.max(...chartData);
    const range = max - min || 1;
    const padding = 10;

    ctx.clearRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = "hsl(var(--border))";
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 5; i++) {
      const y = padding + ((h - padding * 2) / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Line
    const isUp = chartData[chartData.length - 1] >= chartData[0];
    ctx.strokeStyle = isUp ? "hsl(142, 71%, 45%)" : "hsl(0, 84%, 60%)";
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.beginPath();

    chartData.forEach((price, i) => {
      const x = (i / (chartData.length - 1)) * w;
      const y = padding + ((max - price) / range) * (h - padding * 2);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Gradient fill
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    if (isUp) {
      gradient.addColorStop(0, "hsla(142, 71%, 45%, 0.15)");
      gradient.addColorStop(1, "hsla(142, 71%, 45%, 0)");
    } else {
      gradient.addColorStop(0, "hsla(0, 84%, 60%, 0.15)");
      gradient.addColorStop(1, "hsla(0, 84%, 60%, 0)");
    }

    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Current price dot
    const lastX = w;
    const lastY = padding + ((max - chartData[chartData.length - 1]) / range) * (h - padding * 2);
    ctx.beginPath();
    ctx.arc(lastX - 2, lastY, 4, 0, Math.PI * 2);
    ctx.fillStyle = isUp ? "hsl(142, 71%, 45%)" : "hsl(0, 84%, 60%)";
    ctx.fill();
  }, [chartData]);

  // ── Trading actions ──
  const openPosition = async (type: "buy" | "sell") => {
    const stakeVal = parseFloat(stake);
    if (!stakeVal || stakeVal <= 0 || stakeVal > cfdBalance || !cfdAccountId) return;

    const newBalance = parseFloat((cfdBalance - stakeVal).toFixed(2));

    // Deduct stake immediately
    await supabase.from("trading_accounts").update({ balance: newBalance }).eq("id", cfdAccountId);
    setCfdBalance(newBalance);

    const position: Position = {
      id: crypto.randomUUID(),
      type,
      entryPrice: currentPrice,
      stake: stakeVal,
      volume: stakeVal / 100, // simplified volume
      openedAt: Date.now(),
      volatility: selectedVol.label,
    };
    setPositions((prev) => [...prev, position]);
  };

  const closePosition = async (posId: string) => {
    const pos = positions.find((p) => p.id === posId);
    if (!pos || !cfdAccountId) return;

    const priceDiff = pos.type === "buy" ? currentPrice - pos.entryPrice : pos.entryPrice - currentPrice;
    const pl = priceDiff * pos.volume;
    const returned = Math.max(0, pos.stake + pl);
    const newBalance = parseFloat((cfdBalance + returned).toFixed(2));

    await supabase.from("trading_accounts").update({ balance: newBalance }).eq("id", cfdAccountId);
    setCfdBalance(newBalance);
    setPositions((prev) => prev.filter((p) => p.id !== posId));
  };

  // ── Transfer ──
  const handleTransfer = async () => {
    const amount = parseFloat(transferAmount);
    if (!amount || amount <= 0 || !cfdAccountId || !parentAccountId) return;
    if (transferDirection === "to_cfd" && amount > walletBalance) return;
    if (transferDirection === "from_cfd" && amount > cfdBalance) return;

    setTransferring(true);
    const newWallet = transferDirection === "to_cfd"
      ? parseFloat((walletBalance - amount).toFixed(2))
      : parseFloat((walletBalance + amount).toFixed(2));
    const newCfd = transferDirection === "to_cfd"
      ? parseFloat((cfdBalance + amount).toFixed(2))
      : parseFloat((cfdBalance - amount).toFixed(2));

    await Promise.all([
      supabase.from("accounts").update({ balance: newWallet }).eq("id", parentAccountId),
      supabase.from("trading_accounts").update({ balance: newCfd }).eq("id", cfdAccountId),
    ]);

    setWalletBalance(newWallet);
    setCfdBalance(newCfd);
    setTransferAmount("");
    setTransferring(false);
    setShowTransfer(false);
  };

  const handleTabChange = (tab: "demo" | "real") => {
    if (tab === activeTab) return;
    setSwitching(true);
    setActiveTab(tab);
    setPositions([]);
    localStorage.setItem("cfds_active_tab", tab);
  };

  const handleVolChange = (vol: typeof VOLATILITIES[0]) => {
    if (vol.id === selectedVol.id) return;
    setVolSwitching(true);
    setSelectedVol(vol);
    setTimeout(() => setVolSwitching(false), 400);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const priceChange = chartData.length >= 2 ? currentPrice - chartData[0] : 0;
  const priceChangePercent = chartData.length >= 2 ? ((priceChange / chartData[0]) * 100) : 0;
  const isUp = priceChange >= 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-xl font-bold text-primary">d</span>
        <div className="flex bg-muted rounded-full p-0.5">
          {(["demo", "real"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`px-5 py-1.5 text-sm font-medium rounded-full transition-colors capitalize ${
                activeTab === tab ? "bg-card text-foreground" : "text-muted-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <button onClick={() => navigate("/dashboard/profile")} className="w-9 h-9 rounded-full border border-border flex items-center justify-center">
          <User className="w-4 h-4 text-muted-foreground" />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto pb-20">
        {switching ? (
          <div className="px-4 pt-4 space-y-4">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-48 w-full rounded-2xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
          </div>
        ) : (
          <div className="px-4 pt-4">
            {/* Balance & Transfer */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xl font-bold text-foreground">
                  {cfdBalance.toFixed(2)} USD
                </p>
                <p className="text-xs text-muted-foreground">CFDs account</p>
              </div>
              <button onClick={() => setShowTransfer(true)} className="flex flex-col items-center gap-1">
                <div className="w-12 h-12 rounded-full border border-primary flex items-center justify-center">
                  <ArrowUpDown className="w-5 h-5 text-primary" />
                </div>
                <span className="text-xs text-primary font-medium">Transfer</span>
              </button>
            </div>

            {/* Volatility selector */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
              {VOLATILITIES.map((vol) => (
                <button
                  key={vol.id}
                  onClick={() => handleVolChange(vol)}
                  className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                    selectedVol.id === vol.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {vol.label}
                </button>
              ))}
            </div>

            {/* Current price */}
            <div className="flex items-center gap-3 mb-2">
              <p className="text-2xl font-bold text-foreground">{currentPrice.toFixed(2)}</p>
              <span className={`text-sm font-medium ${isUp ? "text-green-500" : "text-red-500"}`}>
                {isUp ? "+" : ""}{priceChange.toFixed(2)} ({isUp ? "+" : ""}{priceChangePercent.toFixed(2)}%)
              </span>
            </div>

            {/* Chart */}
            <div className="bg-card rounded-2xl border border-border p-3 mb-4 relative">
              {volSwitching ? (
                <Skeleton className="h-44 w-full rounded-xl" />
              ) : (
                <canvas
                  ref={chartCanvasRef}
                  className="w-full h-44"
                  style={{ display: "block" }}
                />
              )}
            </div>

            {/* Stake input */}
            <div className="mb-4">
              <label className="text-xs text-muted-foreground mb-1 block">Stake (USD)</label>
              <input
                type="number"
                step="0.01"
                value={stake}
                onChange={(e) => setStake(e.target.value)}
                className="w-full bg-muted rounded-xl px-4 py-3 text-foreground text-sm outline-none border border-border focus:border-primary"
              />
            </div>

            {/* Buy / Sell buttons */}
            <div className="flex gap-3 mb-6">
              <button
                onClick={() => openPosition("buy")}
                disabled={!parseFloat(stake) || parseFloat(stake) > cfdBalance}
                className="flex-1 py-3.5 bg-green-600 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <TrendingUp className="w-4 h-4" /> Buy
              </button>
              <button
                onClick={() => openPosition("sell")}
                disabled={!parseFloat(stake) || parseFloat(stake) > cfdBalance}
                className="flex-1 py-3.5 bg-red-600 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                <TrendingDown className="w-4 h-4" /> Sell
              </button>
            </div>

            {/* Open positions */}
            {positions.length > 0 && (
              <div>
                <h3 className="text-base font-bold text-foreground mb-3">Open Positions</h3>
                <div className="space-y-3">
                  {positions.map((pos) => {
                    const priceDiff = pos.type === "buy"
                      ? currentPrice - pos.entryPrice
                      : pos.entryPrice - currentPrice;
                    const pl = priceDiff * pos.volume;
                    const plPercent = (pl / pos.stake) * 100;
                    const isProfit = pl >= 0;

                    return (
                      <div key={pos.id} className="bg-card rounded-2xl border border-border p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                              pos.type === "buy"
                                ? "bg-green-600/20 text-green-500"
                                : "bg-red-600/20 text-red-500"
                            }`}>
                              {pos.type.toUpperCase()}
                            </span>
                            <span className="text-sm text-muted-foreground">{pos.volatility}</span>
                          </div>
                          <button
                            onClick={() => closePosition(pos.id)}
                            className="px-3 py-1.5 bg-muted text-foreground rounded-lg text-xs font-medium hover:bg-muted/80 transition-colors"
                          >
                            Close
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground">Entry: {pos.entryPrice.toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground">Stake: {pos.stake.toFixed(2)} USD</p>
                          </div>
                          <div className="text-right">
                            <p className={`text-base font-bold ${isProfit ? "text-green-500" : "text-red-500"}`}>
                              {isProfit ? "+" : ""}{pl.toFixed(2)} USD
                            </p>
                            <p className={`text-xs ${isProfit ? "text-green-500" : "text-red-500"}`}>
                              {isProfit ? "+" : ""}{plPercent.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {positions.length === 0 && (
              <div className="bg-card rounded-2xl border border-border p-6 text-center">
                <p className="text-sm text-muted-foreground">No open positions. Place a Buy or Sell trade above.</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Transfer Modal */}
      {showTransfer && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-2xl p-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-foreground">Transfer funds</h3>
              <button onClick={() => setShowTransfer(false)}>
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setTransferDirection("to_cfd")}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  transferDirection === "to_cfd"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                USD → CFDs
              </button>
              <button
                onClick={() => setTransferDirection("from_cfd")}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  transferDirection === "from_cfd"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                CFDs → USD
              </button>
            </div>

            <div className="flex justify-between text-xs text-muted-foreground mb-2">
              <span>USD Wallet: {walletBalance.toFixed(2)}</span>
              <span>CFDs: {cfdBalance.toFixed(2)}</span>
            </div>

            <input
              type="number"
              step="0.01"
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
              placeholder="Enter amount"
              className="w-full bg-muted rounded-xl px-4 py-3 text-foreground text-sm mb-2 outline-none border border-border focus:border-primary"
            />
            <p className="text-xs text-muted-foreground mb-4">
              Available: {(transferDirection === "to_cfd" ? walletBalance : cfdBalance).toFixed(2)} USD
            </p>

            <button
              onClick={handleTransfer}
              disabled={transferring || !transferAmount || parseFloat(transferAmount) <= 0}
              className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50"
            >
              {transferring ? "Transferring..." : "Transfer"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardCFDs;
