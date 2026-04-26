import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useNavigate } from "react-router-dom";
import api from "../lib/axios";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const setUser = useAuthStore((state) => state.setUser);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const res = await api.post("/auth/login", { email, password });
        setUser(res.data.user);
        toast.success("Welcome back!");
      } else {
        const res = await api.post("/auth/register", { name, email, password });
        setUser(res.data.user);
        toast.success("Account created successfully!");
      }
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-indigo-700 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black tracking-tight">SkillScout</span>
          </div>
          <h2 className="text-4xl font-extrabold leading-tight mb-4">
            Discover your strengths.<br />
            <span className="text-indigo-200">Bridge the gaps.</span>
          </h2>
          <p className="text-indigo-100/80 text-lg leading-relaxed max-w-md">
            AI-powered conversations that assess your technical skills and build a personalised roadmap to your dream role.
          </p>
          <div className="flex gap-6 mt-12 text-sm text-indigo-200">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              Adaptive AI
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              Real-time Feedback
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-pink-400" />
              PDF Reports
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 px-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black text-gray-900 tracking-tight">SkillScout</span>
          </div>

          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
            {isLogin ? "Welcome back" : "Create your account"}
          </h1>
          <p className="text-gray-500 mb-8">
            {isLogin
              ? "Enter your credentials to access your assessments"
              : "Sign up to start your personalised learning journey"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-semibold text-gray-700">Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={!isLogin}
                  className="h-12 rounded-xl border-gray-200 bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-gray-700">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 rounded-xl border-gray-200 bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold text-gray-700">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 rounded-xl border-gray-200 bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-base font-semibold shadow-lg shadow-indigo-200/50 transition-all" 
              disabled={loading}
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Please wait...</>
              ) : isLogin ? "Sign In" : "Create Account"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium hover:underline transition-colors"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
