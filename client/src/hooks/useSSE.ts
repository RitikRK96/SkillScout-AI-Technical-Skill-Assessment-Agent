import { useState, useCallback } from "react";
import { useAssessmentStore } from "../store/useAssessmentStore";

export function useSSE(assessmentId: string | null) {
  const [streaming, setStreaming] = useState(false);
  const { appendStreamingText, commitStreamedMessage, advanceSkill, updateStatus } = useAssessmentStore();

  const send = useCallback(
    (message: string) => {
      if (!assessmentId) return;
      setStreaming(true);

      const url = `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/chat/${assessmentId}/message?message=${encodeURIComponent(
        message
      )}`;

      const es = new EventSource(url, { withCredentials: true });

      es.onmessage = (e) => {
        const data = JSON.parse(e.data);

        if (data.type === "chunk") {
          appendStreamingText(data.text);
        } else if (data.type === "skill_complete") {
          commitStreamedMessage();
          advanceSkill();
          es.close();
          setStreaming(false);
        } else if (data.type === "assessment_complete") {
          commitStreamedMessage();
          updateStatus("scoring");
          es.close();
          setStreaming(false);
        } else if (data.type === "done") {
          commitStreamedMessage();
          es.close();
          setStreaming(false);
        } else if (data.type === "error") {
          es.close();
          setStreaming(false);
        }
      };

      es.onerror = () => {
        es.close();
        setStreaming(false);
      };
    },
    [assessmentId, appendStreamingText, commitStreamedMessage, advanceSkill, updateStatus]
  );

  return { send, streaming };
}
