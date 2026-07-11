import { useState, useCallback } from "react";
import { useAssessmentStore } from "../store/useAssessmentStore";
import { useAuthStore } from "../store/useAuthStore";
import { getAssessmentOpenerWithGemini, continueAssessmentWithGemini } from "../lib/gemini";
import type { AssessmentSession, ConversationMessage } from "@shared/types";
import toast from "react-hot-toast";

export function useSSE(assessmentId: string | null) {
  const [streaming, setStreaming] = useState(false);
  const { appendStreamingText, commitStreamedMessage, advanceSkill, updateStatus } = useAssessmentStore();
  const isGuest = useAuthStore((state) => state.isGuest);
  const apiKey = useAuthStore((state) => state.geminiApiKey);

  const send = useCallback(
    async (message: string) => {
      if (!assessmentId) return;
      setStreaming(true);

      // ─── Guest Mode Local Simulation ──────────────────────────────
      if (isGuest) {
        try {
          const current: AssessmentSession[] = JSON.parse(
            localStorage.getItem("guest-assessments") || "[]"
          );
          const sessionIdx = current.findIndex((a) => a._id === assessmentId);
          if (sessionIdx === -1) {
            setStreaming(false);
            return;
          }
          const sess = current[sessionIdx];
          const currentSkill = sess.skillsToAssess[sess.currentSkillIndex];

          // 1. Persist User Message (if it's not START_SKILL)
          if (message !== "START_SKILL") {
            const userMsg: ConversationMessage = {
              role: "user",
              content: message,
              timestamp: new Date().toISOString(),
              skillBeingAssessed: currentSkill,
            };
            sess.conversationHistory.push(userMsg);
            current[sessionIdx] = sess;
            localStorage.setItem("guest-assessments", JSON.stringify(current));
          }

          // 2. Count exchanges to check for final question
          const userMessagesForSkill = sess.conversationHistory.filter(
            (msg) => msg.skillBeingAssessed === currentSkill && msg.role === "user"
          ).length;
          const isLastQuestion = userMessagesForSkill >= 8; // Max 8 questions

          // 3. Generate response (Gemini or Mock)
          let rawResponse = "";
          if (apiKey) {
            if (message === "START_SKILL") {
              rawResponse = await getAssessmentOpenerWithGemini(apiKey, sess, currentSkill);
            } else {
              rawResponse = await continueAssessmentWithGemini(apiKey, sess, isLastQuestion);
            }
          } else {
            // Mock Response Generator
            if (message === "START_SKILL") {
              rawResponse = `Let's begin assessing **${currentSkill}**. Based on your background, could you explain a practical scenario where you utilized this skill, and what key design patterns or libraries you selected? [CONTINUE]`;
            } else if (userMessagesForSkill === 1) {
              rawResponse = `That is a solid explanation. Can you go into detail about how you handled performance optimizations, error states, and testing in that specific implementation? [CONTINUE]`;
            } else if (userMessagesForSkill === 2) {
              rawResponse = `Understood. If you had to scale that solution to support 10x the traffic or handle real-time updates, what structural or architectural bottlenecks would you expect, and how would you resolve them? [CONTINUE]`;
            } else if (userMessagesForSkill === 3) {
              rawResponse = `Excellent points. What security considerations, data sanitization, or authentication practices did you enforce to secure this implementation? [CONTINUE]`;
            } else if (userMessagesForSkill === 4) {
              rawResponse = `Good security choices. How did you structure the developer docs, and how did you guide your team on code reviews or onboarding for this feature? [CONTINUE]`;
            } else if (userMessagesForSkill === 5) {
              rawResponse = `Understood. Moving onto operations: how did you package this application (e.g. Docker), what CI/CD pipeline steps did you establish, and how was it hosted? [CONTINUE]`;
            } else if (userMessagesForSkill === 6) {
              rawResponse = `Got it. In production, how do you handle monitoring, logging, and error tracking (e.g. Sentry/Datadog) to ensure high availability and reliability? [CONTINUE]`;
            } else if (userMessagesForSkill === 7) {
              rawResponse = `Thanks for explaining that. To wrap up this skill, what is one major lesson or mistake you made while using ${currentSkill}, and what did you learn from it? [CONTINUE]`;
            } else {
              rawResponse = `Perfect. Thank you for sharing your experience. I have gathered enough signal on your proficiency with ${currentSkill}. Let's finalize this skill assessment. [SKILL_COMPLETE]`;
            }
          }

          // 4. Extract control token
          let controlToken = "[CONTINUE]";
          if (rawResponse.includes("[CONTINUE]")) controlToken = "[CONTINUE]";
          else if (rawResponse.includes("[SKILL_COMPLETE]")) controlToken = "[SKILL_COMPLETE]";
          else if (rawResponse.includes("[NEXT_SKILL]")) controlToken = "[NEXT_SKILL]";

          const cleanText = rawResponse
            .replace(/\[(CONTINUE|SKILL_COMPLETE|NEXT_SKILL)\]/g, "")
            .trim();

          // 5. Simulate SSE word-by-word streaming
          const words = cleanText.split(" ");
          let i = 0;
          const timer = setInterval(() => {
            if (i < words.length) {
              appendStreamingText(words[i] + " ");
              i++;
            } else {
              clearInterval(timer);

              // Stream finished, apply state updates
              const agentMsg: ConversationMessage = {
                role: "agent",
                content: cleanText,
                timestamp: new Date().toISOString(),
                skillBeingAssessed: currentSkill,
              };
              sess.conversationHistory.push(agentMsg);

              // Force skill completion if limit reached
              let finalControlToken = controlToken;
              if (isLastQuestion && controlToken === "[CONTINUE]") {
                finalControlToken = "[SKILL_COMPLETE]";
              }

              if (finalControlToken === "[SKILL_COMPLETE]" || finalControlToken === "[NEXT_SKILL]") {
                sess.currentSkillIndex += 1;
                if (sess.currentSkillIndex >= sess.skillsToAssess.length) {
                  sess.status = "scoring";
                  current[sessionIdx] = sess;
                  localStorage.setItem("guest-assessments", JSON.stringify(current));

                  commitStreamedMessage();
                  updateStatus("scoring");
                } else {
                  current[sessionIdx] = sess;
                  localStorage.setItem("guest-assessments", JSON.stringify(current));

                  commitStreamedMessage();
                  advanceSkill();
                }
              } else {
                current[sessionIdx] = sess;
                localStorage.setItem("guest-assessments", JSON.stringify(current));
                
                commitStreamedMessage();
              }
              setStreaming(false);
            }
          }, 30);
        } catch (err: any) {
          console.error(err);
          toast.error(err.message || "Failed to process chat response");
          setStreaming(false);
        }
        return;
      }

      // ─── Standard Backend Mode ──────────────────────────────────
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
    [assessmentId, isGuest, apiKey, appendStreamingText, commitStreamedMessage, advanceSkill, updateStatus]
  );

  return { send, streaming };
}
