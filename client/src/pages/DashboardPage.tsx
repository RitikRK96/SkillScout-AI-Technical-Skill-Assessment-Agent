import { useEffect, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useNavigate } from "react-router-dom";
import api from "../lib/axios";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2, Plus, ArrowRight, LogOut, Sparkles, BookOpen, 
  Clock, TrendingUp, Building2, Settings, Download, Upload, Trash2, X,
  ChevronDown, ChevronUp 
} from "lucide-react";
import type { AssessmentSession } from "@shared/types";
import { useAssessmentStore } from "../store/useAssessmentStore";
import toast from "react-hot-toast";

const DashboardPage = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const resetAssessment = useAssessmentStore((state) => state.reset);
  const isGuest = useAuthStore((state) => state.isGuest);
  const geminiApiKey = useAuthStore((state) => state.geminiApiKey);
  const setGeminiApiKey = useAuthStore((state) => state.setGeminiApiKey);
  
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState<AssessmentSession[]>([]);
  const [loading, setLoading] = useState(true);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(geminiApiKey || "");
  const [showGuide, setShowGuide] = useState(false);

  const handleSaveApiKey = () => {
    setGeminiApiKey(apiKeyInput.trim() || null);
    toast.success("Gemini API Key saved!");
  };

  const handleExportData = () => {
    const data = localStorage.getItem("guest-assessments") || "[]";
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `skillscout_sandbox_export_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Sandbox data exported!");
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (!Array.isArray(json)) throw new Error("Invalid format. Expected an array of assessments.");
        
        if (json.length > 0 && (!json[0]._id || !json[0].status)) {
          throw new Error("Invalid assessment structure.");
        }

        const confirmOverwrite = window.confirm(
          `Found ${json.length} assessments. Import them? This will overwrite your current guest sandbox assessments.`
        );

        if (confirmOverwrite) {
          localStorage.setItem("guest-assessments", JSON.stringify(json));
          toast.success("Assessments imported successfully!");
          window.location.reload();
        }
      } catch (err: any) {
        toast.error("Import failed: " + err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleClearData = () => {
    const confirmClear = window.confirm(
      "Are you sure you want to clear all guest assessments? This is permanent!"
    );
    if (confirmClear) {
      localStorage.removeItem("guest-assessments");
      toast.success("Sandbox cleared!");
      window.location.reload();
    }
  };

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
            {isGuest && (
              <div className="hidden sm:flex text-xs font-black text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full items-center gap-1.5 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                GUEST SANDBOX
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:block text-sm text-gray-500 bg-white/50 px-4 py-2 rounded-full border border-gray-100">
              Hi, <span className="font-semibold text-gray-900">{user?.name}</span>
            </div>
            {isGuest && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="rounded-xl gap-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors" 
                onClick={() => {
                  setApiKeyInput(useAuthStore.getState().geminiApiKey || "");
                  setIsSettingsOpen(true);
                }}
              >
                <Settings className="w-4 h-4" /> Settings
              </Button>
            )}
            <Button variant="ghost" size="sm" className="rounded-xl gap-2 text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors" onClick={handleLogout}>
              <LogOut className="w-4 h-4" /> Logout
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Guest Sandbox Warning Banner */}
        {isGuest && (
          <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 rounded-3xl border border-indigo-100 p-6 md:p-8 mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-1 flex-1">
              <h2 className="text-xl font-bold text-indigo-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" /> Offline Sandbox Active
              </h2>
              <p className="text-indigo-950/70 text-sm md:text-base leading-relaxed">
                You are currently running in <span className="font-bold">Guest Sandbox Mode</span>. All your assessment data is saved locally. 
                Configure a <span className="font-bold">Gemini API Key</span> in settings to use real AI assessments, or run without one to experience the flow with interactive simulated responses.
              </p>
            </div>
            <Button 
              onClick={() => setIsSettingsOpen(true)}
              className="shrink-0 bg-white hover:bg-indigo-50 border border-indigo-200 text-indigo-600 font-semibold rounded-xl px-5 h-11 transition-all"
            >
              Configure Gemini API
            </Button>
          </div>
        )}

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
                onClick={() => handleResume(a._id, a.status)}
                className="bg-white rounded-3xl border border-gray-100 overflow-hidden hover:shadow-xl hover:border-indigo-100 hover:-translate-y-1 transition-all duration-300 flex flex-col group relative cursor-pointer"
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
                  <div 
                    className="flex items-center gap-1.5 text-sm font-bold text-indigo-600 group-hover:text-indigo-800 transition-colors"
                  >
                    {a.status === "complete" ? "View Results" : "Continue"}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-600" /> Guest Sandbox Settings
              </h3>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Gemini API key input */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold text-gray-700 block">Gemini API Key</label>
                  <button 
                    onClick={() => setShowGuide(!showGuide)}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
                  >
                    Need a key? {showGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="password"
                    placeholder="Enter your Gemini API key (optional)"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    className="flex-1 h-11 px-4 rounded-xl border border-gray-200 bg-slate-50 text-sm focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                  />
                  <Button 
                    onClick={handleSaveApiKey}
                    className="bg-indigo-600 hover:bg-indigo-700 h-11 px-5 rounded-xl font-semibold text-white shadow-md shadow-indigo-100"
                  >
                    Save
                  </Button>
                </div>

                {showGuide && (
                  <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100/50 space-y-2 animate-in slide-in-from-top-2 duration-200">
                    <p className="text-xs font-bold text-indigo-900">How to get a free key:</p>
                    <ol className="text-xs text-indigo-950/80 space-y-1.5 list-decimal pl-4">
                      <li>Go to <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 font-bold hover:underline">Google AI Studio</a>.</li>
                      <li>Sign in with your Google account.</li>
                      <li>Click <strong>Get API key</strong> and then <strong>Create API key</strong>.</li>
                      <li>Select or create a project and copy the generated key.</li>
                    </ol>
                    <p className="text-[10px] text-indigo-700/70 pt-1">
                      For more detailed instructions, see the <a href="https://github.com/RitikRK96/skill-assessment-agent/blob/main/docs/gemini-key-guide.md" target="_blank" rel="noopener noreferrer" className="underline hover:text-indigo-900 font-medium">Gemini Key Guide</a> in our repository.
                    </p>
                  </div>
                )}

                <p className="text-[11px] text-gray-400 leading-normal">
                  Your key is saved directly in your browser's local storage and is only used to connect to Google's Generative Language API. If left empty, the application uses simulated, pre-packaged responses.
                </p>
              </div>

              <div className="h-px bg-gray-100 w-full" />

              {/* Data Import/Export */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700 block">Manage Sandbox Data</label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={handleExportData}
                    variant="outline"
                    className="h-11 rounded-xl border-gray-200 hover:bg-slate-50 text-gray-700 gap-2 font-semibold text-sm transition-all"
                  >
                    <Download className="w-4 h-4" /> Export Data
                  </Button>
                  <label className="h-11 rounded-xl border border-gray-200 hover:bg-slate-50 text-gray-700 gap-2 font-semibold text-sm transition-all flex items-center justify-center cursor-pointer border-solid">
                    <Upload className="w-4 h-4" /> Import Data
                    <input 
                      type="file" 
                      accept=".json"
                      onChange={handleImportData}
                      className="hidden" 
                    />
                  </label>
                </div>
              </div>

              <div className="h-px bg-gray-100 w-full" />

              {/* Clear assessments */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-red-700 block">Danger Zone</label>
                <Button
                  onClick={handleClearData}
                  className="w-full h-11 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 border border-red-200 font-semibold text-sm gap-2 transition-all shadow-none"
                >
                  <Trash2 className="w-4 h-4" /> Clear All Sandbox Assessments
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
