import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Minus, ArrowUpDown, ChevronRight, X, RotateCcw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Account {
  id: string;
  type: string;
  balance: number;
  currency: string;
}

interface TradingAccount {
  id: string;
  account_id: string;
  name: string;
  platform: string;
  balance: number;
  currency: string;
}

const DashboardWallets = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [tradingAccounts, setTradingAccounts] = useState<TradingAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"demo" | "real">("real");
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [transferDirection, setTransferDirection] = useState<"to_options" | "from_options">("to_options");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferring, setTransferring] = useState(false);
  const [resettingBalance, setResettingBalance] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [depositing, setDepositing] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [user, authLoading, navigate]);

  const fetchData = async (showSkeleton = false) => {
    if (!user) return;
    if (showSkeleton) setSwitching(true);
    setBalanceLoading(true);
    const { data: accountsData } = await supabase
      .from("accounts")
      .select("*")
      .eq("user_id", user.id);
    if (accountsData) {
      setAccounts(accountsData);
      const ids = accountsData.map((a) => a.id);
      const { data: tradingData } = await supabase
        .from("trading_accounts")
        .select("*")
        .in("account_id", ids);
      if (tradingData) setTradingAccounts(tradingData);
    }
    setLoading(false);
    setBalanceLoading(false);
    setSwitching(false);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(), 5000);
    return () => clearInterval(interval);
  }, [user]);

  const handleTabChange = (tab: "demo" | "real") => {
    if (tab === activeTab) return;
    setSwitching(true);
    setActiveTab(tab);
    setTimeout(() => setSwitching(false), 300);
  };

  const currentAccount = accounts.find((a) => a.type === activeTab);
  const currentTradingAccounts = tradingAccounts.filter(
    (ta) => ta.account_id === currentAccount?.id
  );
  const optionsAccount = currentTradingAccounts.find((ta) => ta.platform === "Options");

  const handleTransfer = async () => {
    const amount = parseFloat(transferAmount);
    if (!amount || amount <= 0 || !currentAccount || !optionsAccount) return;
    if (transferDirection === "to_options" && amount > currentAccount.balance) return;
    if (transferDirection === "from_options" && amount > optionsAccount.balance) return;

    setTransferring(true);
    const newWallet = transferDirection === "to_options"
      ? parseFloat((currentAccount.balance - amount).toFixed(2))
      : parseFloat((currentAccount.balance + amount).toFixed(2));
    const newOptions = transferDirection === "to_options"
      ? parseFloat((optionsAccount.balance + amount).toFixed(2))
      : parseFloat((optionsAccount.balance - amount).toFixed(2));

    await Promise.all([
      supabase.from("accounts").update({ balance: newWallet }).eq("id", currentAccount.id),
      supabase.from("trading_accounts").update({ balance: newOptions }).eq("id", optionsAccount.id),
    ]);

    setAccounts((prev) =>
      prev.map((a) => (a.id === currentAccount.id ? { ...a, balance: newWallet } : a))
    );
    setTradingAccounts((prev) =>
      prev.map((ta) => (ta.id === optionsAccount.id ? { ...ta, balance: newOptions } : ta))
    );
    setTransferAmount("");
    setTransferring(false);
    setShowTransfer(false);
  };

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (!amount || amount <= 0 || !currentAccount) return;
    setDepositing(true);
    const newBalance = parseFloat((currentAccount.balance + amount).toFixed(2));
    await supabase.from("accounts").update({ balance: newBalance }).eq("id", currentAccount.id);
    setAccounts((prev) =>
      prev.map((a) => (a.id === currentAccount.id ? { ...a, balance: newBalance } : a))
    );
    setDepositAmount("");
    setDepositing(false);
    setShowDeposit(false);
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0 || !currentAccount || amount > currentAccount.balance) return;
    setWithdrawing(true);
    const newBalance = parseFloat((currentAccount.balance - amount).toFixed(2));
    await supabase.from("accounts").update({ balance: newBalance }).eq("id", currentAccount.id);
    setAccounts((prev) =>
      prev.map((a) => (a.id === currentAccount.id ? { ...a, balance: newBalance } : a))
    );
    setWithdrawAmount("");
    setWithdrawing(false);
    setShowWithdraw(false);
  };

  const handleResetDemoBalance = async () => {
    if (!currentAccount || activeTab !== "demo") return;
    setResettingBalance(true);
    await supabase
      .from("accounts")
      .update({ balance: 10000 })
      .eq("id", currentAccount.id);
    setAccounts((prev) =>
      prev.map((a) => (a.id === currentAccount.id ? { ...a, balance: 10000 } : a))
    );
    setResettingBalance(false);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20">
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
        <div className="w-9" />
      </header>

      <main className="flex-1 overflow-y-auto px-4 pt-4">
        {switching ? (
          <div className="space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-36 w-full rounded-2xl" />
            <Skeleton className="h-6 w-28" />
            <div className="flex gap-3">
              <Skeleton className="flex-1 h-16 rounded-2xl" />
              <Skeleton className="flex-1 h-16 rounded-2xl" />
              <Skeleton className="flex-1 h-16 rounded-2xl" />
            </div>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-20 w-full rounded-2xl" />
          </div>
        ) : (
          <>
            <h1 className="text-xl font-bold text-foreground mb-4">My Wallets</h1>

            {/* USD Wallet Card */}
            <div className="bg-card rounded-2xl border border-border p-5 mb-4">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-3xl">🇺🇸</span>
                <div>
                  <p className="text-sm text-muted-foreground">USD Wallet</p>
                  {balanceLoading ? (
                    <Skeleton className="h-8 w-32 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold text-foreground">
                      {currentAccount?.balance?.toFixed(2) ?? "0.00"} USD
                    </p>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-6 mt-5">
                {activeTab === "real" ? (
                  <>
                    <button onClick={() => setShowDeposit(true)} className="flex flex-col items-center gap-1.5">
                      <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                        <Plus className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <span className="text-xs text-muted-foreground">Deposit</span>
                    </button>
                    <button onClick={() => setShowWithdraw(true)} className="flex flex-col items-center gap-1.5">
                      <div className="w-12 h-12 rounded-full border border-border flex items-center justify-center">
                        <Minus className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <span className="text-xs text-muted-foreground">Withdraw</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleResetDemoBalance}
                    disabled={resettingBalance}
                    className="flex flex-col items-center gap-1.5"
                  >
                    <div className="w-12 h-12 rounded-full border border-border flex items-center justify-center">
                      <RotateCcw className={`w-5 h-5 text-muted-foreground ${resettingBalance ? "animate-spin" : ""}`} />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {resettingBalance ? "Resetting..." : "Reset Balance"}
                    </span>
                  </button>
                )}
                <button onClick={() => setShowTransfer(true)} className="flex flex-col items-center gap-1.5">
                  <div className="w-12 h-12 rounded-full border border-border flex items-center justify-center">
                    <ArrowUpDown className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <span className="text-xs text-muted-foreground">Transfer</span>
                </button>
              </div>
            </div>

            {/* More Wallets */}
            <h2 className="text-lg font-bold text-foreground mb-3">More Wallets</h2>
            <div className="flex gap-3 mb-6 overflow-x-auto">
              {[
                { icon: "₿", label: "BTC Wallet", bg: "bg-amber-500" },
                { icon: "◆", label: "ETH Wallet", bg: "bg-indigo-500" },
                { icon: "Ł", label: "LTC Wallet", bg: "bg-muted" },
              ].map((wallet) => (
                <div
                  key={wallet.label}
                  className="flex-shrink-0 bg-card rounded-2xl border border-border p-4 flex items-center gap-3 min-w-[140px]"
                >
                  <div className={`w-10 h-10 ${wallet.bg} rounded-full flex items-center justify-center`}>
                    <span className="text-sm font-bold text-primary-foreground">{wallet.icon}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">{wallet.label}</p>
                  </div>
                  <Plus className="w-4 h-4 text-muted-foreground" />
                </div>
              ))}
            </div>

            {/* Other payment methods */}
            <h2 className="text-lg font-bold text-foreground mb-3">Other payment methods</h2>
            <div className="flex gap-3 mb-6">
              {[
                { icon: "P2P", label: "Deriv P2P", bg: "bg-destructive" },
                { icon: "$", label: "Payment agent", bg: "bg-muted" },
              ].map((method) => (
                <div
                  key={method.label}
                  className="flex-1 bg-card rounded-2xl border border-border p-4 flex items-center gap-3"
                >
                  <div className={`w-10 h-10 ${method.bg} rounded-full flex items-center justify-center`}>
                    <span className="text-xs font-bold text-primary-foreground">{method.icon}</span>
                  </div>
                  <p className="text-sm font-bold text-foreground flex-1">{method.label}</p>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              ))}
            </div>

            {/* Trading accounts summary */}
            {currentTradingAccounts.length > 0 && (
              <>
                <h2 className="text-lg font-bold text-foreground mb-3">Trading accounts</h2>
                <div className="space-y-3 mb-6">
                  {currentTradingAccounts.map((ta) => (
                    <div
                      key={ta.id}
                      className="bg-card rounded-2xl p-4 border border-border flex items-center gap-4"
                    >
                      <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                        <span className="text-xs font-bold text-primary-foreground">{ta.platform.slice(0, 2)}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-foreground">{ta.name}</p>
                        <p className="text-xs text-muted-foreground">{ta.platform}</p>
                      </div>
                      <p className="text-sm font-bold text-foreground">{ta.balance.toFixed(2)} {ta.currency}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
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
              <span>USD Wallet: {currentAccount?.balance?.toFixed(2) ?? "0.00"}</span>
              <span>Options: {optionsAccount?.balance?.toFixed(2) ?? "0.00"}</span>
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
              Available: {(transferDirection === "to_options" ? (currentAccount?.balance ?? 0) : (optionsAccount?.balance ?? 0)).toFixed(2)} USD
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

      {/* Deposit Modal */}
      {showDeposit && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-2xl p-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-foreground">Deposit funds</h3>
              <button onClick={() => setShowDeposit(false)}>
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Current balance: <span className="font-semibold text-foreground">{currentAccount?.balance?.toFixed(2) ?? "0.00"} USD</span>
            </p>
            <input
              type="number"
              step="0.01"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder="Enter deposit amount"
              className="w-full bg-muted rounded-xl px-4 py-3 text-foreground text-sm mb-4 outline-none border border-border focus:border-primary"
            />
            <button
              onClick={handleDeposit}
              disabled={depositing || !depositAmount || parseFloat(depositAmount) <= 0}
              className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50"
            >
              {depositing ? "Depositing..." : "Deposit"}
            </button>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdraw && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-2xl p-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-foreground">Withdraw funds</h3>
              <button onClick={() => setShowWithdraw(false)}>
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-1">
              Available balance: <span className="font-semibold text-foreground">{currentAccount?.balance?.toFixed(2) ?? "0.00"} USD</span>
            </p>
            <input
              type="number"
              step="0.01"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder="Enter withdraw amount"
              className="w-full bg-muted rounded-xl px-4 py-3 text-foreground text-sm mb-2 outline-none border border-border focus:border-primary mt-3"
            />
            {withdrawAmount && parseFloat(withdrawAmount) > (currentAccount?.balance ?? 0) && (
              <p className="text-xs text-destructive mb-2">Insufficient balance</p>
            )}
            <button
              onClick={handleWithdraw}
              disabled={withdrawing || !withdrawAmount || parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > (currentAccount?.balance ?? 0)}
              className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50 mt-2"
            >
              {withdrawing ? "Withdrawing..." : "Withdraw"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardWallets;
