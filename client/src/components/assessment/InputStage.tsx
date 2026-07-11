import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import api from "../../lib/axios";
import { useAssessmentStore } from "../../store/useAssessmentStore";
import toast from "react-hot-toast";
import { UploadCloud, FileText, ArrowRight, Briefcase, Building2, Sparkles, X, File, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const InputStage = ({ assessmentId }: { assessmentId: string }) => {
  const navigate = useNavigate();
  const isSubmitted = useRef(false);

  const [jobTitle, setJobTitle] = useState(() => {
    const saved = localStorage.getItem(`assessment-draft-${assessmentId}`);
    if (saved) {
      try { return JSON.parse(saved).jobTitle || ""; } catch { return ""; }
    }
    return "";
  });

  const [companyName, setCompanyName] = useState(() => {
    const saved = localStorage.getItem(`assessment-draft-${assessmentId}`);
    if (saved) {
      try { return JSON.parse(saved).companyName || ""; } catch { return ""; }
    }
    return "";
  });

  const [jdMode] = useState<"text" | "file">("text");

  const [resumeMode, setResumeMode] = useState<"text" | "file">(() => {
    const saved = localStorage.getItem(`assessment-draft-${assessmentId}`);
    if (saved) {
      try { return JSON.parse(saved).resumeMode || "file"; } catch { return "file"; }
    }
    return "file";
  });

  const [jdText, setJdText] = useState(() => {
    const saved = localStorage.getItem(`assessment-draft-${assessmentId}`);
    if (saved) {
      try { return JSON.parse(saved).jdText || ""; } catch { return ""; }
    }
    return "";
  });

  const [resumeText, setResumeText] = useState(() => {
    const saved = localStorage.getItem(`assessment-draft-${assessmentId}`);
    if (saved) {
      try { return JSON.parse(saved).resumeText || ""; } catch { return ""; }
    }
    return "";
  });
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const { setSession } = useAssessmentStore();

  useEffect(() => {
    if (isSubmitted.current) return;
    const draft = { jobTitle, companyName, jdText, resumeText, resumeMode };
    localStorage.setItem(`assessment-draft-${assessmentId}`, JSON.stringify(draft));
  }, [jobTitle, companyName, jdText, resumeText, resumeMode, assessmentId]);

  const handleStartAnalysis = async () => {
    if (!jobTitle || !companyName) {
      toast.error("Please fill in Job Title and Company Name");
      return;
    }
    
    setLoading(true);
    try {
      if (resumeMode === "file" && resumeFile) {
        const formData = new FormData();
        formData.append("resume", resumeFile);
        await api.post(`/assessments/${assessmentId}/upload-resume`, formData);
      }
      
      const payload: any = {
        jobTitle,
        companyName,
      };
      
      if (jdMode === "text") {
        payload.jobDescriptionRaw = jdText;
      }
      if (resumeMode === "text") {
        payload.resumeRaw = resumeText;
      }

      const { data } = await api.post(`/assessments/${assessmentId}/parse`, payload);
      isSubmitted.current = true;
      localStorage.removeItem(`assessment-draft-${assessmentId}`);
      setSession(data);
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.error || "Failed to analyze skills");
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = jobTitle && companyName && jdText && (resumeMode === 'file' ? resumeFile : resumeText);

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Back Link */}
        <div className="flex justify-start">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/dashboard")}
            className="rounded-xl gap-2 text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Button>
        </div>

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-100 rounded-full mb-4 shadow-sm">
            <Sparkles className="w-8 h-8 text-indigo-600" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl">Configure Assessment</h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Upload the job requirements and candidate resume to generate a highly tailored technical interview.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-8 space-y-8">
            
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-indigo-500" /> Target Job Title
                </Label>
                <Input 
                  value={jobTitle} 
                  onChange={(e) => setJobTitle(e.target.value)} 
                  placeholder="e.g. Senior Frontend Engineer" 
                  className="h-12 bg-slate-50 border-gray-200 focus:bg-white transition-colors"
                />
              </div>
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-500" /> Company Name
                </Label>
                <Input 
                  value={companyName} 
                  onChange={(e) => setCompanyName(e.target.value)} 
                  placeholder="e.g. Acme Corp" 
                  className="h-12 bg-slate-50 border-gray-200 focus:bg-white transition-colors"
                />
              </div>
            </div>

            <div className="h-px bg-gray-100 w-full" />

            {/* Documents */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* JD Section */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-500" /> Job Description
                  </h3>
                </div>
                <div className="relative group">
                  <Textarea 
                    className="h-72 resize-none bg-slate-50 border-gray-200 focus:bg-white transition-all p-5 leading-relaxed text-gray-700 rounded-xl" 
                    placeholder="Paste the full job description here. We will extract the core technical requirements..."
                    value={jdText}
                    onChange={(e) => setJdText(e.target.value)}
                  />
                </div>
              </div>

              {/* Resume Section */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <File className="w-5 h-5 text-indigo-500" /> Candidate Resume
                  </h3>
                  <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button 
                      onClick={() => setResumeMode("file")}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${resumeMode === "file" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                    >
                      Upload PDF
                    </button>
                    <button 
                      onClick={() => setResumeMode("text")}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${resumeMode === "text" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                    >
                      Paste Text
                    </button>
                  </div>
                </div>

                {resumeMode === "text" ? (
                  <Textarea 
                    className="h-72 resize-none bg-slate-50 border-gray-200 focus:bg-white transition-all p-5 leading-relaxed text-gray-700 rounded-xl" 
                    placeholder="Paste the candidate's resume text here..."
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                  />
                ) : (
                  <div 
                    className={`relative h-72 rounded-xl border-2 border-dashed transition-all flex flex-col justify-center items-center p-6 text-center
                      ${resumeFile ? "border-indigo-500 bg-indigo-50/50" : "border-gray-300 bg-slate-50 hover:bg-slate-100 hover:border-indigo-400 group"}`}
                  >
                    <input 
                      type="file" 
                      accept="application/pdf"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                    />
                    
                    {resumeFile ? (
                      <div className="space-y-4 z-20 flex flex-col items-center">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm text-indigo-600">
                          <FileText className="w-8 h-8" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{resumeFile.name}</p>
                          <p className="text-xs text-gray-500 mt-1">{(resumeFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setResumeFile(null); }}
                          className="mt-2 text-red-500 hover:text-red-700 hover:bg-red-50 border-red-100 z-30"
                        >
                          <X className="w-4 h-4 mr-1.5" /> Remove File
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4 pointer-events-none">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mx-auto group-hover:scale-110 transition-transform duration-300">
                          <UploadCloud className="w-8 h-8 text-indigo-500" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Click to upload or drag and drop</p>
                          <p className="text-xs text-gray-500 mt-1">PDF files only (max 5MB)</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

          </div>
          
          {/* Footer Action */}
          <div className="bg-slate-50 px-8 py-6 border-t border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-center">
            <p className="text-sm text-gray-500">
              The AI will extract required skills and map them against the resume.
            </p>
            <Button 
              onClick={handleStartAnalysis} 
              disabled={loading || !isFormValid} 
              className="h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-lg shadow-indigo-200 transition-all group w-full sm:w-auto rounded-xl"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Analyzing Profile...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Generate Interview <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
};

