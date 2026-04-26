export type SkillCategory = "technical" | "soft" | "domain" | "tool";
export type ResourceType = "course" | "book" | "project" | "video" | "article" | "practice";
export type Difficulty = "beginner" | "intermediate" | "advanced";
export type RoleLevel = "junior" | "mid" | "senior" | "lead" | "principal";
export type AssessmentStatus =
  | "input"        // user filling in JD + resume
  | "parsing"      // AI extracting skills
  | "skill_map"    // showing user the extracted skills for confirmation
  | "assessing"    // live conversation in progress
  | "scoring"      // AI computing scores after chat
  | "plan_gen"     // AI generating learning plan
  | "complete";    // everything done, show results

export interface RequiredSkill {
  skillName: string;
  category: SkillCategory;
  requiredLevel: number;        // 1-10 how expert must you be
  description: string;
  isNonNegotiable: boolean;
}

export interface ClaimedSkill {
  skillName: string;
  yearsExperience: number;
  claimedLevel: number;         // 1-10 inferred from resume wording
  evidenceSnippet: string;      // quote from resume supporting the claim
}

export interface ParsedJD {
  requiredSkills: RequiredSkill[];
  niceToHaveSkills: { skillName: string; category: SkillCategory }[];
  roleLevel: RoleLevel;
  domain: string;
}

export interface ParsedResume {
  claimedSkills: ClaimedSkill[];
  totalYearsExperience: number;
  educationSummary: string;
  notableProjects: string[];
}

export interface ConversationMessage {
  role: "agent" | "user";
  content: string;
  skillBeingAssessed?: string;
  timestamp: string;
}

export interface SkillScore {
  skillName: string;
  claimedLevel: number;
  assessedLevel: number;        // 1-10 after conversation
  requiredLevel: number;
  gapScore: number;             // requiredLevel - assessedLevel
  confidenceScore: number;      // 0-1, how confident the AI is
  assessmentSummary: string;    // 2-3 sentence reasoning
  keyStrengths: string[];
  keyWeaknesses: string[];
  isGap: boolean;               // true if assessedLevel < requiredLevel - 1
}

export interface LearningResource {
  resourceTitle: string;
  resourceType: ResourceType;
  provider: string;
  url: string;
  estimatedHours: number;
  difficulty: Difficulty;
  whyRecommended: string;
}

export interface PrioritySkillPlan {
  skillName: string;
  currentLevel: number;
  targetLevel: number;
  weeklyHoursRequired: number;
  estimatedWeeks: number;
  learningPath: LearningResource[];
  adjacentSkillsToLeverage: string[];  // existing skills that help learn this
  weekByWeekMilestones: {
    week: number;
    goal: string;
    activities: string[];
  }[];
}

export interface LearningPlan {
  overallReadinessScore: number;     // 0-100
  readinessLabel:
    | "Strong Fit"
    | "Promising Candidate"
    | "Needs Development"
    | "Significant Gap";
  estimatedWeeksToReady: number;
  executiveSummary: string;          // 3-5 sentences for the candidate
  prioritySkillPlans: PrioritySkillPlan[];
  quickWins: string[];               // skills they can improve fast
  longTermGoals: string[];
  totalLearningHours: number;
}

export interface AssessmentSession {
  _id: string;
  userId: string;
  status: AssessmentStatus;
  jobTitle: string;
  companyName: string;
  jobDescriptionRaw: string;
  resumeRaw: string;
  resumeFileName?: string;
  parsedJD?: ParsedJD;
  parsedResume?: ParsedResume;
  skillsToAssess: string[];          // ordered list - which skills to cover
  currentSkillIndex: number;         // which skill is being assessed right now
  conversationHistory: ConversationMessage[];
  skillScores: SkillScore[];
  learningPlan?: LearningPlan;
  createdAt: string;
  updatedAt: string;
}
