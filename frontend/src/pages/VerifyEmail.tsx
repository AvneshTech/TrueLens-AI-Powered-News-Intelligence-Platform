import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { apiService } from "../services/apiService";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { toast } from "sonner";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

type Status = "verifying" | "success" | "error";

export const VerifyEmail = () => {
  const [params] = useSearchParams();
  const token = params.get("token") || "";

  const [status, setStatus] = useState<Status>("verifying");
  const [message, setMessage] = useState("Verifying your email...");
  const [resendEmail, setResendEmail] = useState("");
  const [resending, setResending] = useState(false);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // guard against StrictMode double-invoke
    ran.current = true;

    if (!token) {
      setStatus("error");
      setMessage("This verification link is invalid or incomplete.");
      return;
    }

    apiService
      .verifyEmail(token)
      .then((res) => {
        setStatus("success");
        setMessage(res.message || "Email verified successfully. You can now log in.");
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err?.response?.data?.message || "Invalid or expired verification link.");
      });
  }, [token]);

  const handleResend = async () => {
    if (!resendEmail) {
      toast.error("Enter your email to resend the link");
      return;
    }
    setResending(true);
    try {
      const res = await apiService.resendVerification(resendEmail);
      toast.success(res.message || "Verification link sent.");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Could not resend link");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card className="border-zinc-200 dark:border-zinc-800">
        <CardHeader className="pb-4 sm:pb-6">
          <CardTitle className="text-xl sm:text-2xl">Email verification</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Confirming your TrueLens account
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            {status === "verifying" && <Loader2 className="w-10 h-10 animate-spin text-blue-600" />}
            {status === "success" && <CheckCircle2 className="w-10 h-10 text-green-600" />}
            {status === "error" && <XCircle className="w-10 h-10 text-red-600" />}

            <p className="text-sm text-zinc-600 dark:text-zinc-300">{message}</p>

            {status === "success" && (
              <Button asChild className="w-full mt-2">
                <Link to="/auth/login">Continue to sign in</Link>
              </Button>
            )}

            {status === "error" && (
              <div className="w-full space-y-2 mt-2">
                <Input
                  type="email"
                  placeholder="Resend link to your email"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  className="text-sm"
                />
                <Button onClick={handleResend} className="w-full" disabled={resending}>
                  {resending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Resend verification email"
                  )}
                </Button>
                <p className="text-center text-xs text-zinc-600">
                  <Link to="/auth/login" className="text-blue-600 font-medium hover:underline">
                    Back to sign in
                  </Link>
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyEmail;
