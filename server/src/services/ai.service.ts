import OpenAI, { AzureOpenAI } from "openai";
import {
  PARSER_SYSTEM_PROMPT,
  getParserUserPrompt,
  getAssessmentOpenerSystemPrompt,
  getAssessmentOpenerUserPrompt,
  getContinueAssessmentSystemPrompt,
  SKILL_SCOUT_PERSONA,
  SCORER_SYSTEM_PROMPT,
  getScorerUserPrompt,
  LEARNING_PLAN_SYSTEM_PROMPT,
  getLearningPlanUserPrompt,
} from "../utils/prompts";
import { AssessmentSession, ParsedJD, ParsedResume, SkillScore, LearningPlan } from "@shared/types";

let _client: AzureOpenAI | null = null;

function getClient(): AzureOpenAI {
  if (!_client) {
    _client = new AzureOpenAI({
      endpoint: process.env.AZURE_OPENAI_ENDPOINT,
      apiKey: process.env.AZURE_OPENAI_API_KEY,
      apiVersion: process.env.AZURE_OPENAI_API_VERSION || "2025-01-01-preview",
    });
  }
  return _client;
}

function getDeployment(): string {
  return process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "gpt-4o-mini";
}

// Helper to extract JSON from markdown if the model wraps it
function extractJSON(text: string): string {
  const match = text.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
  if (match) return match[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1) return text.slice(start, end + 1);
  return text.trim();
}

async function callAzure(systemPrompt: string, userPrompt: string, jsonMode = false): Promise<string> {
  const response = await getClient().chat.completions.create({
    model: getDeployment(),
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    max_tokens: 4096,
    ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
  });
  return response.choices[0]?.message?.content || "";
}

export const parseJDAndResume = async (
  jdText: string,
  resumeText: string
): Promise<{
  parsedJD: ParsedJD;
  parsedResume: ParsedResume;
  skillsToAssess: string[];
}> => {
  try {
    const text = await callAzure(PARSER_SYSTEM_PROMPT, getParserUserPrompt(jdText, resumeText), true);
    return JSON.parse(extractJSON(text));
  } catch (error) {
    console.error("Azure Parse Error:", error);
    throw error;
  }
};

export const getAssessmentOpener = async (
  session: AssessmentSession,
  skillName: string
): Promise<string> => {
  const skillInfo = session.parsedJD?.requiredSkills.find((s) => s.skillName === skillName);
  const claimedInfo = session.parsedResume?.claimedSkills.find((s) => s.skillName === skillName);

  const systemPrompt = getAssessmentOpenerSystemPrompt(
    skillName,
    skillInfo?.requiredLevel || 5,
    session.jobTitle,
    session.companyName,
    claimedInfo?.claimedLevel || 3,
    claimedInfo?.evidenceSnippet || "No specific evidence.",
    session.parsedJD?.roleLevel || "mid"
  );

  return callAzure(systemPrompt, getAssessmentOpenerUserPrompt(skillName, claimedInfo?.claimedLevel || 3));
};

export const continueAssessment = async (
  session: AssessmentSession,
  res: any // Express Response
): Promise<string> => {
  const currentSkill = session.skillsToAssess[session.currentSkillIndex];
  const historyForSkill = session.conversationHistory.filter(
    (msg) => msg.skillBeingAssessed === currentSkill
  );

  const systemPrompt = getContinueAssessmentSystemPrompt(SKILL_SCOUT_PERSONA);

  const messages: any[] = [
    { role: "system", content: systemPrompt },
    ...historyForSkill.map((msg) => ({
      role: msg.role === "agent" ? "assistant" : "user",
      content: msg.content
    }))
  ];

  const stream = await getClient().chat.completions.create({
    model: getDeployment(),
    messages: messages,
    max_tokens: 1024,
    stream: true,
  });

  let fullResponse = "";
  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content || "";
    if (text) {
      fullResponse += text;
      res.write(`data: ${JSON.stringify({ type: "chunk", text })}\n\n`);
    }
  }

  return fullResponse;
};

export const scoreAllSkills = async (session: AssessmentSession): Promise<SkillScore[]> => {
  const resumeSummary = session.resumeRaw ? session.resumeRaw.slice(0, 500) + "..." : "No resume.";
  const roleLevel = session.parsedJD?.roleLevel || "mid";

  const skillsData = session.skillsToAssess.map((skill) => {
    const skillHistory = session.conversationHistory
      .filter((msg) => msg.skillBeingAssessed === skill)
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join("\n");

    const requiredLevel = session.parsedJD?.requiredSkills.find((s) => s.skillName === skill)?.requiredLevel || 5;
    const claimedLevel = session.parsedResume?.claimedSkills.find((s) => s.skillName === skill)?.claimedLevel || 3;

    return `Skill: ${skill}\nRequired: ${requiredLevel}/10\nClaimed: ${claimedLevel}/10\nTranscript:\n${skillHistory}\n`;
  }).join("\n---\n");

  try {
    const text = await callAzure(
      SCORER_SYSTEM_PROMPT,
      getScorerUserPrompt(resumeSummary, session.jobTitle, session.companyName, roleLevel, skillsData),
      true
    );
    const parsed = JSON.parse(extractJSON(text));
    return parsed.skillScores;
  } catch (error) {
    console.error("Azure Scoring Error:", error);
    throw error;
  }
};

export const generateLearningPlan = async (session: AssessmentSession): Promise<LearningPlan> => {
  const years = session.parsedResume?.totalYearsExperience || 0;
  const edu = session.parsedResume?.educationSummary || "Unknown";
  const projects = session.parsedResume?.notableProjects || [];
  const roleLevel = session.parsedJD?.roleLevel || "mid";
  const domain = session.parsedJD?.domain || "Software";

  try {
    const text = await callAzure(
      LEARNING_PLAN_SYSTEM_PROMPT,
      getLearningPlanUserPrompt(years, edu, projects, session.jobTitle, session.companyName, roleLevel, domain, JSON.stringify(session.skillScores)),
      true
    );
    return JSON.parse(extractJSON(text));
  } catch (error) {
    console.error("Azure Plan Gen Error:", error);
    throw error;
  }
};
