import { create } from "zustand";
import type {
  AssessmentSession,
  AssessmentStatus,
  ConversationMessage,
  SkillScore,
  LearningPlan,
} from "@shared/types";

interface AssessmentStore {
  session: AssessmentSession | null;
  isLoading: boolean;
  streamingText: string;

  // actions
  setSession: (s: AssessmentSession | null) => void;
  updateStatus: (status: AssessmentStatus) => void;
  addMessage: (msg: ConversationMessage) => void;
  setStreamingText: (text: string) => void;
  appendStreamingText: (chunk: string) => void;
  commitStreamedMessage: () => void;
  advanceSkill: () => void;
  setScores: (scores: SkillScore[]) => void;
  setPlan: (plan: LearningPlan) => void;
  reset: () => void;
}

export const useAssessmentStore = create<AssessmentStore>((set) => ({
  session: null,
  isLoading: false,
  streamingText: "",

  setSession: (session) => set({ session }),
  updateStatus: (status) =>
    set((state) => ({
      session: state.session ? { ...state.session, status } : null,
    })),
  addMessage: (msg) =>
    set((state) => ({
      session: state.session
        ? {
            ...state.session,
            conversationHistory: [...state.session.conversationHistory, msg],
          }
        : null,
    })),
  setStreamingText: (text) => set({ streamingText: text }),
  appendStreamingText: (chunk) =>
    set((state) => ({ streamingText: state.streamingText + chunk })),
  commitStreamedMessage: () =>
    set((state) => {
      if (!state.session || !state.streamingText) return state;
      const newMsg: ConversationMessage = {
        role: "agent",
        content: state.streamingText,
        timestamp: new Date().toISOString(),
        skillBeingAssessed: state.session.skillsToAssess[state.session.currentSkillIndex],
      };
      return {
        streamingText: "",
        session: {
          ...state.session,
          conversationHistory: [...state.session.conversationHistory, newMsg],
        },
      };
    }),
  advanceSkill: () =>
    set((state) => ({
      session: state.session
        ? {
            ...state.session,
            currentSkillIndex: state.session.currentSkillIndex + 1,
          }
        : null,
    })),
  setScores: (scores) =>
    set((state) => ({
      session: state.session ? { ...state.session, skillScores: scores } : null,
    })),
  setPlan: (plan) =>
    set((state) => ({
      session: state.session ? { ...state.session, learningPlan: plan } : null,
    })),
  reset: () => set({ session: null, isLoading: false, streamingText: "" }),
}));
