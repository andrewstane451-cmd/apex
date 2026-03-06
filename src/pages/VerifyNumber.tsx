import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Phone, Check, MessageCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const VerifyNumber = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState("");

  const handleSendOTP = async () => {
    if (!phoneNumber || phoneNumber.length < 8) return;
    setSending(true);
    setProgress(50);

    // Simulate sending OTP via WhatsApp
    const code = String(Math.floor(1000 + Math.random() * 9000));
    setGeneratedOtp(code);

    await new Promise((r) => setTimeout(r, 1500));
    setProgress(100);
    setSending(false);
    setOtpSent(true);
    setProgress(0);
  };

  const handleVerifyOTP = async () => {
    if (!user || otp.length < 4) return;
    setVerifying(true);
    setProgress(30);

    await new Promise((r) => setTimeout(r, 500));
    setProgress(60);

    // Accept any 4-digit OTP for demo (in production this would verify against actual sent OTP)
    if (otp.length === 4) {
      await supabase
        .from("user_verifications")
        .update({ number_verified: true, phone_number: phoneNumber })
        .eq("user_id", user.id);

      setProgress(100);
      await new Promise((r) => setTimeout(r, 400));
      setDone(true);
      setTimeout(() => navigate("/dashboard/profile"), 1000);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <button onClick={() => navigate("/dashboard/profile")} className="p-1"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-lg font-bold">Verify Number</h1>
      </header>

      <div className="px-4 py-6 space-y-6">
        {done ? (
          <div className="flex flex-col items-center gap-3 py-12">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
              <Check className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-sm font-semibold text-green-500">Number verified!</p>
          </div>
        ) : !otpSent ? (
          <>
            <div className="flex flex-col items-center gap-2">
              <MessageCircle className="w-12 h-12 text-green-500" />
              <p className="text-sm text-muted-foreground text-center">Enter your WhatsApp number. We'll send a verification code.</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Phone Number</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1 234 567 8900"
                className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground"
              />
            </div>

            {sending && (
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-muted-foreground text-center">Sending OTP via WhatsApp...</p>
              </div>
            )}

            <button
              onClick={handleSendOTP}
              disabled={phoneNumber.length < 8 || sending}
              className="w-full bg-green-600 text-primary-foreground rounded-xl py-3 font-semibold text-sm disabled:opacity-50 hover:brightness-110 transition-all flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              {sending ? "Sending..." : "Send OTP via WhatsApp"}
            </button>
          </>
        ) : (
          <>
            <div className="flex flex-col items-center gap-2">
              <Phone className="w-12 h-12 text-primary" />
              <p className="text-sm text-muted-foreground text-center">Enter the 4-digit code sent to your WhatsApp</p>
              <p className="text-xs text-muted-foreground">Demo code: <span className="font-mono text-primary font-bold">{generatedOtp}</span></p>
            </div>

            <div className="flex justify-center">
              <InputOTP maxLength={4} value={otp} onChange={setOtp}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            {verifying && (
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-muted-foreground text-center">Verifying code...</p>
              </div>
            )}

            <button
              onClick={handleVerifyOTP}
              disabled={otp.length < 4 || verifying}
              className="w-full bg-primary text-primary-foreground rounded-xl py-3 font-semibold text-sm disabled:opacity-50 hover:brightness-110 transition-all"
            >
              {verifying ? "Verifying..." : "Verify Code"}
            </button>

            <button onClick={() => { setOtpSent(false); setOtp(""); }} className="w-full text-sm text-muted-foreground hover:text-foreground text-center">
              Change number
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyNumber;
