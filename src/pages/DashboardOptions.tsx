import OptionsTab from "@/components/dashboard/OptionsTab";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

const OptionsPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"demo" | "real">(() => {
    const saved = localStorage.getItem("options_active_tab");
    return saved === "demo" || saved === "real" ? saved : "real";
  });
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!authLoading && user) {
      setLoading(false);
    }
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-xl font-bold text-primary">d</span>
        <div className="flex bg-muted rounded-full p-0.5">
          {(["demo", "real"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                if (tab !== activeTab) {
                  setSwitching(true);
                  setActiveTab(tab);
                  localStorage.setItem("options_active_tab", tab);
                }
              }}
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
      <main className="flex-1 overflow-y-auto">
          <OptionsTab
            key={activeTab}
            accountType={activeTab}
            onBalanceChange={() => {}}
            onLoaded={() => setSwitching(false)}
          />
      </main>
    </div>
  );
};

export default OptionsPage;
