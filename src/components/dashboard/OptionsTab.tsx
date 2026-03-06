import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpDown, TrendingUp, BarChart3, LineChart, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface OptionsTabProps {
  accountType: "demo" | "real";
  onBalanceChange?: () => void;
  onLoaded?: () => void;
}

const tradeTypes = [
  { icon: TrendingUp, label: "Accumulators" },
  { icon: BarChart3, label: "Turbos" },
  { icon: LineChart, label: "Vanilla options" },
];

const OptionsTab = ({ accountType, onBalanceChange, onLoaded }: OptionsTabProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferDirection, setTransferDirection] = useState<"to_options" | "from_options">("to_options");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferring, setTransferring] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [optionsBalance, setOptionsBalance] = useState(0);
  const [optionsAccountId, setOptionsAccountId] = useState<string | null>(null);
  const [parentAccountId, setParentAccountId] = useState<string | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [currency, setCurrency] = useState("USD");

  const fetchBalances = useCallback(async () => {
    if (!user) return;
    setBalanceLoading(true);
    const { data: accounts } = await supabase
      .from("accounts")
      .select("id, balance, type, currency")
      .eq("user_id", user.id)
      .eq("type", accountType);
    if (accounts && accounts.length > 0) {
      const account = accounts[0];
      setWalletBalance(account.balance);
      setParentAccountId(account.id);
      setCurrency(account.currency);
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
    setBalanceLoading(false);
    onLoaded?.();
  }, [user, accountType]);

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
    onBalanceChange?.();
  };

  return (
    <div className="px-4 pb-20 pt-4">
      <h1 className="text-xl font-bold text-foreground mb-6">Options trading</h1>

      {/* Balance & Transfer */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          {accountType === "real" && !balanceLoading && (
            <div className="w-8 h-8 rounded-full overflow-hidden border border-border flex-shrink-0">
              <img src="https://flagcdn.com/w80/us.png" alt="USD" className="w-full h-full object-cover" />
            </div>
          )}
          <div>
            {balanceLoading ? (
              <>
                <Skeleton className="h-6 w-28 mb-1" />
                <Skeleton className="h-3 w-20" />
              </>
            ) : (
              <>
                <p className="text-xl font-bold text-foreground">
                  {optionsBalance.toFixed(2)} {currency} <span className="text-muted-foreground text-sm">▼</span>
                </p>
                <p className="text-xs text-muted-foreground">Options account</p>
              </>
            )}
          </div>
        </div>
        <button onClick={() => setShowTransfer(true)} className="flex flex-col items-center gap-1">
          <div className="w-12 h-12 rounded-full border border-primary flex items-center justify-center">
            <ArrowUpDown className="w-5 h-5 text-primary" />
          </div>
          <span className="text-xs text-primary font-medium">Transfer</span>
        </button>
      </div>

      {/* Deriv Trader Card */}
      <div className="bg-card rounded-2xl border border-border p-5 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">DT</span>
          </div>
          <div>
            <p className="font-bold text-foreground">Deriv Trader</p>
            <p className="text-sm text-muted-foreground">Diverse trading options, low-entry costs.</p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-3">Trade types:</p>
        <div className="flex gap-3 mb-5 overflow-x-auto">
          {tradeTypes.map((type) => (
            <div
              key={type.label}
              className="flex-shrink-0 bg-muted rounded-xl px-5 py-3 flex flex-col items-center gap-2 min-w-[100px]"
            >
              <type.icon className="w-5 h-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground whitespace-nowrap">{type.label}</span>
            </div>
          ))}
        </div>

        <button className="w-full py-3 bg-primary text-primary-foreground rounded-full font-semibold text-sm hover:brightness-110 transition-all">
          Trade
        </button>
      </div>

      {/* Deriv Bot Card */}
      <div
        onClick={() => navigate("/dashboard/bot")}
        className="bg-card rounded-2xl border border-border p-5 mb-4 cursor-pointer hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">DB</span>
          </div>
          <div>
            <p className="font-bold text-foreground">Deriv Bot</p>
            <p className="text-sm text-muted-foreground">Automated trading with custom bots.</p>
          </div>
        </div>
      </div>

      {/* SmartTrader Card */}
      <div className="bg-card rounded-2xl border border-border p-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">ST</span>
          </div>
          <div>
            <p className="font-bold text-foreground">SmartTrader</p>
            <p className="text-sm text-muted-foreground">Simple interface for traders of all levels.</p>
          </div>
        </div>
      </div>

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
                onClick={() => setTransferDirection("to_options")}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  transferDirection === "to_options"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                USD → Options
              </button>
              <button
                onClick={() => setTransferDirection("from_options")}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  transferDirection === "from_options"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
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

export default OptionsTab;
