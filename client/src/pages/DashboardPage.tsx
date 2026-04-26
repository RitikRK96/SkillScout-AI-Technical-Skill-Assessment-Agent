import { useEffect, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useNavigate } from "react-router-dom";
import api from "../lib/axios";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, ArrowRight, LogOut, Sparkles, BookOpen, Clock, TrendingUp, Building2 } from "lucide-react";
import type { AssessmentSession } from "@shared/types";
import { useAssessmentStore } from "../store/useAssessmentStore";

const DashboardPage = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const resetAssessment = useAssessmentStore((state) => state.reset);
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState<AssessmentSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        const { data } = await api.get("/assessments");
        setAssessments(data);
      } catch (error) {
        console.error("Failed to fetch assessments", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAssessments();
  }, []);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
      logout();
      navigate("/");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const [creating, setCreating] = useState(false);

  const handleStartNew = async () => {
    setCreating(true);
    try {
      resetAssessment();
      const { data } = await api.post("/assessments");
      useAssessmentStore.getState().setSession(data);
      navigate("/assessment/new");
    } catch (error) {
      console.error("Failed to create assessment", error);
    } finally {
      setCreating(false);
    }
  };

  const handleResume = (id: string, status: string) => {
    if (status === "complete") {
      navigate(`/assessment/${id}/results`);
    } else {
      api.get(`/assessments/${id}`).then((res) => {
        useAssessmentStore.getState().setSession(res.data);
        navigate("/assessment/new");
      });
    }
  };

  const completedCount = assessments.filter((a) => a.status === "complete").length;
  const inProgressCount = assessments.filter((a) => a.status !== "complete").length;

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "complete":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "assessing":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "parsing":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-gray-50 text-gray-600 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Subtle background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-indigo-100/50 rounded-full blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-purple-100/40 rounded-full blur-[120px]" />
      </div>

      {/* Navbar */}
      <nav className="bg-white/60 backdrop-blur-2xl border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200/50">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black text-gray-900 tracking-tight">SkillScout</span>
          </div>
          <div className="flex items-center gap-5">
            <div className="hidden md:block text-sm text-gray-500 bg-white/50 px-4 py-2 rounded-full border border-gray-100">
              Hi, <span className="font-semibold text-gray-900">{user?.name}</span>
            </div>
            <Button variant="ghost" size="sm" className="rounded-xl gap-2 text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors" onClick={handleLogout}>
              <LogOut className="w-4 h-4" /> Logout
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
              Welcome back, {user?.name?.split(" ")[0]} 👋
            </h1>
            <p className="text-gray-500 mt-2 text-lg">Ready to level up your skills today?</p>
          </div>
          <Button 
            onClick={handleStartNew} 
            disabled={creating}
            className="gap-2 h-12 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200/50 text-base text-white transition-all hover:scale-[1.02]"
          >
            {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
            {creating ? "Creating..." : "New Assessment"}
          </Button>
        </div>

        {/* Stats Cards */}
        {!loading && assessments.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 p-6 flex items-center gap-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center">
                <BookOpen className="w-7 h-7 text-indigo-600" />
              </div>
              <div>
                <div className="text-3xl font-black text-gray-900">{assessments.length}</div>
                <div className="text-sm font-medium text-gray-500 mt-0.5">Total Assessments</div>
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 p-6 flex items-center gap-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center">
                <TrendingUp className="w-7 h-7 text-emerald-600" />
              </div>
              <div>
                <div className="text-3xl font-black text-gray-900">{completedCount}</div>
                <div className="text-sm font-medium text-gray-500 mt-0.5">Completed</div>
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 p-6 flex items-center gap-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center">
                <Clock className="w-7 h-7 text-amber-600" />
              </div>
              <div>
                <div className="text-3xl font-black text-gray-900">{inProgressCount}</div>
                <div className="text-sm font-medium text-gray-500 mt-0.5">In Progress</div>
              </div>
            </div>
          </div>
        )}

        {/* Section Title */}
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          Your Assessments
        </h2>

        {loading ? (
          <div className="flex justify-center py-32">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
          </div>
        ) : assessments.length === 0 ? (
          <div className="bg-white/60 backdrop-blur-sm border-2 border-dashed border-gray-200 rounded-3xl p-20 text-center flex flex-col items-center justify-center">
            <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-6 shadow-sm">
              <Plus className="w-10 h-10 text-indigo-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No assessments yet</h3>
            <p className="text-gray-500 max-w-md mx-auto mb-8 text-lg">
              Start your first assessment to discover your skill gaps and get a personalised learning plan.
            </p>
            <Button 
              onClick={handleStartNew}
              disabled={creating}
              className="h-14 px-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200/50 text-white text-lg hover:scale-105 transition-all"
            >
              {creating ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : null}
              {creating ? "Creating..." : "Start First Assessment"}
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assessments.map((a) => (
              <div 
                key={a._id} 
                className="bg-white rounded-3xl border border-gray-100 overflow-hidden hover:shadow-xl hover:border-indigo-100 hover:-translate-y-1 transition-all duration-300 flex flex-col group relative"
              >
                <div className="p-7 flex-1">
                  <div className="flex justify-between items-start mb-5">
                    <Badge 
                      variant="outline" 
                      className={`text-xs font-bold px-3 py-1 rounded-full border ${getStatusStyle(a.status)}`}
                    >
                      {a.status === "complete" ? "✓ Complete" : a.status.replace("_", " ").toUpperCase()}
                    </Badge>
                    <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-md">
                      {new Date(a.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
                    {a.jobTitle || "Draft Assessment"}
                  </h3>
                  {a.companyName && <p className="text-sm font-medium text-gray-500 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4" /> {a.companyName}
                  </p>}
                </div>

                <div className="px-7 py-5 border-t border-gray-50 bg-slate-50/50 flex justify-between items-center group-hover:bg-indigo-50/30 transition-colors">
                  {a.status === "complete" && a.learningPlan ? (
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-700">
                        {a.learningPlan.overallReadinessScore}
                      </div>
                      <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-500 rounded-full"
                          style={{ width: `${a.learningPlan.overallReadinessScore}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm font-medium text-gray-400 flex items-center gap-1.5">
                      <Clock className="w-4 h-4" /> In Progress
                    </span>
                  )}
                  <button 
                    className="flex items-center gap-1.5 text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                    onClick={() => handleResume(a._id, a.status)}
                  >
                    {a.status === "complete" ? "View Results" : "Continue"}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
