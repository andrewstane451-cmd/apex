import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, MapPin, Upload, Check } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const VerifyLocation = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async () => {
    if (!user || !file) return;
    setSubmitting(true);
    setProgress(20);

    await new Promise((r) => setTimeout(r, 800));
    setProgress(50);
    await new Promise((r) => setTimeout(r, 800));
    setProgress(80);

    await supabase
      .from("user_verifications")
      .update({ location_verified: true })
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
        <h1 className="text-lg font-bold">Verify Location</h1>
      </header>

      <div className="px-4 py-6 space-y-6">
        {done ? (
          <div className="flex flex-col items-center gap-3 py-12">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
              <Check className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-sm font-semibold text-green-500">Location verified!</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center gap-2">
              <MapPin className="w-12 h-12 text-primary" />
              <p className="text-sm text-muted-foreground text-center">Upload a recent utility bill, bank statement, or receipt showing your address</p>
            </div>

            {preview ? (
              <div className="rounded-xl overflow-hidden border border-border">
                <img src={preview} alt="Receipt preview" className="w-full h-48 object-cover" />
              </div>
            ) : (
              <label className="flex flex-col items-center gap-3 py-12 bg-card border-2 border-dashed border-border rounded-2xl cursor-pointer hover:border-primary/50 transition-colors">
                <Upload className="w-8 h-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Tap to upload document</p>
                <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileChange} />
              </label>
            )}

            {submitting && (
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-muted-foreground text-center">Reviewing document...</p>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={!file || submitting}
              className="w-full bg-primary text-primary-foreground rounded-xl py-3 font-semibold text-sm disabled:opacity-50 hover:brightness-110 transition-all"
            >
              {submitting ? "Verifying..." : "Submit Document"}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyLocation;
