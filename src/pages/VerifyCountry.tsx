import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Globe, Check } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const countries = [
  "Afghanistan","Albania","Algeria","Argentina","Australia","Austria","Bangladesh","Belgium","Brazil","Canada",
  "China","Colombia","Denmark","Egypt","Finland","France","Germany","Ghana","Greece","India","Indonesia",
  "Iran","Iraq","Ireland","Israel","Italy","Japan","Kenya","Malaysia","Mexico","Morocco","Netherlands",
  "New Zealand","Nigeria","Norway","Pakistan","Peru","Philippines","Poland","Portugal","Russia","Saudi Arabia",
  "Singapore","South Africa","South Korea","Spain","Sweden","Switzerland","Thailand","Turkey","Uganda",
  "Ukraine","United Arab Emirates","United Kingdom","United States","Vietnam","Zimbabwe",
];

const VerifyCountry = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedCountry, setSelectedCountry] = useState("");
  const [detecting, setDetecting] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [progress, setProgress] = useState(0);

  // Auto-detect country
  useEffect(() => {
    const detect = async () => {
      try {
        const res = await fetch("https://ipapi.co/json/");
        const data = await res.json();
        if (data.country_name) setSelectedCountry(data.country_name);
      } catch {
        setSelectedCountry("United States");
      }
      setDetecting(false);
    };
    detect();
  }, []);

  const handleSubmit = async () => {
    if (!user || !selectedCountry) return;
    setSubmitting(true);
    setProgress(30);

    await new Promise((r) => setTimeout(r, 500));
    setProgress(70);

    await supabase
      .from("user_verifications")
      .update({ country_verified: true, country_name: selectedCountry })
      .eq("user_id", user.id);

    setProgress(100);
    await new Promise((r) => setTimeout(r, 400));
    setDone(true);
    setTimeout(() => navigate("/dashboard/profile"), 1000);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <button onClick={() => navigate("/dashboard/profile")} className="p-1"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-lg font-bold">Verify Country</h1>
      </header>

      <div className="px-4 py-6 space-y-6">
        {detecting ? (
          <div className="flex flex-col items-center gap-3 py-12">
            <Globe className="w-12 h-12 text-primary animate-pulse" />
            <p className="text-sm text-muted-foreground">Detecting your country...</p>
          </div>
        ) : done ? (
          <div className="flex flex-col items-center gap-3 py-12">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
              <Check className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-sm font-semibold text-green-500">Country verified!</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center gap-2">
              <Globe className="w-12 h-12 text-primary" />
              <p className="text-sm text-muted-foreground text-center">We detected your country. Confirm or change it below.</p>
            </div>

            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Select country</option>
              {countries.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {submitting && (
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-muted-foreground text-center">Verifying...</p>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={!selectedCountry || submitting}
              className="w-full bg-primary text-primary-foreground rounded-xl py-3 font-semibold text-sm disabled:opacity-50 hover:brightness-110 transition-all"
            >
              {submitting ? "Verifying..." : "Confirm Country"}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyCountry;
