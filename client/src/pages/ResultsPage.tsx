import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../lib/axios";
import type { AssessmentSession } from "@shared/types";
import { ScoreCard } from "../components/results/ScoreCard";
import { LearningPlanView } from "../components/results/LearningPlanView";
import { ExportButton } from "../components/results/ExportButton";
import { Button, buttonVariants } from "../components/ui/button";
import { cn } from "../lib/utils";
import { Loader2, Download, Copy, Share2, ArrowLeft, Sparkles, BarChart3, BookOpen, FileDown } from "lucide-react";
import toast from "react-hot-toast";

const ResultsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<AssessmentSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"scorecard" | "plan" | "export">("scorecard");

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const { data } = await api.get(`/assessments/${id}`);
        if (data.status !== "complete") {
          toast.error("Assessment not yet complete");
          navigate(`/assessment/${id}`);
          return;
        }
        setSession(data);
      } catch (error) {
        toast.error("Failed to load results");
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#fafbff]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!session || !session.learningPlan) return null;

  const { learningPlan, skillScores } = session;

  const handleCopySummary = () => {
    navigator.clipboard.writeText(learningPlan.executiveSummary);
    toast.success("Summary copied to clipboard!");
  };

  const getReadinessColor = (label: string) => {
    switch (label) {
      case "Strong Fit": return "text-emerald-700 bg-emerald-50 border-emerald-200";
      case "Promising Candidate": return "text-blue-700 bg-blue-50 border-blue-200";
      case "Needs Development": return "text-amber-700 bg-amber-50 border-amber-200";
      case "Significant Gap": return "text-red-700 bg-red-50 border-red-200";
      default: return "text-gray-700 bg-gray-100";
    }
  };

  const tabs = [
    { key: "scorecard" as const, label: "Scorecard", icon: BarChart3 },
    { key: "plan" as const, label: "Learning Plan", icon: BookOpen },
    { key: "export" as const, label: "Export", icon: FileDown },
  ];

  return (
    <div className="min-h-screen bg-[#fafbff] pb-20">
      {/* Subtle background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 right-1/3 w-[500px] h-[500px] bg-indigo-50/40 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-purple-50/30 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <div className="bg-white/70 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate("/dashboard")}
                className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <ArrowLeft className="w-4 h-4 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Assessment Results</h1>
                <div className="text-sm text-gray-500">{session.jobTitle} @ {session.companyName}</div>
              </div>
            </div>
            <div className="flex bg-gray-100/80 rounded-xl p-1 gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeTab === tab.key
                      ? "bg-white text-indigo-700 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-8">
        {activeTab === "scorecard" && (
          <div className="space-y-8">
            {/* Readiness Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-10 flex flex-col md:flex-row gap-8 items-center">
              {/* Score Ring */}
              <div className="shrink-0 relative w-44 h-44">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="52" stroke="#e5e7eb" strokeWidth="10" fill="none" />
                  <circle
                    cx="60" cy="60" r="52"
                    stroke="url(#scoreGradient)"
                    strokeWidth="10"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${(learningPlan.overallReadinessScore / 100) * 2 * Math.PI * 52} ${2 * Math.PI * 52}`}
                  />
                  <defs>
                    <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#a855f7" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-black text-gray-900">{learningPlan.overallReadinessScore}</span>
                  <span className="text-xs text-gray-400 font-medium">/ 100</span>
                </div>
              </div>

              <div className="flex-1 space-y-4 text-center md:text-left">
                <div className={`inline-block px-4 py-1.5 rounded-full font-bold text-sm border ${getReadinessColor(learningPlan.readinessLabel)}`}>
                  {learningPlan.readinessLabel}
                </div>
                <p className="text-gray-600 text-base leading-relaxed">
                  {learningPlan.executiveSummary}
                </p>
                <div className="flex gap-8 justify-center md:justify-start pt-4 border-t border-gray-100 mt-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{skillScores.length}</div>
                    <div className="text-xs text-gray-400 mt-0.5">Skills Assessed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{skillScores.filter(s => s.isGap).length}</div>
                    <div className="text-xs text-gray-400 mt-0.5">Gaps Found</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-indigo-600">{learningPlan.estimatedWeeksToReady}</div>
                    <div className="text-xs text-gray-400 mt-0.5">Weeks to Ready</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Skill Scores Grid */}
            <div className="grid lg:grid-cols-2 gap-5">
              {skillScores.map((score, idx) => (
                <ScoreCard key={idx} score={score} />
              ))}
            </div>
          </div>
        )}

        {activeTab === "plan" && <LearningPlanView plan={learningPlan} />}

        {activeTab === "export" && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center space-y-6">
              <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
                <Download className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900">Export Your Results</h2>
              <p className="text-gray-500 max-w-md mx-auto">
                Take your personalised learning plan and skill scorecard with you. Use it to guide your studies or share it with a mentor.
              </p>
              
              <div className="grid gap-4 pt-4">
                <ExportButton 
                  plan={learningPlan} 
                  scores={skillScores} 
                  jobTitle={session.jobTitle} 
                  className={cn(buttonVariants({ size: "lg" }), "w-full text-lg h-14 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200/50")}
                />
                <Button size="lg" variant="outline" className="w-full gap-2 text-lg h-14 rounded-xl" onClick={handleCopySummary}>
                  <Copy className="w-5 h-5" /> Copy Executive Summary
                </Button>
                <Button size="lg" variant="secondary" className="w-full gap-2 text-lg h-14 rounded-xl relative overflow-hidden group">
                  <Share2 className="w-5 h-5" /> Share with Recruiter
                  <span className="absolute top-2 right-3 text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-md">Soon</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultsPage;
