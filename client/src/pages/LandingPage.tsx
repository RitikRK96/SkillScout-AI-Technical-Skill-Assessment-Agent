import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { 
  ArrowRight, FileText, Bot, Target, Sparkles, Zap, 
  Shield, LayoutDashboard, LogOut, Mail, Phone 
} from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import api from "../lib/axios";
import { motion, AnimatePresence } from "framer-motion";

// ─── Interactive Chat Sandbox Widget ────────────────────────────────
const ChatDemoWidget = () => {
  const [messages, setMessages] = useState<Array<{ role: "agent" | "user"; text: string }>>([]);
  const [step, setStep] = useState(0);
  const [typing, setTyping] = useState(false);

  const demoScript = [
    {
      role: "agent" as const,
      text: "Welcome! Let's assess your React.js skills. How do you decide between Zustand, Redux, and Context API for state management?"
    },
    {
      role: "user" as const,
      text: "I prefer Zustand for simple, fast stores because it has zero boilerplate. I'd use Context API for lightweight settings, and Redux only if the team already relies on it."
    },
    {
      role: "agent" as const,
      text: "Zustand is indeed very developer-friendly. How do you handle performance optimization when a store gets frequently updated?"
    },
    {
      role: "user" as const,
      text: "I use selective selectors like useStore(state => state.value) so components only re-render when their specific slice of state changes."
    },
    {
      role: "agent" as const,
      text: "Spot on! That prevents unnecessary re-renders. Let's wrap this skill up. [SKILL_COMPLETE]"
    }
  ];

  useEffect(() => {
    if (step >= demoScript.length) {
      const resetTimeout = setTimeout(() => {
        setMessages([]);
        setStep(0);
      }, 5000);
      return () => clearTimeout(resetTimeout);
    }

    const currentItem = demoScript[step];
    setTyping(currentItem.role === "agent");

    const delay = currentItem.role === "agent" ? 1500 : 3000;

    const timer = setTimeout(() => {
      setMessages((prev) => [...prev, currentItem]);
      setTyping(false);
      setStep((s) => s + 1);
    }, delay);

    return () => clearTimeout(timer);
  }, [step]);

  return (
    <div className="bg-slate-900 border border-slate-800 shadow-2xl rounded-3xl w-full max-w-lg overflow-hidden text-left font-mono text-[13px] h-[340px] flex flex-col">
      {/* Widget Header */}
      <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-slate-400 text-xs font-semibold ml-2">SkillScout Terminal Assessment</span>
        </div>
        <div className="text-[10px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full font-bold">LIVE PREVIEW</div>
      </div>

      {/* Widget Messages */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto scrollbar-none flex flex-col justify-end">
        <AnimatePresence initial={false}>
          {messages.map((msg, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3 }}
              className={`flex ${msg.role === "agent" ? "justify-start" : "justify-end"}`}
            >
              <div
                className={`max-w-[85%] px-3.5 py-2 rounded-2xl ${
                  msg.role === "agent"
                    ? "bg-slate-850 text-slate-100 rounded-tl-sm border border-slate-700/50"
                    : "bg-indigo-600 text-white rounded-tr-sm"
                }`}
              >
                <div className="text-[9px] font-bold text-indigo-400 mb-1 uppercase tracking-wider">
                  {msg.role === "agent" ? "🤖 SkillScout" : "👤 You"}
                </div>
                <div className="leading-relaxed whitespace-pre-wrap">{msg.text}</div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {typing && (
          <div className="flex justify-start">
            <div className="bg-slate-850 text-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 border border-slate-700/50">
              <div className="flex gap-1.5 items-center">
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Landing Page Component ─────────────────────────────────────────
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
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-100/40 rounded-full blur-[120px] animate-pulse duration-10000" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-100/30 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <header className="py-5 px-6 bg-white/60 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2.5 group cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200/50 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black text-gray-900 tracking-tight">SkillScout</span>
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Button 
                  className="bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200/50 rounded-xl px-5 gap-2 transition-all hover:-translate-y-0.5"
                  onClick={() => navigate("/dashboard")}
                >
                  <LayoutDashboard className="w-4 h-4" /> Go to Dashboard
                </Button>
                <Button 
                  variant="ghost" 
                  className="text-red-600 hover:bg-red-50 hover:text-red-700 shadow-sm gap-2 transition-all" 
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
                  className="bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200/50 rounded-xl px-5 transition-all hover:-translate-y-0.5"
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-10 md:py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Side Copy */}
        <motion.div 
          className="lg:col-span-7 text-left space-y-5"
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-semibold px-4 py-1.5 rounded-full hover:bg-indigo-100 transition-colors cursor-default">
            <Zap className="w-4 h-4 text-amber-500" />
            AI-Powered Skill Assessment
          </div>

          <h1 className="text-5xl md:text-6xl font-black text-gray-900 tracking-tight leading-[1.05]">
            Prove What You Know.<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
              Learn What You Don't.
            </span>
          </h1>
          <p className="text-lg text-gray-500 max-w-xl leading-relaxed">
            AI-powered skill assessments that feel like a conversation, not a quiz.
            Upload your resume and the job description — we'll assess your readiness 
            and build a personalised learning roadmap.
          </p>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            {isAuthenticated ? (
              <Button 
                size="lg" 
                className="h-14 px-8 text-lg rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-200/50 hover:shadow-2xl hover:shadow-indigo-300/50 transition-all duration-300 hover:-translate-y-1 group" 
                onClick={() => navigate("/dashboard")}
              >
                Go to Dashboard <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            ) : (
              <Button 
                size="lg" 
                className="h-14 px-8 text-lg rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-200/50 hover:shadow-2xl hover:shadow-indigo-300/50 transition-all duration-300 hover:-translate-y-1 group" 
                onClick={() => navigate("/auth")}
              >
                Start Assessment <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            )}
            <Button 
              variant="outline" 
              size="lg" 
              className="h-14 px-8 text-lg rounded-xl border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-300 bg-white shadow-sm"
              onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
            >
              See How It Works
            </Button>
          </div>

          {/* Stats Bar */}
          <div className="flex items-center gap-6 md:gap-12 pt-6 border-t border-gray-100 mt-8">
            <div>
              <div className="text-3xl font-black text-gray-900">5 <span className="text-sm font-bold text-gray-400">MIN</span></div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">Setup Time</div>
            </div>
            <div className="w-px h-10 bg-gray-200" />
            <div>
              <div className="text-3xl font-black text-indigo-600">AI</div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">Adaptive Chat</div>
            </div>
            <div className="w-px h-10 bg-gray-200" />
            <div>
              <div className="text-3xl font-black text-gray-900">PDF</div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">Export Roadmaps</div>
            </div>
          </div>
        </motion.div>

        {/* Right Side Widget */}
        <motion.div 
          className="lg:col-span-5 flex justify-center lg:justify-end relative"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {/* Ambient Glow */}
          <div className="absolute -inset-4 bg-indigo-500/10 rounded-[40px] blur-2xl -z-10" />
          <ChatDemoWidget />
        </motion.div>
      </main>

      {/* How it works */}
      <section id="how-it-works" className="py-16 md:py-20 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-10 space-y-3">
            <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 tracking-tight">How It Works</h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">Three simple steps to discover your strengths, uncover your gaps, and get a roadmap to success.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: FileText,
                step: "01",
                title: "Upload Documents",
                desc: "Paste the job description and your resume. Our AI instantly extracts required skills and maps them against your experience.",
                bg: "bg-gradient-to-br from-blue-50/50 to-indigo-50/50",
                iconBg: "bg-blue-600",
                border: "border-blue-100/70",
              },
              {
                icon: Bot,
                step: "02",
                title: "Chat Assessment",
                desc: "Have a dynamic, technical conversation with SkillScout. It probes for depth and understanding, adapting to your answers in real-time.",
                bg: "bg-gradient-to-br from-indigo-50/50 to-purple-50/50",
                iconBg: "bg-indigo-600",
                border: "border-indigo-100/70",
              },
              {
                icon: Target,
                step: "03",
                title: "Get Your Plan",
                desc: "Receive a detailed gap analysis scorecard and a week-by-week, curated learning roadmap to get you interview-ready.",
                bg: "bg-gradient-to-br from-purple-50/50 to-pink-50/50",
                iconBg: "bg-purple-600",
                border: "border-purple-100/70",
              },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                className={`relative ${item.bg} ${item.border} border rounded-3xl p-8 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group`}
                initial={{ opacity: 0, y: 35 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
              >
                <div className="text-7xl font-black text-gray-900/5 absolute top-4 right-6 select-none group-hover:scale-110 transition-transform duration-500">{item.step}</div>
                <div className={`w-14 h-14 rounded-2xl ${item.iconBg} flex items-center justify-center mb-6 shadow-lg shadow-${item.iconBg.replace('bg-', '')}/30`}>
                  <item.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed font-medium">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="py-10 bg-slate-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.div 
            className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16"
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-full shadow-sm border border-gray-100">
              <Shield className="w-5 h-5 text-emerald-500" />
              <span className="text-gray-700 font-semibold">Your data stays private</span>
            </div>
            <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-full shadow-sm border border-gray-100">
              <Zap className="w-5 h-5 text-amber-500" />
              <span className="text-gray-700 font-semibold">Powered by Gemini AI</span>
            </div>
            <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-full shadow-sm border border-gray-100">
              <Sparkles className="w-5 h-5 text-indigo-500" />
              <span className="text-gray-700 font-semibold">Adaptive AI questioning</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-gray-100">
            {/* Column 1 - Brand */}
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-md">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg font-black text-gray-900 tracking-tight">SkillScout</span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
                Conversational AI-powered skill assessments and personalized learning plans.
              </p>
            </div>

            {/* Column 2 - Creator */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Creator</h4>
              <p className="text-sm text-gray-600 font-medium">
                Built by <span className="font-semibold text-gray-900">Ritik Kumar</span>
              </p>
              <div className="flex items-center gap-4">
                <a
                  href="https://github.com/RitikRK96"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12Z"/></svg>
                  GitHub
                </a>
                <a
                  href="https://www.linkedin.com/in/ritikkumar08/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-[#0077B5] transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                  LinkedIn
                </a>
              </div>
            </div>

            {/* Column 3 - Contact */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Contact</h4>
              <div className="space-y-2">
                <a href="mailto:ritikrk008@gmail.com" className="flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 transition-colors">
                  <Mail className="w-4 h-4 text-amber-600 shrink-0" />
                  ritikrk008@gmail.com
                </a>
                <a href="mailto:hello@ritik.world" className="flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 transition-colors">
                  <Mail className="w-4 h-4 text-amber-600 shrink-0" />
                  hello@ritik.world
                </a>
                <a href="tel:+919693895842" className="flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 transition-colors">
                  <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                  +91 96938 95842
                </a>
              </div>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-gray-100 text-center text-xs text-gray-400 font-medium">
            © 2026 SkillScout AI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
