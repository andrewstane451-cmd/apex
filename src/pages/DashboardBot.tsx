import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Play, Square, ArrowUp, ArrowDown, TrendingUp, ArrowLeft, ArrowUpDown, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

const VOLATILITY_OPTIONS = [
  "Volatility 10 Index",
  "Volatility 10 (1s) Index",
  "Volatility 25 Index",
  "Volatility 25 (1s) Index",
  "Volatility 50 Index",
  "Volatility 50 (1s) Index",
  "Volatility 75 Index",
  "Volatility 100 Index",
];

const TRADE_TYPES = {
  "Up/Down": {
    subTypes: ["Rise/Fall"],
    directions: ["Rise", "Fall"],
  },
  "Digits": {
    subTypes: ["Even/Odd", "Matches/Differs"],
    directions: [] as string[],
  },
};

const DIGIT_DIRECTIONS: Record<string, string[]> = {
  "Even/Odd": ["Even", "Odd"],
  "Matches/Differs": ["Matches", "Differs"],
};

interface BotConfig {
  market: string;
  marketSub: string;
  index: string;
  tradeType: string;
  subType: string;
  contractType: string;
  candleInterval: string;
  restartOnError: boolean;
  restartLastTrade: boolean;
  duration: string;
  durationValue: number;
  stake: number;
  purchaseDirection: string;
  digitPrediction: number;
}

interface Transaction {
  id: string;
  direction: string;
  entrySpot: number;
  exitSpot: number | null;
  buyPrice: number;
  profitLoss: number | null;
  settled: boolean;
}

interface BotStats {
  totalStake: number;
  totalPayout: number;
  runs: number;
  contractsLost: number;
  contractsWon: number;
  totalProfitLoss: number;
}

type TradePhase = "idle" | "starting" | "running" | "completed";

const DEFAULT_CONFIG: BotConfig = {
  market: "Derived",
  marketSub: "Continuous Indices",
  index: "Volatility 10 (1s) Index",
  tradeType: "Up/Down",
  subType: "Rise/Fall",
  contractType: "Both",
  candleInterval: "1 minute",
  restartOnError: false,
  restartLastTrade: true,
  duration: "Ticks",
  durationValue: 1,
  stake: 0.35,
  purchaseDirection: "Rise",
  digitPrediction: 5,
};

const DashboardBot = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<"builder" | "running">("builder");
  const [activeResultTab, setActiveResultTab] = useState<"summary" | "transactions" | "journal">("transactions");
  const [config, setConfig] = useState<BotConfig>(DEFAULT_CONFIG);
  const [isRunning, setIsRunning] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<BotStats>({
    totalStake: 0, totalPayout: 0, runs: 0,
    contractsLost: 0, contractsWon: 0, totalProfitLoss: 0,
  });
  const [optionsBalance, setOptionsBalance] = useState(0);
  const [walletBalance, setWalletBalance] = useState(0);
  const [optionsAccountId, setOptionsAccountId] = useState<string | null>(null);
  const [parentAccountId, setParentAccountId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [activeTab, setActiveTab] = useState<"demo" | "real">("demo");
  const [statusText, setStatusText] = useState("Bot is not running");
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferDirection, setTransferDirection] = useState<"to_options" | "from_options">("to_options");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferring, setTransferring] = useState(false);
  const [tradePhase, setTradePhase] = useState<TradePhase>("idle");
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const spotRef = useRef(9349 + Math.random() * 10);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [user, authLoading, navigate]);

  const fetchBalances = useCallback(async (showSkeleton = false) => {
    if (!user) return;
    if (showSkeleton) setSwitching(true);
    const { data: accounts } = await supabase
      .from("accounts")
      .select("id, balance, type")
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
        .eq("platform", "Options");
      if (tradingAccounts && tradingAccounts.length > 0) {
        setOptionsBalance(tradingAccounts[0].balance);
        setOptionsAccountId(tradingAccounts[0].id);
      }
    }
    setLoading(false);
    setSwitching(false);
  }, [user, activeTab]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  const handleTransfer = async () => {
    const amount = parseFloat(transferAmount);
    if (!amount || amount <= 0 || !optionsAccountId || !parentAccountId) return;
    if (transferDirection === "to_options" && amount > walletBalance) return;
    if (transferDirection === "from_options" && amount > optionsBalance) return;

    setTransferring(true);
    const newWallet = transferDirection === "to_options"
      ? parseFloat((walletBalance - amount).toFixed(2))
      : parseFloat((walletBalance + amount).toFixed(2));
    const newOptions = transferDirection === "to_options"
      ? parseFloat((optionsBalance + amount).toFixed(2))
      : parseFloat((optionsBalance - amount).toFixed(2));

    await Promise.all([
      supabase.from("accounts").update({ balance: newWallet }).eq("id", parentAccountId),
      supabase.from("trading_accounts").update({ balance: newOptions }).eq("id", optionsAccountId),
    ]);

    setWalletBalance(newWallet);
    setOptionsBalance(newOptions);
    setTransferAmount("");
    setTransferring(false);
    setShowTransfer(false);
  };

  const balance = optionsBalance;
  const accountId = optionsAccountId;

  const simulateTrade = useCallback(async (): Promise<boolean> => {
    if (!accountId) return false;
    const stake = config.stake;

    // Fetch fresh balance from DB before trading
    const { data: freshAccount } = await supabase
      .from("trading_accounts")
      .select("balance")
      .eq("id", accountId)
      .single();

    const currentBalance = freshAccount?.balance ?? balance;
    setOptionsBalance(currentBalance);

    if (currentBalance < stake) {
      setStatusText("Insufficient balance");
      setIsRunning(false);
      return false;
    }

    setTradePhase("starting");
    setStatusText("Starting trade...");

    await new Promise((r) => setTimeout(r, 800));
    setTradePhase("running");
    setStatusText("Trade running...");

    const entrySpot = parseFloat((spotRef.current + (Math.random() - 0.5) * 2).toFixed(2));
    spotRef.current = entrySpot;

    const txId = crypto.randomUUID();
    const direction = config.purchaseDirection.toLowerCase();

    const newTx: Transaction = {
      id: txId,
      direction,
      entrySpot,
      exitSpot: null,
      buyPrice: stake,
      profitLoss: null,
      settled: false,
    };

    const newBal = parseFloat((currentBalance - stake).toFixed(2));
    setTransactions((prev) => [newTx, ...prev]);
    setOptionsBalance(newBal);

    await supabase
      .from("trading_accounts")
      .update({ balance: newBal })
      .eq("id", accountId);

    // Wait for trade duration
    await new Promise((r) => setTimeout(r, 2000 + Math.random() * 2000));

    const exitSpot = parseFloat((entrySpot + (Math.random() - 0.48) * 3).toFixed(2));
    spotRef.current = exitSpot;

    let won = false;
    const lastDigit = Math.abs(Math.round(exitSpot * 100)) % 10;

    if (config.tradeType === "Digits") {
      if (config.purchaseDirection === "Even") won = lastDigit % 2 === 0;
      else if (config.purchaseDirection === "Odd") won = lastDigit % 2 !== 0;
      else if (config.purchaseDirection === "Matches") won = lastDigit === config.digitPrediction;
      else if (config.purchaseDirection === "Differs") won = lastDigit !== config.digitPrediction;
    } else {
      won = (direction === "rise" && exitSpot > entrySpot) ||
            (direction === "fall" && exitSpot < entrySpot);
    }

    let payoutMultiplier = 1.95;
    if (config.purchaseDirection === "Even" || config.purchaseDirection === "Odd") payoutMultiplier = 1.9;
    else if (config.purchaseDirection === "Matches") payoutMultiplier = 9.0;
    else if (config.purchaseDirection === "Differs") payoutMultiplier = 1.1;

    const payout = won ? stake * payoutMultiplier : 0;
    const profitLoss = payout - stake;

    setTransactions((prev) =>
      prev.map((tx) =>
        tx.id === txId
          ? { ...tx, exitSpot, profitLoss: parseFloat(profitLoss.toFixed(2)), settled: true }
          : tx
      )
    );

    // Fetch fresh balance and add payout
    const { data: freshBal } = await supabase
      .from("trading_accounts")
      .select("balance")
      .eq("id", accountId)
      .single();

    const balAfterPayout = parseFloat(((freshBal?.balance ?? 0) + payout).toFixed(2));
    await supabase.from("trading_accounts").update({ balance: balAfterPayout }).eq("id", accountId);
    setOptionsBalance(balAfterPayout);

    setStats((prev) => ({
      totalStake: parseFloat((prev.totalStake + stake).toFixed(2)),
      totalPayout: parseFloat((prev.totalPayout + payout).toFixed(2)),
      runs: prev.runs + 1,
      contractsLost: prev.contractsLost + (won ? 0 : 1),
      contractsWon: prev.contractsWon + (won ? 1 : 0),
      totalProfitLoss: parseFloat((prev.totalProfitLoss + profitLoss).toFixed(2)),
    }));

    setTradePhase("completed");
    setStatusText(won ? "Trade won! ✅" : "Trade lost ❌");

    // Show result for 1.5s then reset phase
    await new Promise((r) => setTimeout(r, 1500));
    setTradePhase("idle");

    return true;
  }, [accountId, balance, config.stake, config.purchaseDirection, config.tradeType, config.subType, config.digitPrediction]);

  const runningRef = useRef(false);

  const startBot = async () => {
    if (!accountId) {
      setStatusText("No account found");
      return;
    }

    const { data: freshAccount } = await supabase
      .from("trading_accounts")
      .select("balance")
      .eq("id", accountId)
      .single();

    const currentBalance = freshAccount?.balance ?? balance;
    setOptionsBalance(currentBalance);

    if (currentBalance < config.stake) {
      setStatusText("Insufficient balance");
      return;
    }

    setIsRunning(true);
    runningRef.current = true;
    setActiveView("running");
    setStatusText("Bot is running...");

    // Sequential trade loop: wait for trade to finish, 1s pause, then next
    const runLoop = async () => {
      while (runningRef.current) {
        const success = await simulateTrade();
        if (!success || !runningRef.current) break;
        // 1 second pause between trades
        await new Promise((r) => setTimeout(r, 1000));
      }
    };
    runLoop();
  };

  const stopBot = () => {
    setIsRunning(false);
    runningRef.current = false;
    setTradePhase("idle");
    setStatusText("Bot stopped");
    if (intervalRef.current) {
      clearTimeout(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const resetStats = () => {
    setTransactions([]);
    setStats({ totalStake: 0, totalPayout: 0, runs: 0, contractsLost: 0, contractsWon: 0, totalProfitLoss: 0 });
  };

  useEffect(() => {
    return () => { if (intervalRef.current) clearTimeout(intervalRef.current); };
  }, []);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const currentDirections = config.tradeType === "Up/Down"
    ? TRADE_TYPES["Up/Down"].directions
    : DIGIT_DIRECTIONS[config.subType] || [];

  const tradeProgressValue = tradePhase === "idle" ? 0 : tradePhase === "starting" ? 25 : tradePhase === "running" ? 60 : 100;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border">
        <button onClick={() => navigate("/dashboard/options")} className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          {activeTab === "real" && !switching && (
            <div className="w-6 h-6 rounded-full overflow-hidden border border-border flex-shrink-0">
              <img src="https://flagcdn.com/w80/us.png" alt="USD" className="w-full h-full object-cover" />
            </div>
          )}
          {switching ? (
            <Skeleton className="h-5 w-20 rounded" />
          ) : (
            <span className="text-sm font-bold text-foreground">{balance.toFixed(2)} USD</span>
          )}
          <div className="flex bg-muted rounded-full p-0.5">
            {(["demo", "real"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => { if (!isRunning) { setActiveTab(tab); setSwitching(true); } }}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors capitalize ${activeTab === tab ? "bg-card text-foreground" : "text-muted-foreground"}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
        <button onClick={() => setShowTransfer(true)} className="flex flex-col items-center">
          <div className="w-9 h-9 rounded-full border border-primary flex items-center justify-center">
            <ArrowUpDown className="w-4 h-4 text-primary" />
          </div>
        </button>
      </header>

      {/* Sub-tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => { if (!isRunning) setActiveView("builder"); }}
          className={`flex-1 py-3 text-sm font-medium text-center border-b-2 transition-colors ${activeView === "builder" ? "border-primary text-foreground" : "border-transparent text-muted-foreground"}`}
        >
          🤖 Bot Builder
        </button>
        <button
          onClick={() => setActiveView("running")}
          className={`flex-1 py-3 text-sm font-medium text-center border-b-2 transition-colors ${activeView === "running" ? "border-primary text-foreground" : "border-transparent text-muted-foreground"}`}
        >
          📊 Results
        </button>
      </div>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-28">
        {activeView === "builder" ? (
          <div className="px-4 py-4 space-y-4">
            <div className="inline-block bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold">
              Quick strategy
            </div>

            {/* 1. Trade parameters */}
            <div className="rounded-xl overflow-hidden border border-border">
              <div className="bg-[hsl(var(--primary)/0.9)] text-primary-foreground px-4 py-2.5 text-sm font-semibold flex items-center gap-2">
                📋 1. Trade parameters
              </div>
              <div className="bg-card p-4 space-y-3">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Market:</span>
                  <span className="bg-muted px-3 py-1 rounded-full text-xs font-medium">{config.market}</span>
                  <span className="text-muted-foreground">{">"}</span>
                  <span className="bg-muted px-3 py-1 rounded-full text-xs font-medium">{config.marketSub}</span>
                  <span className="text-muted-foreground">{">"}</span>
                  <select
                    value={config.index}
                    onChange={(e) => setConfig({ ...config, index: e.target.value })}
                    className="bg-muted px-3 py-1 rounded-full text-xs font-medium border-none outline-none appearance-none cursor-pointer"
                  >
                    {VOLATILITY_OPTIONS.map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Trade Type:</span>
                  <select
                    value={config.tradeType}
                    onChange={(e) => {
                      const tt = e.target.value as keyof typeof TRADE_TYPES;
                      const sub = TRADE_TYPES[tt].subTypes[0];
                      const dirs = tt === "Up/Down" ? TRADE_TYPES[tt].directions : DIGIT_DIRECTIONS[sub] || [];
                      setConfig({
                        ...config,
                        tradeType: tt,
                        subType: sub,
                        purchaseDirection: dirs[0] || "Rise",
                        contractType: tt === "Up/Down" ? config.contractType : "Both",
                      });
                    }}
                    className="bg-muted px-3 py-1 rounded-full text-xs font-medium border-none outline-none appearance-none cursor-pointer"
                  >
                    {Object.keys(TRADE_TYPES).map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <span className="text-muted-foreground">{">"}</span>
                  <select
                    value={config.subType}
                    onChange={(e) => {
                      const sub = e.target.value;
                      const dirs = config.tradeType === "Up/Down" ? TRADE_TYPES["Up/Down"].directions : DIGIT_DIRECTIONS[sub] || [];
                      setConfig({ ...config, subType: sub, purchaseDirection: dirs[0] || "Rise" });
                    }}
                    className="bg-muted px-3 py-1 rounded-full text-xs font-medium border-none outline-none appearance-none cursor-pointer"
                  >
                    {TRADE_TYPES[config.tradeType as keyof typeof TRADE_TYPES]?.subTypes.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                {config.tradeType === "Up/Down" && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Contract Type:</span>
                    <select
                      value={config.contractType}
                      onChange={(e) => setConfig({ ...config, contractType: e.target.value })}
                      className="bg-muted px-3 py-1 rounded-full text-xs font-medium border-none outline-none appearance-none cursor-pointer"
                    >
                      <option>Both</option>
                      <option>Rise only</option>
                      <option>Fall only</option>
                    </select>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Default Candle Interval:</span>
                  <span className="bg-muted px-3 py-1 rounded-full text-xs font-medium">{config.candleInterval}</span>
                </div>
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <input type="checkbox" checked={config.restartOnError} onChange={(e) => setConfig({ ...config, restartOnError: e.target.checked })} className="rounded" />
                  Restart buy/sell on error
                </label>
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <input type="checkbox" checked={config.restartLastTrade} onChange={(e) => setConfig({ ...config, restartLastTrade: e.target.checked })} className="rounded" />
                  Restart last trade on error ✓
                </label>
              </div>
            </div>

            {/* Run once at start */}
            <div className="rounded-xl overflow-hidden border border-border">
              <div className="bg-[hsl(var(--primary)/0.9)] text-primary-foreground px-4 py-2.5 text-sm font-semibold">
                Run once at start:
              </div>
              <div className="bg-card p-4">
                <div className="w-12 h-3 bg-primary/30 rounded-full" />
              </div>
            </div>

            {/* Trade options */}
            <div className="rounded-xl overflow-hidden border border-border">
              <div className="bg-[hsl(var(--primary)/0.9)] text-primary-foreground px-4 py-2.5 text-sm font-semibold">
                Trade options:
              </div>
              <div className="bg-card p-4 space-y-3">
                <div className="flex items-center gap-3 text-sm flex-wrap">
                  <span className="text-muted-foreground">Duration:</span>
                  <span className="bg-muted px-3 py-1 rounded-full text-xs font-medium">{config.duration}</span>
                  <input
                    type="number"
                    value={config.durationValue}
                    onChange={(e) => setConfig({ ...config, durationValue: parseInt(e.target.value) || 1 })}
                    className="w-12 bg-muted px-2 py-1 rounded text-xs text-center border-none outline-none"
                  />
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground">Stake: USD</span>
                  <input
                    type="number"
                    step="0.01"
                    value={config.stake}
                    onChange={(e) => setConfig({ ...config, stake: parseFloat(e.target.value) || 0.35 })}
                    className="w-16 bg-muted px-2 py-1 rounded text-xs text-center border-none outline-none"
                  />
                  <span className="text-xs text-muted-foreground">(min: 0.35 - max: 50000)</span>
                </div>
                {config.tradeType === "Digits" && (
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-muted-foreground">Digit prediction:</span>
                    <select
                      value={config.digitPrediction}
                      onChange={(e) => setConfig({ ...config, digitPrediction: parseInt(e.target.value) })}
                      className="bg-muted px-3 py-1 rounded-full text-xs font-medium border-none outline-none appearance-none cursor-pointer"
                    >
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* 2. Purchase conditions */}
            <div className="rounded-xl overflow-hidden border border-border">
              <div className="bg-[hsl(var(--primary)/0.9)] text-primary-foreground px-4 py-2.5 text-sm font-semibold flex items-center gap-2">
                🛒 2. Purchase conditions
              </div>
              <div className="bg-card p-4">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Purchase</span>
                  <select
                    value={config.purchaseDirection}
                    onChange={(e) => setConfig({ ...config, purchaseDirection: e.target.value })}
                    className="bg-muted px-3 py-1 rounded-full text-xs font-medium border-none outline-none appearance-none cursor-pointer"
                  >
                    {currentDirections.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 3. Sell conditions */}
            <div className="rounded-xl overflow-hidden border border-border">
              <div className="bg-[hsl(var(--primary)/0.9)] text-primary-foreground px-4 py-2.5 text-sm font-semibold flex items-center gap-2">
                🔄 3. Sell conditions
              </div>
              <div className="bg-card p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>if</span>
                  <span className="bg-muted px-3 py-1 rounded text-xs font-medium">Sell is available</span>
                  <span>then</span>
                </div>
              </div>
            </div>

            {/* 4. Restart trading conditions */}
            <div className="rounded-xl overflow-hidden border border-accent/30">
              <div className="bg-accent text-accent-foreground px-4 py-2.5 text-sm font-semibold flex items-center gap-2">
                🔁 4. Restart trading conditions
              </div>
              <div className="bg-card p-4">
                <span className="bg-muted px-3 py-1.5 rounded text-xs font-medium">Trade again</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="px-4 py-4">
            <div className="flex items-center justify-between mb-2">
              <button onClick={() => setActiveView("builder")} className="text-muted-foreground text-lg">▼</button>
              <button onClick={resetStats} className="text-sm text-muted-foreground border border-border px-3 py-1 rounded-lg">Reset</button>
            </div>

            <div className="flex border-b border-border mb-4">
              {(["summary", "transactions", "journal"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveResultTab(tab)}
                  className={`flex-1 py-2.5 text-sm font-medium text-center capitalize border-b-2 transition-colors ${activeResultTab === tab ? "border-primary text-foreground" : "border-transparent text-muted-foreground"}`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {activeResultTab === "transactions" && (
              <div>
                <div className="grid grid-cols-3 text-xs font-semibold text-muted-foreground border-b border-border pb-2 mb-2">
                  <span>Type</span>
                  <span>Entry/Exit spot</span>
                  <span className="text-right">Buy price and P/L</span>
                </div>
                {transactions.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">No transactions yet</p>
                ) : (
                  <div className="space-y-3">
                    {transactions.map((tx) => (
                      <div key={tx.id} className="grid grid-cols-3 items-center text-sm border-b border-border/50 pb-3">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-muted-foreground" />
                          {tx.direction === "rise" ? (
                            <ArrowUp className="w-4 h-4 text-primary" />
                          ) : (
                            <ArrowDown className="w-4 h-4 text-destructive" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-primary" />
                            <span className="text-foreground">{tx.entrySpot}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-muted-foreground" />
                            <span className="text-muted-foreground">{tx.settled ? tx.exitSpot : "—"}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-foreground">{tx.buyPrice.toFixed(2)} USD</p>
                          {tx.settled && tx.profitLoss !== null && (
                            <p className={tx.profitLoss >= 0 ? "text-green-500" : "text-destructive"}>
                              {tx.profitLoss >= 0 ? "+" : ""}{tx.profitLoss.toFixed(2)} USD
                            </p>
                          )}
                          {!tx.settled && <p className="text-muted-foreground text-xs">Pending...</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeResultTab === "summary" && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">Total stake</p>
                    <p className="text-sm font-bold text-foreground">{stats.totalStake.toFixed(2)} USD</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">Total payout</p>
                    <p className="text-sm font-bold text-foreground">{stats.totalPayout.toFixed(2)} USD</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">No. of runs</p>
                    <p className="text-sm font-bold text-foreground">{stats.runs}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">Contracts lost</p>
                    <p className="text-sm font-bold text-foreground">{stats.contractsLost}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">Contracts won</p>
                    <p className="text-sm font-bold text-foreground">{stats.contractsWon}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">Total profit/loss</p>
                    <p className={`text-sm font-bold ${stats.totalProfitLoss >= 0 ? "text-green-500" : "text-destructive"}`}>
                      {stats.totalProfitLoss >= 0 ? "+" : ""}{stats.totalProfitLoss.toFixed(2)} USD
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeResultTab === "journal" && (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Bot journal log will appear here.
              </div>
            )}
          </div>
        )}
      </main>

      {/* Bottom bar with analytics + progress + run button */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40">
        {/* P/L Analytics row */}
        {stats.runs > 0 && (
          <div className="px-4 pt-2 pb-1 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Trades: <span className="font-semibold text-foreground">{stats.runs}</span></span>
            <span className="text-muted-foreground">Won: <span className="font-semibold text-green-500">{stats.contractsWon}</span></span>
            <span className="text-muted-foreground">Lost: <span className="font-semibold text-destructive">{stats.contractsLost}</span></span>
            <span className={`font-bold ${stats.totalProfitLoss >= 0 ? "text-green-500" : "text-destructive"}`}>
              P/L: {stats.totalProfitLoss >= 0 ? "+" : ""}{stats.totalProfitLoss.toFixed(2)}
            </span>
          </div>
        )}

        {/* Trade progress bar */}
        {tradePhase !== "idle" && (
          <div className="px-4 py-1.5">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
              <span className={tradePhase === "starting" ? "text-primary font-semibold" : ""}>Starting trade</span>
              <span className={tradePhase === "running" ? "text-primary font-semibold" : ""}>Running trade</span>
              <span className={tradePhase === "completed" ? "text-primary font-semibold" : ""}>Trade completed</span>
            </div>
            <Progress value={tradeProgressValue} className="h-1.5" />
          </div>
        )}

        {/* Run/Stop button row */}
        <div className="px-4 py-3 flex items-center gap-3">
          {!isRunning ? (
            <button onClick={startBot} className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold text-sm hover:brightness-110 transition-all">
              <Play className="w-4 h-4" /> Run
            </button>
          ) : (
            <button onClick={stopBot} className="flex items-center gap-2 bg-destructive text-destructive-foreground px-6 py-3 rounded-xl font-semibold text-sm hover:brightness-110 transition-all">
              <Square className="w-4 h-4" /> Stop
            </button>
          )}
          <span className="text-sm text-muted-foreground flex-1 text-center">{statusText}</span>
        </div>
      </div>

      {/* Transfer Modal */}
      {showTransfer && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="bg-card w-full max-w-md rounded-t-2xl p-5 animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-foreground">Transfer funds</h3>
              <button onClick={() => setShowTransfer(false)}>
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setTransferDirection("to_options")}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${transferDirection === "to_options" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
              >
                USD → Options
              </button>
              <button
                onClick={() => setTransferDirection("from_options")}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${transferDirection === "from_options" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
              >
                Options → USD
              </button>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mb-2">
              <span>USD Wallet: {walletBalance.toFixed(2)}</span>
              <span>Options: {optionsBalance.toFixed(2)}</span>
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
              Available: {(transferDirection === "to_options" ? walletBalance : optionsBalance).toFixed(2)} USD
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

export default DashboardBot;
