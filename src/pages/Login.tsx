import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Shield } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Signed in successfully");
      navigate("/dashboard");
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error("Enter your email first");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(error.message);
    else toast.success("Password reset email sent");
  };

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-card/95 px-4 py-3 backdrop-blur-md">
        <button onClick={() => navigate("/")} className="text-muted-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-display text-lg font-semibold text-foreground">Conductor Login</h1>
      </header>

      <div className="mx-auto max-w-sm px-4 py-12">
        <div className="mb-8 text-center">
          <Shield className="mx-auto mb-3 h-12 w-12 text-primary" />
          <h2 className="font-display text-xl font-semibold text-foreground">Welcome back</h2>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to access the Conductor Dashboard</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="conductor@njiapanda.org"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <button
          onClick={handleForgotPassword}
          className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground"
        >
          Forgot password?
        </button>
      </div>
    </div>
  );
};

export default Login;
