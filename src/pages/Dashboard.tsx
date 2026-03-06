import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { User, Plus, ChevronRight, AlertTriangle, Gift, X } from "lucide-react";
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

interface Profile {
  has_claimed_bonus: boolean;
  created_at: string;
}

const platformIcons: Record<string, { bg: string; label: string; color: string }> = {
  "Bitcoin": { bg: "bg-amber-500", label: "₿", color: "text-white" },
  "Options": { bg: "bg-orange-500", label: "⊞", color: "text-white" },
  "CFDs": { bg: "bg-blue-500", label: "📊", color: "text-white" },
};

const Dashboard = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"demo" | "real">("real");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [tradingAccounts, setTradingAccounts] = useState<TradingAccount[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [showBonusBanner, setShowBonusBanner] = useState(false);
  const [claimingBonus, setClaimingBonus] = useState(false);

  const isEmailVerified = user?.email_confirmed_at != null;

  const daysRemaining = useMemo(() => {
    if (!profile?.created_at || isEmailVerified) return null;
    const created = new Date(profile.created_at);
    const deadline = new Date(created.getTime() + 7 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const diff = Math.max(0, Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    return diff;
  }, [profile?.created_at, isEmailVerified]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  const fetchData = async (showSkeleton = false) => {
    if (!user) return;
    if (showSkeleton) setSwitching(true);
    const [accountsRes, profileRes] = await Promise.all([
      supabase.from("accounts").select("*").eq("user_id", user.id),
      supabase.from("profiles").select("has_claimed_bonus, created_at").eq("user_id", user.id).single(),
    ]);

    if (accountsRes.data) {
      setAccounts(accountsRes.data);
      const accountIds = accountsRes.data.map((a) => a.id);
      const { data: tradingData } = await supabase
        .from("trading_accounts")
        .select("*")
        .in("account_id", accountIds);
      if (tradingData) setTradingAccounts(tradingData);
    }

    if (profileRes.data) {
      setProfile(profileRes.data);
      setShowBonusBanner(!profileRes.data.has_claimed_bonus);
    }

    setLoading(false);
    setSwitching(false);
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const currentAccount = accounts.find((a) => a.type === activeTab);
  const currentTradingAccounts = tradingAccounts.filter(
    (ta) => ta.account_id === currentAccount?.id
  );

  const handleTabChange = (tab: "demo" | "real") => {
    if (tab === activeTab) return;
    setSwitching(true);
    setActiveTab(tab);
    // Data is already loaded, just switch view after brief skeleton
    setTimeout(() => setSwitching(false), 300);
  };

  const handleClaimBonus = async () => {
    if (!user || !currentAccount || activeTab !== "real") return;
    setClaimingBonus(true);

    await supabase
      .from("accounts")
      .update({ balance: currentAccount.balance + 1 })
      .eq("id", currentAccount.id);

    await supabase
      .from("profiles")
      .update({ has_claimed_bonus: true })
      .eq("user_id", user.id);

    setAccounts((prev) =>
      prev.map((a) => (a.id === currentAccount.id ? { ...a, balance: a.balance + 1 } : a))
    );
    setProfile((prev) => (prev ? { ...prev, has_claimed_bonus: true } : prev));
    setShowBonusBanner(false);
    setClaimingBonus(false);
  };

  const resendVerification = async () => {
    if (!user?.email) return;
    await supabase.auth.resend({ type: "signup", email: user.email });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-xl font-bold text-primary">d</span>
        <div className="flex bg-muted rounded-full p-0.5">
          <button
            onClick={() => handleTabChange("demo")}
            className={`px-5 py-1.5 text-sm font-medium rounded-full transition-colors ${
              activeTab === "demo" ? "bg-card text-foreground" : "text-muted-foreground"
            }`}
          >
            Demo
          </button>
          <button
            onClick={() => handleTabChange("real")}
            className={`px-5 py-1.5 text-sm font-medium rounded-full transition-colors ${
              activeTab === "real" ? "bg-card text-foreground" : "text-muted-foreground"
            }`}
          >
            Real
          </button>
        </div>
        <button onClick={() => navigate("/dashboard/profile")} className="w-9 h-9 rounded-full border border-border flex items-center justify-center">
          <User className="w-4 h-4 text-muted-foreground" />
        </button>
      </header>

      {/* Email verification warning */}
      {!isEmailVerified && daysRemaining !== null && (
        <div className="mx-4 mt-3 bg-destructive/10 border border-destructive/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-destructive">
                Verify your email — {daysRemaining} day{daysRemaining !== 1 ? "s" : ""} remaining
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Your account will be closed if email is not verified within 7 days.
              </p>
              <button
                onClick={resendVerification}
                className="mt-2 text-xs text-primary hover:underline font-medium"
              >
                Resend verification email
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bonus banner */}
      {showBonusBanner && activeTab === "real" && (
        <div className="mx-4 mt-3 bg-primary/10 border border-primary/30 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Gift className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-semibold text-foreground">Welcome bonus!</p>
                <p className="text-xs text-muted-foreground">Claim $1 to your real account</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleClaimBonus}
                disabled={claimingBonus}
                className="px-4 py-1.5 bg-primary text-primary-foreground rounded-full text-xs font-semibold hover:brightness-110 disabled:opacity-50"
              >
                {claimingBonus ? "Claiming..." : "Claim $1"}
              </button>
              <button onClick={() => setShowBonusBanner(false)}>
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-y-auto px-4 pb-20 pt-4">
        {switching ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-32 rounded-full" />
            <div className="flex gap-3">
              <Skeleton className="flex-1 h-32 rounded-2xl" />
              <Skeleton className="flex-1 h-32 rounded-2xl" />
            </div>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
          </div>
        ) : (
          <>
            {/* Add money */}
            {activeTab === "real" && (
              <button className="flex items-center gap-2 px-5 py-2.5 bg-primary rounded-full text-primary-foreground font-semibold text-sm mb-4 hover:brightness-110 transition-all">
                <Plus className="w-4 h-4" /> Add money
              </button>
            )}

            {/* Wallet card */}
            <div className="flex gap-3 mb-6">
              <div className="flex-1 bg-card rounded-2xl p-5 border border-border">
                <div className="text-2xl mb-1">🇺🇸</div>
                <p className="text-2xl font-bold text-foreground mt-3">
                  {currentAccount?.balance?.toFixed(2) ?? "0.00"}
                </p>
                <p className="text-sm text-muted-foreground">USD Wallet</p>
              </div>
              <div className="flex-1 bg-card rounded-2xl p-5 border border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:bg-muted/30 transition-colors">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-2">
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">More Wallets</p>
              </div>
            </div>

            {/* Trading accounts */}
            <h2 className="text-lg font-bold text-foreground mb-4">My trading accounts</h2>
            <div className="space-y-3">
              {currentTradingAccounts.map((ta) => {
                const key = `${ta.platform}-${ta.name}`;
                const icon = platformIcons[key] || platformIcons[ta.platform] || {
                  bg: "bg-muted",
                  label: ta.platform.slice(0, 2),
                  color: "text-foreground",
                };
                return (
                  <div
                    key={ta.id}
                    className="bg-card rounded-2xl p-4 border border-border flex items-center gap-4"
                  >
                    <div className={`w-12 h-12 ${icon.bg} rounded-xl flex items-center justify-center`}>
                      <span className={`text-xs font-bold ${icon.color}`}>{icon.label}</span>
                    </div>
                    <div>
                      <p className="text-base font-bold text-foreground">
                        {ta.balance.toFixed(2)} {ta.currency}
                      </p>
                      <p className="text-sm text-muted-foreground">{ta.name}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Suggested */}
            <h2 className="text-lg font-bold text-foreground mt-8 mb-4">Suggested for you</h2>
            <div className="bg-card rounded-2xl p-5 border border-border">
              <p className="text-sm text-muted-foreground">
                Start trading with our platform. Explore markets and build your portfolio.
              </p>
            </div>
          </>
        )}
      </main>

      {/* Sign out */}
      <button
        onClick={signOut}
        className="fixed top-3 right-16 text-xs text-muted-foreground hover:text-foreground"
      >
        Sign out
      </button>
    </div>
  );
};

export default Dashboard;
