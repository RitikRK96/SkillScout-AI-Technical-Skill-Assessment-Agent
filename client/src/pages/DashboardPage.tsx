import { useEffect, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useNavigate } from "react-router-dom";
import api from "../lib/axios";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, ArrowRight, LogOut, Sparkles, BookOpen, Clock, TrendingUp } from "lucide-react";
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
    <div className="min-h-screen bg-[#fafbff]">
      {/* Subtle background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-indigo-50/50 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] bg-purple-50/40 rounded-full blur-[100px]" />
      </div>

      {/* Navbar */}
      <nav className="bg-white/70 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200/50">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black text-gray-900 tracking-tight">SkillScout</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:block text-sm text-gray-500">
              Hi, <span className="font-semibold text-gray-900">{user?.name}</span>
            </div>
            <Button variant="outline" size="sm" className="rounded-lg gap-2 text-gray-500 hover:text-gray-700" onClick={handleLogout}>
              <LogOut className="w-4 h-4" /> Logout
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">
              Welcome back, {user?.name?.split(" ")[0]} 👋
            </h1>
            <p className="text-gray-500 mt-2 text-lg">Ready to level up your skills?</p>
          </div>
          <Button 
            onClick={handleStartNew} 
            disabled={creating}
            className="gap-2 h-12 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200/50 text-base text-white"
          >
            {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
            {creating ? "Creating..." : "New Assessment"}
          </Button>
        </div>

        {/* Stats Cards */}
        {!loading && assessments.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{assessments.length}</div>
                <div className="text-sm text-gray-500">Total Assessments</div>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{completedCount}</div>
                <div className="text-sm text-gray-500">Completed</div>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{inProgressCount}</div>
                <div className="text-sm text-gray-500">In Progress</div>
              </div>
            </div>
          </div>
        )}

        {/* Section Title */}
        <h2 className="text-xl font-bold text-gray-900 mb-6">Your Assessments</h2>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : assessments.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-16 text-center">
            <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Plus className="w-10 h-10 text-indigo-300" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">No assessments yet</h3>
            <p className="text-gray-500 max-w-md mx-auto mb-8">
              Start your first assessment to discover skill gaps and get a personalised learning plan.
            </p>
            <Button 
              onClick={handleStartNew}
              disabled={creating}
              className="h-12 px-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200/50 text-white"
            >
              {creating ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
              {creating ? "Creating..." : "Start First Assessment"}
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {assessments.map((a) => (
              <div 
                key={a._id} 
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:border-gray-200 hover:-translate-y-0.5 transition-all duration-300 flex flex-col group"
              >
                <div className="p-6 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <Badge 
                      variant="outline" 
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-lg border ${getStatusStyle(a.status)}`}
                    >
                      {a.status === "complete" ? "✓ Complete" : a.status.replace("_", " ")}
                    </Badge>
                    <span className="text-xs text-gray-400">
                      {new Date(a.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-indigo-700 transition-colors">
                    {a.jobTitle || "Draft Assessment"}
                  </h3>
                  {a.companyName && <p className="text-sm text-gray-500">{a.companyName}</p>}
                </div>

                <div className="px-6 py-4 border-t border-gray-50 bg-gray-50/50 flex justify-between items-center">
                  {a.status === "complete" && a.learningPlan ? (
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-bold text-indigo-600">{a.learningPlan.overallReadinessScore}</div>
                      <div className="text-xs text-gray-400">/ 100</div>
                      <div className="w-16 h-1.5 bg-gray-200 rounded-full ml-2 overflow-hidden">
                        <div 
                          className="h-full bg-indigo-500 rounded-full"
                          style={{ width: `${a.learningPlan.overallReadinessScore}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">In Progress</span>
                  )}
                  <button 
                    className="flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                    onClick={() => handleResume(a._id, a.status)}
                  >
                    {a.status === "complete" ? "View Results" : "Continue"}
                    <ArrowRight className="w-4 h-4" />
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
