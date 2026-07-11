import type { AssessmentSession, ParsedJD, ParsedResume, SkillScore, LearningPlan } from "@shared/types";

// Prompts copied and adapted from server prompts
export const PARSER_SYSTEM_PROMPT = `
You are an expert technical recruiter and skills analyst.
Your job is to deeply analyze a Job Description and a candidate's
Resume and extract structured data. Be precise and objective.

Return ONLY valid JSON - no markdown, no explanation.
`;

export const getParserUserPrompt = (jdText: string, resumeText: string) => `
JOB DESCRIPTION:
${jdText}

RESUME:
${resumeText}

Return a JSON object with exactly this shape:
{
  "parsedJD": {
    "requiredSkills": [
      {
        "skillName": string,
        "category": "technical"|"soft"|"domain"|"tool",
        "requiredLevel": number (1-10, how expert must they be),
        "description": string (1 sentence about what this skill means in THIS role),
        "isNonNegotiable": boolean
      }
    ],
    "niceToHaveSkills": [{ "skillName": string, "category": string }],
    "roleLevel": "junior"|"mid"|"senior"|"lead"|"principal",
    "domain": string
  },
  "parsedResume": {
    "claimedSkills": [
      {
        "skillName": string,
        "yearsExperience": number,
        "claimedLevel": number (1-10, infer from language: "familiar"=3, "proficient"=6, "expert"=9),
        "evidenceSnippet": string (direct quote or paraphrase from resume)
      }
    ],
    "totalYearsExperience": number,
    "educationSummary": string,
    "notableProjects": [string]
  },
  "skillsToAssess": [string] (ordered list: non-negotiable skills first, then gaps first)
}

Focus on skills from the JD. Only include resume skills that overlap
with JD requirements. Order skillsToAssess so we tackle critical
gaps and non-negotiable skills first.
`;

export const SKILL_SCOUT_PERSONA = `
You are SkillScout, a friendly but thorough AI interviewer.
You are assessing a candidate's REAL proficiency in specific skills
through natural conversation - not a formal quiz.

Your personality:
- Warm, encouraging, and professional
- Ask one question at a time - never multiple questions at once
- Ask follow-up questions that probe DEPTH, not breadth
- Listen for red flags: vague answers, buzzword-heavy responses 
  without substance, inability to explain tradeoffs
- Listen for green flags: specific examples, tradeoff discussions,
  mention of failures and what was learned
- Never tell the candidate what score you're giving them
- Transition naturally when you have enough signal on a skill
`;

export const getAssessmentOpenerSystemPrompt = (
  skillName: string,
  requiredLevel: number,
  jobTitle: string,
  companyName: string,
  claimedLevel: number,
  evidenceSnippet: string,
  roleLevel: string
) => `
${SKILL_SCOUT_PERSONA}

You are currently assessing: ${skillName}
Required level for this role: ${requiredLevel}/10
The role is: ${jobTitle} at ${companyName}
Candidate's claimed level: ${claimedLevel}/10
Evidence from resume: ${evidenceSnippet}

Role level context: ${roleLevel}
`;

export const getAssessmentOpenerUserPrompt = (
  skillName: string,
  claimedLevel: number
) => `
Start the assessment for ${skillName}. 
Open with a warm, natural transition message that tells the 
candidate we're moving to this skill, then ask ONE specific 
opening question that gives them room to demonstrate their depth.

If they claimed high experience (>7/10), ask them to walk you 
through a complex real-world scenario they handled.
If they claimed moderate experience (4-7), ask them to explain 
a core concept in their own words and a real example.
If they claimed low experience (<4), ask gently what exposure 
they have had and what they found most challenging.
`;

export const getContinueAssessmentSystemPrompt = (
  skillScoutSystem: string
) => `
${skillScoutSystem}

IMPORTANT INSTRUCTION: You are SkillScout. ONLY generate your (SkillScout's) next response. NEVER generate the Candidate's response.

At the END of your response, on a new line, output 
exactly ONE of these control tokens - nothing else on that line:
  [CONTINUE]          <- need more signal, ask a follow-up
  [SKILL_COMPLETE]    <- you have sufficient signal to score this skill
  [NEXT_SKILL]        <- transition naturally to the next skill

Use [SKILL_COMPLETE] only after at least 6-7 exchanges where you have deep signal. Do NOT wrap up too quickly.
Never continue past 10 exchanges on a single skill - move on.
`;

export const SCORER_SYSTEM_PROMPT = `
You are an expert technical hiring manager. Given the full 
assessment conversation for each skill, produce an objective 
proficiency score and detailed analysis.

Return ONLY valid JSON.
`;

export const getScorerUserPrompt = (
  resumeSummary: string,
  jobTitle: string,
  companyName: string,
  roleLevel: string,
  skillsDataStr: string
) => `
Candidate: ${resumeSummary}
Role: ${jobTitle} at ${companyName} (level: ${roleLevel})

For each skill below, I'm providing the conversation transcript.
Score each skill based on what the candidate DEMONSTRATED, not 
what they claimed.

Scoring rubric:
  1-2:  No real knowledge. Cannot explain basics.
  3-4:  Aware of concept. Can describe it but can't apply it well.
  5-6:  Working knowledge. Can use it but has gaps in depth.
  7-8:  Strong proficiency. Handles complex scenarios with nuance.
  9-10: Expert. Deep internals knowledge, teaches others, knows tradeoffs.

${skillsDataStr}

Return:
{
  "skillScores": [
    {
      "skillName": string,
      "claimedLevel": number,
      "assessedLevel": number,
      "requiredLevel": number,
      "gapScore": number,
      "confidenceScore": number (0-1),
      "assessmentSummary": string (2-3 sentences explaining the score),
      "keyStrengths": [string],
      "keyWeaknesses": [string],
      "isGap": boolean
    }
  ]
}
`;

export const LEARNING_PLAN_SYSTEM_PROMPT = `
You are an expert learning designer and career coach.
Given a candidate's skill scores, create a realistic, 
personalised learning plan that focuses on:
1. Skills with the largest gaps (required - assessed > 2)
2. Adjacent skills the candidate can realistically acquire 
   using their existing knowledge as a springboard
3. Quick wins (skills only 1-2 levels below required)

For resources: recommend REAL, specific, well-known resources
(Udemy, Coursera, freeCodeCamp, official docs, books on O'Reilly, 
YouTube channels). Use real URLs where you know them confidently.

Return ONLY valid JSON.
`;

export const getLearningPlanUserPrompt = (
  totalYearsExperience: number,
  educationSummary: string,
  notableProjects: string[],
  jobTitle: string,
  companyName: string,
  roleLevel: string,
  domain: string,
  skillScoresJSON: string
) => `
Candidate Background:
  - Experience: ${totalYearsExperience} years
  - Education: ${educationSummary}
  - Notable Projects: ${notableProjects.join(", ")}
  - Role Target: ${jobTitle} at ${companyName} (level: ${roleLevel})
  - Domain: ${domain}

Skill Scores:
${skillScoresJSON}

Generate a learning plan. Constraints:
- Assume candidate has 10 hours/week available for learning
- Focus only on skills where isGap === true, ordered by gapScore desc
- For each gap skill, identify which of the candidate's EXISTING 
  strong skills (assessedLevel >= 7) can accelerate learning it
- weekByWeekMilestones should be practical and specific 
  (e.g. "Week 2: Complete sections 3-5 of course X, build a small 
  demo using Y, read the official docs on Z")
- Keep estimatedWeeks realistic - don't promise 2 weeks for 
  something that takes 3 months
- quickWins = gap skills they can close in under 3 weeks

Return a full LearningPlan object matching this shape:
{
  "overallReadinessScore": number (0-100),
  "readinessLabel": "Strong Fit"|"Promising Candidate"|"Needs Development"|"Significant Gap",
  "estimatedWeeksToReady": number,
  "executiveSummary": string (3-5 sentences, encouraging but honest),
  "prioritySkillPlans": [
    {
      "skillName": string,
      "currentLevel": number,
      "targetLevel": number,
      "weeklyHoursRequired": number,
      "estimatedWeeks": number,
      "learningPath": [
        {
          "resourceTitle": string,
          "resourceType": "course"|"book"|"project"|"video"|"article"|"practice",
          "provider": string,
          "url": string,
          "estimatedHours": number,
          "difficulty": "beginner"|"intermediate"|"advanced",
          "whyRecommended": string (1 sentence, specific to this candidate)
        }
      ],
      "adjacentSkillsToLeverage": [string],
      "weekByWeekMilestones": [
        { "week": number, "goal": string, "activities": [string] }
      ]
    }
  ],
  "quickWins": [string],
  "longTermGoals": [string],
  "totalLearningHours": number
}
`;

// Helper to extract JSON from markdown if Gemini wraps it in code blocks
export function extractJSON(text: string): string {
  const match = text.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
  if (match) return match[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1) return text.slice(start, end + 1);
  return text.trim();
}

async function fetchWithRetry(url: string, options: RequestInit, retries = 3, delay = 1500): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.status === 429 || response.status === 503) {
        if (i < retries - 1) {
          console.warn(`Gemini API returned status ${response.status}. Retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 2; // Exponential backoff
          continue;
        }
      }
      return response;
    } catch (error) {
      if (i < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2;
        continue;
      }
      throw error;
    }
  }
  return fetch(url, options);
}

// Call Google Gemini API
export async function callGemini(
  apiKey: string,
  systemPrompt: string,
  userPromptOrContents: string | any[],
  jsonMode = false
): Promise<string> {
  const contents = typeof userPromptOrContents === "string"
    ? [
        {
          role: "user",
          parts: [{ text: userPromptOrContents }],
        },
      ]
    : userPromptOrContents;

  const payload: any = {
    contents,
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
  };

  if (jsonMode) {
    payload.generationConfig = {
      responseMimeType: "application/json",
    };
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;

  try {
    const response = await fetchWithRetry(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errMsg = errorData.error?.message || "";
      if (response.status === 404 || errMsg.toLowerCase().includes("not found")) {
        // Fallback to gemini-2.5-flash
        const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        const fallbackRes = await fetchWithRetry(fallbackUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!fallbackRes.ok) {
          const fallbackErr = await fallbackRes.json().catch(() => ({}));
          const fbMsg = fallbackErr.error?.message || "";
          if (fallbackRes.status === 404 || fbMsg.toLowerCase().includes("not found")) {
            // Secondary fallback to gemini-2.0-flash
            const fallbackUrl2 = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
            const fallbackRes2 = await fetchWithRetry(fallbackUrl2, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(payload),
            });
            if (!fallbackRes2.ok) {
              const fallbackErr2 = await fallbackRes2.json().catch(() => ({}));
              throw new Error(fallbackErr2.error?.message || `Gemini API returned status ${fallbackRes2.status}`);
            }
            const fallbackData2 = await fallbackRes2.json();
            return fallbackData2.candidates?.[0]?.content?.parts?.[0]?.text || "";
          }
          throw new Error(fbMsg || `Fallback Gemini API returned status ${fallbackRes.status}`);
        }

        const fallbackData = await fallbackRes.json();
        return fallbackData.candidates?.[0]?.content?.parts?.[0]?.text || "";
      }
      throw new Error(errMsg || `Gemini API returned status ${response.status}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  } catch (error) {
    throw error;
  }
}

// Helper to simulate a response by running Gemini
export const parseJDAndResumeWithGemini = async (
  apiKey: string,
  jdText: string,
  resumeText: string
): Promise<{
  parsedJD: ParsedJD;
  parsedResume: ParsedResume;
  skillsToAssess: string[];
}> => {
  const text = await callGemini(apiKey, PARSER_SYSTEM_PROMPT, getParserUserPrompt(jdText, resumeText), true);
  return JSON.parse(extractJSON(text));
};

export const getAssessmentOpenerWithGemini = async (
  apiKey: string,
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

  return callGemini(apiKey, systemPrompt, getAssessmentOpenerUserPrompt(skillName, claimedInfo?.claimedLevel || 3));
};

export const continueAssessmentWithGemini = async (
  apiKey: string,
  session: AssessmentSession,
  isLastQuestion: boolean = false
): Promise<string> => {
  const currentSkill = session.skillsToAssess[session.currentSkillIndex];
  const historyForSkill = session.conversationHistory.filter(
    (msg) => msg.skillBeingAssessed === currentSkill
  );

  let systemPrompt = getContinueAssessmentSystemPrompt(SKILL_SCOUT_PERSONA);

  if (isLastQuestion) {
    systemPrompt += `\n\nIMPORTANT: This is the FINAL exchange for this skill. You MUST wrap up your assessment now. Give a brief, warm closing remark for this skill and end with [SKILL_COMPLETE]. Do NOT use [CONTINUE].`;
  }

  // Build conversation history for Gemini. 
  // Standard roles must alternate user -> model
  // If the last message is model, Gemini might complain.
  // The last message in historyForSkill will be a user message (user's latest input).
  const contents = historyForSkill.map((msg) => ({
    role: msg.role === "user" ? "user" : "model",
    parts: [{ text: msg.content }],
  }));

  return callGemini(apiKey, systemPrompt, contents);
};

export const scoreAllSkillsWithGemini = async (
  apiKey: string,
  session: AssessmentSession
): Promise<SkillScore[]> => {
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

  const text = await callGemini(
    apiKey,
    SCORER_SYSTEM_PROMPT,
    getScorerUserPrompt(resumeSummary, session.jobTitle, session.companyName, roleLevel, skillsData),
    true
  );
  const parsed = JSON.parse(extractJSON(text));
  return parsed.skillScores;
};

export const generateLearningPlanWithGemini = async (
  apiKey: string,
  session: AssessmentSession
): Promise<LearningPlan> => {
  const years = session.parsedResume?.totalYearsExperience || 0;
  const edu = session.parsedResume?.educationSummary || "Unknown";
  const projects = session.parsedResume?.notableProjects || [];
  const roleLevel = session.parsedJD?.roleLevel || "mid";
  const domain = session.parsedJD?.domain || "Software";

  const text = await callGemini(
    apiKey,
    LEARNING_PLAN_SYSTEM_PROMPT,
    getLearningPlanUserPrompt(years, edu, projects, session.jobTitle, session.companyName, roleLevel, domain, JSON.stringify(session.skillScores)),
    true
  );
  return JSON.parse(extractJSON(text));
};
