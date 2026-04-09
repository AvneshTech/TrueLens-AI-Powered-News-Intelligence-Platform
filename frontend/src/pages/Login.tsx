import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Checkbox } from "../components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff } from "lucide-react";

export const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Email and password required");
      return;
    }

    setLoading(true);

    try {
      const data = await login(email, password, rememberMe);

      toast.success("Welcome 👋");
      navigate("/");

    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card className="border-zinc-200 dark:border-zinc-800">
        <CardHeader className="pb-4 sm:pb-6">
          <CardTitle className="text-xl sm:text-2xl">Welcome back</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-3 sm:space-y-4">

            {/* Email */}
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

            {/* Password */}
            <div className="space-y-2">
              <Label className="text-xs sm:text-sm">Password</Label>

              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="text-sm pr-10"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember */}
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={rememberMe}
                onCheckedChange={(checked) =>
                  setRememberMe(checked as boolean)
                }
              />
              <span className="text-xs sm:text-sm">Remember me</span>
            </div>

            {/* Button */}
            <Button type="submit" className="w-full text-sm sm:text-base" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </Button>

            {/* 🔥 FIXED LINK */}
            <p className="text-center text-xs sm:text-sm text-zinc-600">
              Don't have an account?{" "}
              <Link
                to="/auth/register"   // ✅ FIXED
                className="text-blue-600 font-medium hover:underline"
              >
                Sign up
              </Link>
            </p>

            {/* Forgot Password */}
            <p className="text-center text-xs sm:text-sm text-zinc-600">
              <button
                type="button"
                onClick={() => toast.info("Forgot password feature coming soon!")}
                className="text-blue-600 font-medium hover:underline"
              >
                Forgot password?
              </button>
            </p>

          </form>
        </CardContent>
      </Card>
    </div>
  );
};