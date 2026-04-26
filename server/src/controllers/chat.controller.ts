import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { Assessment } from "../models/Assessment.model";
import { getAssessmentOpener, continueAssessment } from "../services/ai.service";
import { initSSE, closeSSE, sendEvent } from "../utils/stream";
import { ConversationMessage } from "@shared/types";

const MAX_QUESTIONS_PER_SKILL = 4;

export const chatStream = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { message } = req.query;
    const assessment = await Assessment.findOne({ _id: req.params.id, userId: req.user?.id });

    if (!assessment) {
      res.status(404).json({ error: "Assessment not found" });
      return;
    }

    if (assessment.status !== "assessing") {
      res.status(400).json({ error: "Assessment is not in assessing state" });
      return;
    }

    const currentSkill = assessment.skillsToAssess[assessment.currentSkillIndex];

    initSSE(res);

    // If message is "START_SKILL", we generate the opener
    if (message === "START_SKILL") {
      const openerText = await getAssessmentOpener(assessment as any, currentSkill);
      
      const newMsg: ConversationMessage = {
        role: "agent",
        content: openerText,
        skillBeingAssessed: currentSkill,
        timestamp: new Date().toISOString(),
      };
      
      assessment.conversationHistory.push(newMsg);
      await assessment.save();

      // We just stream the text to the frontend as chunks
      // Though it's pre-generated, we can simulate stream or just send it
      const chunks = openerText.split(" ");
      for (const word of chunks) {
        res.write(`data: ${JSON.stringify({ type: "chunk", text: word + " " })}\n\n`);
        await new Promise((resolve) => setTimeout(resolve, 20)); // slight delay
      }

      closeSSE(res);
      return;
    }

    // Otherwise, handle user message
    if (message && typeof message === "string") {
      assessment.conversationHistory.push({
        role: "user",
        content: message,
        skillBeingAssessed: currentSkill,
        timestamp: new Date().toISOString(),
      });
      await assessment.save();
    }

    // Count how many user messages exist for the current skill
    const userMessagesForSkill = assessment.conversationHistory.filter(
      (msg: { skillBeingAssessed: any; role: string; }) => msg.skillBeingAssessed === currentSkill && msg.role === "user"
    ).length;
    const isLastQuestion = userMessagesForSkill >= MAX_QUESTIONS_PER_SKILL;

    // Stream AI response (tell the AI this is the last exchange if limit reached)
    let rawResponse = await continueAssessment(assessment as any, res, isLastQuestion);
    
    let controlToken = "";
    if (rawResponse.includes("[CONTINUE]")) controlToken = "[CONTINUE]";
    else if (rawResponse.includes("[SKILL_COMPLETE]")) controlToken = "[SKILL_COMPLETE]";
    else if (rawResponse.includes("[NEXT_SKILL]")) controlToken = "[NEXT_SKILL]";

    // Clean control token from text
    const cleanText = rawResponse.replace(/\[(CONTINUE|SKILL_COMPLETE|NEXT_SKILL)\]/g, "").trim();

    assessment.conversationHistory.push({
      role: "agent",
      content: cleanText,
      skillBeingAssessed: currentSkill,
      timestamp: new Date().toISOString(),
    });

    // Force skill completion if we've hit the question limit
    if (isLastQuestion && controlToken === "[CONTINUE]") {
      controlToken = "[SKILL_COMPLETE]";
    }

    if (controlToken === "[SKILL_COMPLETE]" || controlToken === "[NEXT_SKILL]") {
      assessment.currentSkillIndex += 1;
      
      if (assessment.currentSkillIndex >= assessment.skillsToAssess.length) {
        assessment.status = "scoring";
        await assessment.save();
        sendEvent(res, "assessment_complete");
      } else {
        await assessment.save();
        sendEvent(res, "skill_complete");
      }
    } else {
      await assessment.save();
    }

    closeSSE(res);
  } catch (error) {
    console.error("Chat Stream Error:", error);
    res.write(`data: ${JSON.stringify({ type: "error", text: "Internal Server Error" })}\n\n`);
    res.end();
  }
};
