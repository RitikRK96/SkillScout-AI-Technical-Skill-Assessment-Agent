import  { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import api from "../../lib/axios";
import { useAssessmentStore } from "../../store/useAssessmentStore";
import toast from "react-hot-toast";

export const InputStage = ({ assessmentId }: { assessmentId: string }) => {
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jdMode, setJdMode] = useState<"text" | "file">("text");
  const [resumeMode, setResumeMode] = useState<"text" | "file">("file");
  const [jdText, setJdText] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const { setSession } = useAssessmentStore();

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
      setSession(data);
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.error || "Failed to analyze skills");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <div className="space-y-4">
        <h2 className="text-3xl font-bold">New Assessment</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Job Title</Label>
            <Input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="e.g. Senior Frontend Engineer" />
          </div>
          <div className="space-y-2">
            <Label>Company Name</Label>
            <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="e.g. Acme Corp" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* JD Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">Job Description</h3>
            <div className="flex gap-2">
              <Button size="sm" variant={jdMode === "text" ? "default" : "outline"} onClick={() => setJdMode("text")}>Paste Text</Button>
            </div>
          </div>
          {jdMode === "text" && (
            <Textarea 
              className="h-64" 
              placeholder="Paste the job description here..."
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
            />
          )}
        </div>

        {/* Resume Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">Resume</h3>
            <div className="flex gap-2">
              <Button size="sm" variant={resumeMode === "text" ? "default" : "outline"} onClick={() => setResumeMode("text")}>Paste Text</Button>
              <Button size="sm" variant={resumeMode === "file" ? "default" : "outline"} onClick={() => setResumeMode("file")}>Upload PDF</Button>
            </div>
          </div>
          {resumeMode === "text" ? (
            <Textarea 
              className="h-64" 
              placeholder="Paste your resume here..."
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
            />
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center h-64 flex flex-col justify-center items-center">
              <Input 
                type="file" 
                accept="application/pdf"
                className="w-full max-w-xs"
                onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
              />
              <p className="mt-2 text-sm text-gray-500">Only PDF files up to 5MB</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleStartAnalysis} disabled={loading} className="w-48">
          {loading ? "Analysing..." : "Analyse Skills →"}
        </Button>
      </div>
    </div>
  );
};
