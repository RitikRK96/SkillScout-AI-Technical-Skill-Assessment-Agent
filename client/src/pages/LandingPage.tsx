import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowRight, FileText, Bot, Target, Sparkles, Zap, Shield, LayoutDashboard, LogOut } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import api from "../lib/axios";

const LandingPage = () => {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
      logout();
      navigate("/");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafbff] flex flex-col overflow-hidden">
      {/* Subtle background pattern */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-100/40 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-100/30 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <header className="py-5 px-6 bg-white/60 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200/50">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black text-gray-900 tracking-tight">SkillScout</span>
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                
                <Button 
                  className="bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200/50 rounded-xl px-5 gap-2"
                  onClick={() => navigate("/dashboard")}
                >
                  <LayoutDashboard className="w-4 h-4" /> Go to Dashboard
                </Button>
                <Button 
                  variant="ghost" 
                  className="text-red-600 hover:bg-red-200 hover:text-red-700 shadow-md shadow-red-200/50 gap-2" 
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4" /> Logout
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" className="text-gray-600 hover:text-gray-900" onClick={() => navigate("/auth")}>
                  Sign In
                </Button>
                <Button 
                  className="bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200/50 rounded-xl px-5"
                  onClick={() => navigate("/auth")}
                >
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24">
        <div className="max-w-7xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-8">
            <Zap className="w-4 h-4" />
            AI-Powered Skill Assessment
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tight mb-6 max-w-5xl mx-auto leading-[1.1]">
            Prove What You Know.{" "}
            <span className="text-indigo-600">
              Learn What You Don't.
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto mb-12 leading-relaxed">
            AI-powered skill assessments that feel like a conversation, not a quiz.
            Upload your resume and the job description — we'll assess your readiness 
            and build a personalised learning roadmap.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {isAuthenticated ? (
              <Button 
                size="lg" 
                className="h-14 px-8 text-lg rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-200/50 hover:shadow-2xl hover:shadow-indigo-300/50 transition-all duration-300" 
                onClick={() => navigate("/dashboard")}
              >
                Go to Dashboard <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            ) : (
              <Button 
                size="lg" 
                className="h-14 px-8 text-lg rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-200/50 hover:shadow-2xl hover:shadow-indigo-300/50 transition-all duration-300" 
                onClick={() => navigate("/auth")}
              >
                Start Your Assessment <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            )}
            <Button 
              variant="outline" 
              size="lg" 
              className="h-14 px-8 text-lg rounded-xl border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
            >
              See How It Works
            </Button>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 md:gap-16 mt-16 text-center">
            <div>
              <div className="text-3xl font-black text-gray-900">5 min</div>
              <div className="text-sm text-gray-400 mt-1">Setup Time</div>
            </div>
            <div className="w-px h-10 bg-gray-200" />
            <div>
              <div className="text-3xl font-black text-gray-900">AI</div>
              <div className="text-sm text-gray-400 mt-1">Adaptive Questions</div>
            </div>
            <div className="w-px h-10 bg-gray-200" />
            <div>
              <div className="text-3xl font-black text-gray-900">PDF</div>
              <div className="text-sm text-gray-400 mt-1">Export Reports</div>
            </div>
          </div>
        </div>
      </main>

      {/* How it works */}
      <section id="how-it-works" className="py-24 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">How It Works</h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">Three simple steps to discover your strengths, uncover your gaps, and get a roadmap to success.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: FileText,
                step: "01",
                title: "Upload Documents",
                desc: "Paste the job description and your resume. Our AI instantly extracts required skills and maps them against your experience.",
                color: "from-blue-500 to-indigo-600",
                bg: "bg-blue-50",
                border: "border-blue-100",
              },
              {
                icon: Bot,
                step: "02",
                title: "Chat Assessment",
                desc: "Have a dynamic, technical conversation with SkillScout. It probes for depth and understanding, adapting to your answers in real-time.",
                color: "from-indigo-500 to-purple-600",
                bg: "bg-indigo-50",
                border: "border-indigo-100",
              },
              {
                icon: Target,
                step: "03",
                title: "Get Your Plan",
                desc: "Receive a detailed gap analysis scorecard and a week-by-week, curated learning roadmap to get you interview-ready.",
                color: "from-purple-500 to-pink-600",
                bg: "bg-purple-50",
                border: "border-purple-100",
              },
            ].map((item) => (
              <div
                key={item.step}
                className={`relative ${item.bg} ${item.border} border rounded-2xl p-8 hover:shadow-lg hover:-translate-y-1 transition-all duration-300`}
              >
                <div className="text-6xl font-black text-gray-100 absolute top-4 right-6 select-none">{item.step}</div>
                <div className={`w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center mb-5 shadow-lg`}>
                  <item.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="py-16 bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-emerald-500" />
              <span className="text-gray-600 font-medium">Your data stays private</span>
            </div>
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-amber-500" />
              <span className="text-gray-600 font-medium">Powered by Azure OpenAI</span>
            </div>
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-indigo-500" />
              <span className="text-gray-600 font-medium">Adaptive AI questioning</span>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-white border-t border-gray-100 py-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-black text-gray-900 tracking-tight">SkillScout</span>
            </div>
            <p className="text-sm text-gray-400">
              Built by{" "}
              <span className="font-semibold text-gray-600">Ritik Kumar</span>
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://github.com/RitikRK96"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12Z"/></svg>
                GitHub
              </a>
              <a
                href="https://www.linkedin.com/in/ritikkumar08/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#0077B5] transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                LinkedIn
              </a>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-gray-100 text-center text-xs text-gray-400">
            © 2026 SkillScout AI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
