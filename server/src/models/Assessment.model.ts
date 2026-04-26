import { Schema, model, Document } from "mongoose";
import { AssessmentSession } from "@shared/types";

// Type omit for _id as Document provides it
export type IAssessment = Omit<AssessmentSession, "_id" | "createdAt" | "updatedAt"> & Document;

const AssessmentSchema = new Schema<IAssessment>(
  {
    userId: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ["input", "parsing", "skill_map", "assessing", "scoring", "plan_gen", "complete"],
      required: true,
    },
    jobTitle: { type: String, default: "" },
    companyName: { type: String, default: "" },
    jobDescriptionRaw: { type: String },
    resumeRaw: { type: String },
    resumeFileName: { type: String },
    parsedJD: { type: Schema.Types.Mixed },
    parsedResume: { type: Schema.Types.Mixed },
    skillsToAssess: [{ type: String }],
    currentSkillIndex: { type: Number, default: 0 },
    conversationHistory: [
      {
        role: { type: String, enum: ["agent", "user"], required: true },
        content: { type: String, required: true },
        skillBeingAssessed: { type: String },
        timestamp: { type: String, required: true },
      },
    ],
    skillScores: [{ type: Schema.Types.Mixed }],
    learningPlan: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export const Assessment = model<IAssessment>("Assessment", AssessmentSchema);
