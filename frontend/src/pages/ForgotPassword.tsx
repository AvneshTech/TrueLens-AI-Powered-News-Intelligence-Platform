import { useState } from "react";
import { Link } from "react-router-dom";
import { apiService } from "../services/apiService";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { toast } from "sonner";
import { Loader2, MailCheck } from "lucide-react";

export const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email");
      return;
    }
    setLoading(true);
    try {
      const res = await apiService.forgotPassword(email);
      setSent(true);
      toast.success(res.message || "If an account exists, a reset link has been sent.");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card className="border-zinc-200 dark:border-zinc-800">
        <CardHeader className="pb-4 sm:pb-6">
          <CardTitle className="text-xl sm:text-2xl">Forgot password</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Enter your email and we'll send you a reset link.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {sent ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <MailCheck className="w-10 h-10 text-green-600" />
              <p className="text-sm text-zinc-600 dark:text-zinc-300">
                If an account exists for <span className="font-medium">{email}</span>,
                a password-reset link is on its way. The link expires in 1 hour.
              </p>
              <Link to="/auth/login" className="text-blue-600 text-sm font-medium hover:underline">
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm">Email</Label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="text-sm"
                />
              </div>

              <Button type="submit" className="w-full text-sm sm:text-base" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send reset link"
                )}
              </Button>

              <p className="text-center text-xs sm:text-sm text-zinc-600">
                Remembered it?{" "}
                <Link to="/auth/login" className="text-blue-600 font-medium hover:underline">
                  Sign in
                </Link>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword;
