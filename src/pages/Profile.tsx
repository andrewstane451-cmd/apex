import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, User, Mail, Calendar, Shield, Check, ChevronRight, LogOut, Globe, Camera, MapPin, Phone } from "lucide-react";

interface Verification {
  country_verified: boolean;
  country_name: string | null;
  identity_verified: boolean;
  location_verified: boolean;
  number_verified: boolean;
  phone_number: string | null;
}

interface ProfileData {
  full_name: string | null;
  email: string | null;
  created_at: string;
}

const verificationSteps = [
  { key: "country_verified" as const, label: "Verify Country", desc: "Confirm your country of residence", icon: Globe, path: "/dashboard/verify/country" },
  { key: "identity_verified" as const, label: "Verify Identity", desc: "Upload ID and capture face", icon: Camera, path: "/dashboard/verify/identity" },
  { key: "location_verified" as const, label: "Verify Location", desc: "Submit a utility bill or receipt", icon: MapPin, path: "/dashboard/verify/location" },
  { key: "number_verified" as const, label: "Verify Number", desc: "OTP sent to your WhatsApp", icon: Phone, path: "/dashboard/verify/number" },
];

const Profile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [verification, setVerification] = useState<Verification | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const [pRes, vRes] = await Promise.all([
        supabase.from("profiles").select("full_name, email, created_at").eq("user_id", user.id).single(),
        supabase.from("user_verifications").select("*").eq("user_id", user.id).single(),
      ]);
      if (pRes.data) setProfile(pRes.data);
      if (vRes.data) setVerification(vRes.data as unknown as Verification);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const completedCount = verification
    ? [verification.country_verified, verification.identity_verified, verification.location_verified, verification.number_verified].filter(Boolean).length
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <button onClick={() => navigate("/dashboard")} className="p-1">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold">Profile</h1>
      </header>

      <div className="px-4 py-6 space-y-6 pb-24">
        {/* Avatar + Info */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
            <User className="w-10 h-10 text-primary" />
          </div>
          <div className="text-center">
            <p className="text-lg font-bold">{profile?.full_name || "Trader"}</p>
            <p className="text-sm text-muted-foreground">{profile?.email || user?.email}</p>
          </div>
        </div>

        {/* Info Cards */}
        <div className="bg-card rounded-2xl border border-border divide-y divide-border">
          <div className="flex items-center gap-3 px-4 py-3">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="text-sm font-medium">{profile?.email || user?.email}</p>
            </div>
            {user?.email_confirmed_at && <Check className="w-4 h-4 text-green-500" />}
          </div>
          <div className="flex items-center gap-3 px-4 py-3">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Member since</p>
              <p className="text-sm font-medium">{profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "—"}</p>
            </div>
          </div>
        </div>

        {/* Verification Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <h2 className="text-base font-bold">Verification</h2>
            </div>
            <span className="text-xs text-muted-foreground">{completedCount}/4 completed</span>
          </div>

          {/* Progress */}
          <div className="flex gap-1.5 mb-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={`h-1.5 flex-1 rounded-full ${i < completedCount ? "bg-green-500" : "bg-muted"}`} />
            ))}
          </div>

          <div className="bg-card rounded-2xl border border-border divide-y divide-border">
            {verificationSteps.map((step) => {
              const done = verification?.[step.key] ?? false;
              return (
                <button
                  key={step.key}
                  onClick={() => !done && navigate(step.path)}
                  disabled={done}
                  className={`flex items-center gap-3 w-full px-4 py-3.5 text-left transition-colors ${done ? "opacity-70 cursor-default" : "hover:bg-muted/30 cursor-pointer"}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${done ? "bg-green-500/20" : "bg-primary/10"}`}>
                    {done ? <Check className="w-5 h-5 text-green-500" /> : <step.icon className="w-5 h-5 text-primary" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{step.label}</p>
                    <p className="text-xs text-muted-foreground">{done ? "Completed" : step.desc}</p>
                  </div>
                  {!done && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sign out */}
        <button
          onClick={signOut}
          className="flex items-center gap-3 w-full bg-card rounded-2xl border border-border px-4 py-3.5 text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-semibold">Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default Profile;
