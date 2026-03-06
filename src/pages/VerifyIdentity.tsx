import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Check, Loader2, CameraIcon } from "lucide-react";

type Step = "scan" | "uploading" | "done";

const VerifyIdentity = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("scan");
  const [statusText, setStatusText] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraReady, setCameraReady] = useState(false);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraReady(true);
    } catch {
      setStatusText("Camera access denied. Please allow camera access.");
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const captureAndUpload = async () => {
    if (!videoRef.current || !canvasRef.current || !user) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    streamRef.current?.getTracks().forEach((t) => t.stop());
    setCameraReady(false);
    setStep("uploading");
    setStatusText("Uploading your ID...");

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", 0.85)
    );
    if (!blob) {
      setStatusText("Capture failed. Please try again.");
      setStep("scan");
      startCamera();
      return;
    }

    const file = new File([blob], `id-capture-${Date.now()}.jpg`, { type: "image/jpeg" });
    const filePath = `${user.id}/${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("id-documents")
      .upload(filePath, file);

    if (uploadError) {
      setStatusText("Upload failed. Please try again.");
      setStep("scan");
      startCamera();
      return;
    }

    // Save the image path and mark identity as verified
    const { data: urlData } = supabase.storage.from("id-documents").getPublicUrl(filePath);

    await supabase
      .from("user_verifications")
      .update({
        identity_verified: true,
        id_image_url: urlData.publicUrl || filePath,
      })
      .eq("user_id", user.id);

    setStatusText("ID uploaded successfully!");
    setStep("done");
    setTimeout(() => navigate("/dashboard/profile"), 1200);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <canvas ref={canvasRef} className="hidden" />

      <header className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <button onClick={() => { streamRef.current?.getTracks().forEach((t) => t.stop()); navigate("/dashboard/profile"); }} className="p-1">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold">Verify Identity</h1>
      </header>

      <div className="px-4 py-6 space-y-6">
        {step === "scan" && (
          <>
            <div className="flex flex-col items-center gap-2">
              <CameraIcon className="w-10 h-10 text-primary" />
              <p className="text-sm font-semibold text-center">Hold your ID in front of the camera</p>
              <p className="text-xs text-muted-foreground text-center">Make sure all details are clearly visible</p>
            </div>

            <div className="relative rounded-2xl overflow-hidden border-2 border-primary bg-black aspect-[3/2]">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-primary rounded-tl-lg" />
                <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-primary rounded-tr-lg" />
                <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-primary rounded-bl-lg" />
                <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-primary rounded-br-lg" />
              </div>
              {!cameraReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
              )}
            </div>

            <button
              onClick={captureAndUpload}
              disabled={!cameraReady}
              className="w-full bg-primary text-primary-foreground rounded-xl py-3 font-semibold text-sm disabled:opacity-50 hover:brightness-110 transition-all flex items-center justify-center gap-2"
            >
              <CameraIcon className="w-4 h-4" />
              Capture ID
            </button>
          </>
        )}

        {step === "uploading" && (
          <div className="flex flex-col items-center gap-4 py-12">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">{statusText}</p>
          </div>
        )}

        {step === "done" && (
          <div className="flex flex-col items-center gap-3 py-12">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
              <Check className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-sm font-semibold text-green-500">{statusText}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyIdentity;
