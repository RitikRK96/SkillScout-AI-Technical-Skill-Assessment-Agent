import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { Assessment } from "../models/Assessment.model";
import { scoreAllSkills, generateLearningPlan } from "../services/ai.service";

export const scoreAssessment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const assessment = await Assessment.findOne({ _id: req.params.id, userId: req.user?.id });
    if (!assessment) {
      res.status(404).json({ error: "Assessment not found" });
      return;
    }

    const scores = await scoreAllSkills(assessment as any);
    
    assessment.skillScores = scores;
    assessment.status = "plan_gen";
    await assessment.save();

    res.status(200).json(assessment);
  } catch (error) {
    console.error("Score Error:", error);
    res.status(500).json({ error: "Failed to score assessment" });
  }
};

export const generatePlan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const assessment = await Assessment.findOne({ _id: req.params.id, userId: req.user?.id });
    if (!assessment) {
      res.status(404).json({ error: "Assessment not found" });
      return;
    }

    const plan = await generateLearningPlan(assessment as any);

    assessment.learningPlan = plan;
    assessment.status = "complete";
    await assessment.save();

    res.status(200).json(assessment);
  } catch (error) {
    console.error("Plan Gen Error:", error);
    res.status(500).json({ error: "Failed to generate learning plan" });
  }
};
