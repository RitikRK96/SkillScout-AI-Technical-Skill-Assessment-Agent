import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { Assessment } from "../models/Assessment.model";
import { upload } from "../middleware/upload.middleware";
import { extractTextFromPDFBuffer } from "../services/parser.service";
import { parseJDAndResume, scoreAllSkills, generateLearningPlan } from "../services/ai.service";

export const getAssessments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const assessments = await Assessment.find({ userId: req.user?.id }).sort({ createdAt: -1 });
    res.status(200).json(assessments);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch assessments" });
  }
};

export const createAssessment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const newAssessment = await Assessment.create({
      userId: req.user?.id,
      status: "input",
      jobTitle: "",
      companyName: "",
      jobDescriptionRaw: "",
      resumeRaw: "",
      skillsToAssess: [],
      currentSkillIndex: 0,
      conversationHistory: [],
      skillScores: [],
    });
    res.status(201).json(newAssessment);
  } catch (error: any) {
    console.error("Create Assessment Error:", error);
    res.status(500).json({ error: "Failed to create assessment", details: error.message });
  }
};

export const getAssessment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const assessment = await Assessment.findOne({ _id: req.params.id, userId: req.user?.id });
    if (!assessment) {
      res.status(404).json({ error: "Assessment not found" });
      return;
    }
    res.status(200).json(assessment);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch assessment" });
  }
};

export const deleteAssessment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const assessment = await Assessment.findOneAndDelete({ _id: req.params.id, userId: req.user?.id });
    if (!assessment) {
      res.status(404).json({ error: "Assessment not found" });
      return;
    }
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete assessment" });
  }
};

export const uploadResume = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    const text = await extractTextFromPDFBuffer(file.buffer);

    const assessment = await Assessment.findOneAndUpdate(
      { _id: req.params.id, userId: req.user?.id },
      { resumeRaw: text, resumeFileName: file.originalname },
      { new: true }
    );

    res.status(200).json(assessment);
  } catch (error) {
    res.status(500).json({ error: "Failed to upload resume" });
  }
};

export const parseAssessment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const assessment = await Assessment.findOne({ _id: req.params.id, userId: req.user?.id });
    if (!assessment) {
      res.status(404).json({ error: "Assessment not found" });
      return;
    }

    // Save jobDescriptionRaw if sent in body
    if (req.body.jobDescriptionRaw) {
      assessment.jobDescriptionRaw = req.body.jobDescriptionRaw;
    }
    if (req.body.resumeRaw) {
      assessment.resumeRaw = req.body.resumeRaw;
    }
    if (req.body.jobTitle) {
      assessment.jobTitle = req.body.jobTitle;
    }
    if (req.body.companyName) {
      assessment.companyName = req.body.companyName;
    }

    assessment.status = "parsing";
    await assessment.save();

    const parsedData = await parseJDAndResume(assessment.jobDescriptionRaw || "", assessment.resumeRaw || "");

    assessment.parsedJD = parsedData.parsedJD;
    assessment.parsedResume = parsedData.parsedResume;
    assessment.skillsToAssess = parsedData.skillsToAssess;
    assessment.status = "skill_map";

    await assessment.save();
    res.status(200).json(assessment);
  } catch (error) {
    console.error("Parse Error:", error);
    res.status(500).json({ error: "Failed to parse JD and Resume" });
  }
};

export const confirmSkills = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { skillsToAssess } = req.body;
    const assessment = await Assessment.findOneAndUpdate(
      { _id: req.params.id, userId: req.user?.id },
      { skillsToAssess, status: "assessing", currentSkillIndex: 0 },
      { new: true }
    );
    res.status(200).json(assessment);
  } catch (error) {
    res.status(500).json({ error: "Failed to confirm skills" });
  }
};

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


