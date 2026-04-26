import { useEffect, useState } from "react";
import { useAssessmentStore } from "../store/useAssessmentStore";
import { InputStage } from "../components/assessment/InputStage";
import { SkillMapPreview } from "../components/assessment/SkillMapPreview";
import { ChatInterface } from "../components/assessment/ChatInterface";
import api from "../lib/axios";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const NewAssessmentPage = () => {
  const { session, setSession } = useAssessmentStore();
  const [initializing, setInitializing] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    if (!session) {
      // No session in store — user navigated here directly. Send them to dashboard.
      navigate("/dashboard");
    } else {
      setInitializing(false);
    }
  }, []);

  // Polling for scoring and plan_gen status
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    const checkStatus = async () => {
      if (!session) return;
      try {
        const { data } = await api.get(`/assessments/${session._id}`);
        setSession(data);
        
        if (data.status === "complete") {
          navigate(`/assessment/${session._id}/results`);
        } else if (data.status === "scoring" && session.status !== "scoring") {
          // If we transitioned to scoring, kick off scoring API
          api.post(`/assessments/${session._id}/score`);
        } else if (data.status === "plan_gen" && session.status !== "plan_gen") {
          // If we transitioned to plan_gen, kick off plan_gen API
          api.post(`/assessments/${session._id}/generate-plan`);
        }
      } catch (error) {
        console.error("Polling error", error);
      }
    };

    if (session?.status === "scoring" || session?.status === "plan_gen") {
      interval = setInterval(checkStatus, 3000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [session?.status, session?._id]);

  if (initializing) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!session) return null;

  switch (session.status) {
    case "input":
      return <InputStage assessmentId={session._id} />;
    case "parsing":
      return (
        <div className="flex flex-col h-screen items-center justify-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
          <h2 className="text-xl font-semibold">Analyzing your skills...</h2>
          <p className="text-gray-500">This may take up to a minute.</p>
        </div>
      );
    case "skill_map":
      return <SkillMapPreview />;
    case "assessing":
      return <ChatInterface />;
    case "scoring":
    case "plan_gen":
      return (
        <div className="flex flex-col h-screen items-center justify-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
          <h2 className="text-xl font-semibold">
            {session.status === "scoring" ? "Scoring your responses..." : "Building your personalised learning plan..."}
          </h2>
          <p className="text-gray-500">Please wait, this will take a moment.</p>
        </div>
      );
    case "complete":
      return <div>Redirecting to Results...</div>;
    default:
      return <div>Unknown status</div>;
  }
};

export default NewAssessmentPage;
