import axios from "axios";
import { useAuthStore } from "../store/useAuthStore";
import {
  parseJDAndResumeWithGemini,
  scoreAllSkillsWithGemini,
  generateLearningPlanWithGemini,
} from "./gemini";
import type { AssessmentSession, SkillScore, LearningPlan } from "@shared/types";

// ─── Guest Mock Helpers ───────────────────────────────────────────
const getLocalAssessments = (): AssessmentSession[] => {
  try {
    return JSON.parse(localStorage.getItem("guest-assessments") || "[]");
  } catch (e) {
    return [];
  }
};

const saveLocalAssessments = (assessments: AssessmentSession[]) => {
  localStorage.setItem("guest-assessments", JSON.stringify(assessments));
};

const generateMockData = (jobTitle: string, companyName: string) => {
  const normalizedTitle = jobTitle.toLowerCase();
  
  let skills = ["Problem Solving", "Technical Communication", "Software Architecture", "Git & Version Control"];
  let domain = "Software Engineering";
  
  if (normalizedTitle.includes("front") || normalizedTitle.includes("react") || normalizedTitle.includes("web") || normalizedTitle.includes("ui")) {
    skills = ["React.js", "TypeScript", "State Management", "Tailwind CSS", "Web Performance"];
    domain = "Frontend Development";
  } else if (normalizedTitle.includes("back") || normalizedTitle.includes("node") || normalizedTitle.includes("api") || normalizedTitle.includes("server")) {
    skills = ["Node.js & Express", "Database Design", "REST APIs", "SQL / NoSQL Databases", "System Architecture"];
    domain = "Backend Development";
  } else if (normalizedTitle.includes("devops") || normalizedTitle.includes("cloud") || normalizedTitle.includes("infra")) {
    skills = ["AWS Cloud", "Docker & Containers", "CI/CD Pipelines", "Kubernetes", "Linux Administration"];
    domain = "Cloud & DevOps Operations";
  } else if (normalizedTitle.includes("data") || normalizedTitle.includes("ml") || normalizedTitle.includes("ai") || normalizedTitle.includes("python")) {
    skills = ["Python Programming", "Machine Learning", "Data Analysis (Pandas/SQL)", "Data Visualization", "TensorFlow / PyTorch"];
    domain = "Data Science & AI";
  }

  const requiredSkills = skills.map((skill, index) => ({
    skillName: skill,
    category: "technical" as const,
    requiredLevel: 7 + (index % 3),
    description: `Core proficiency in ${skill} is essential for this position at ${companyName}.`,
    isNonNegotiable: index < 2
  }));

  const claimedSkills = skills.map((skill, index) => ({
    skillName: skill,
    yearsExperience: 2 + (index % 4),
    claimedLevel: 6 + (index % 4),
    evidenceSnippet: `Worked with ${skill} extensively in previous projects, deploying applications and troubleshooting issues.`
  }));

  return {
    parsedJD: {
      requiredSkills,
      niceToHaveSkills: [
        { skillName: "Agile Methodologies", category: "soft" as const },
        { skillName: "Docker", category: "tool" as const }
      ],
      roleLevel: "mid" as const,
      domain
    },
    parsedResume: {
      claimedSkills,
      totalYearsExperience: 4,
      educationSummary: "B.S. in Computer Science",
      notableProjects: ["Enterprise Dashboard Application", "Scalable API Microservice"]
    },
    skillsToAssess: skills
  };
};

const generateMockScores = (session: AssessmentSession): SkillScore[] => {
  const requiredSkills = session.parsedJD?.requiredSkills || [];
  const claimedSkills = session.parsedResume?.claimedSkills || [];

  return session.skillsToAssess.map((skill) => {
    const req = requiredSkills.find((s) => s.skillName === skill)?.requiredLevel || 7;
    const cl = claimedSkills.find((s) => s.skillName === skill)?.claimedLevel || 6;
    
    const assessed = Math.max(3, Math.min(10, cl - (Math.random() > 0.5 ? 1 : 2)));
    const gap = req - assessed;
    
    return {
      skillName: skill,
      claimedLevel: cl,
      requiredLevel: req,
      assessedLevel: assessed,
      gapScore: gap,
      confidenceScore: 0.85,
      assessmentSummary: `The candidate demonstrated a reasonable baseline understanding of ${skill}. They were able to discuss core architecture, but showed some gaps in advanced edge-case handling.`,
      keyStrengths: ["Good understanding of basics", "Can apply concepts to small projects"],
      keyWeaknesses: ["Struggled to explain deep optimizations", "Lacked real-world tradeoff evaluation"],
      isGap: gap > 0
    };
  });
};

const generateMockLearningPlan = (session: AssessmentSession): LearningPlan => {
  const scores = session.skillScores || [];
  const gapSkills = scores.filter(s => s.isGap);
  
  const prioritySkillPlans = gapSkills.map((s) => {
    return {
      skillName: s.skillName,
      currentLevel: s.assessedLevel,
      targetLevel: s.requiredLevel,
      weeklyHoursRequired: 4,
      estimatedWeeks: 4,
      learningPath: [
        {
          resourceTitle: `Mastering ${s.skillName} - Ultimate Course`,
          resourceType: "course" as const,
          provider: "Udemy / Coursera",
          url: "https://www.coursera.org",
          estimatedHours: 15,
          difficulty: "intermediate" as const,
          whyRecommended: "Highly rated course focusing on intermediate concepts."
        },
        {
          resourceTitle: `Official ${s.skillName} Documentation`,
          resourceType: "article" as const,
          provider: "Official Docs",
          url: "https://docs.google.com",
          estimatedHours: 5,
          difficulty: "beginner" as const,
          whyRecommended: "Best reference for core syntax and APIs."
        }
      ],
      adjacentSkillsToLeverage: ["Problem Solving"],
      weekByWeekMilestones: [
        {
          week: 1,
          goal: "Learn core fundamentals and syntax",
          activities: ["Complete sections 1-3 of recommended course", "Read official documentation quickstart"]
        },
        {
          week: 2,
          goal: "Build a small sandbox project",
          activities: ["Create a simple application utilizing this skill", "Implement testing for edge cases"]
        },
        {
          week: 3,
          goal: "Deep dive into advanced topics",
          activities: ["Learn about optimization, performance, and scaling", "Refactor the sandbox project"]
        },
        {
          week: 4,
          goal: "Assess readiness and finalize",
          activities: ["Perform mock challenges on platform", "Review core tradeoffs and interview questions"]
        }
      ]
    };
  });

  const overallReadinessScore = Math.max(10, Math.min(100, Math.round(
    (scores.reduce((sum, s) => sum + s.assessedLevel, 0) / (scores.length * 10)) * 100
  )));

  let readinessLabel: "Strong Fit" | "Promising Candidate" | "Needs Development" | "Significant Gap" = "Needs Development";
  if (overallReadinessScore >= 80) readinessLabel = "Strong Fit";
  else if (overallReadinessScore >= 65) readinessLabel = "Promising Candidate";
  else if (overallReadinessScore >= 45) readinessLabel = "Needs Development";
  else readinessLabel = "Significant Gap";

  return {
    overallReadinessScore,
    readinessLabel,
    estimatedWeeksToReady: gapSkills.length * 2,
    executiveSummary: `Based on the assessment, you are a ${readinessLabel} for this role. You show a very solid understanding of core principles, but have gaps in ${gapSkills.map(s => s.skillName).join(", ")} that need to be closed to meet the target requirements.`,
    prioritySkillPlans,
    quickWins: gapSkills.slice(0, 2).map(s => s.skillName),
    longTermGoals: gapSkills.slice(2).map(s => s.skillName),
    totalLearningHours: gapSkills.length * 20
  };
};

const mockAdapter = async (config: any): Promise<any> => {
  const { url, method, data } = config;
  
  // Clean URL path to find routing endpoint
  const baseURL = config.baseURL || "http://localhost:5000/api";
  const path = url.replace(baseURL, "").replace(/^\/?api\/?/, "");

  const successResponse = (responseData: any) => ({
    data: responseData,
    status: 200,
    statusText: "OK",
    headers: {},
    config,
  });

  const errorResponse = (status: number, message: string) => {
    const err = new Error(message) as any;
    err.response = {
      data: { error: message },
      status,
      statusText: "Error",
      headers: {},
      config,
    };
    throw err;
  };

  // GET /assessments
  if ((path === "/assessments" || path === "assessments") && method.toLowerCase() === "get") {
    return successResponse(getLocalAssessments());
  }

  // POST /assessments
  if ((path === "/assessments" || path === "assessments") && method.toLowerCase() === "post") {
    const newSession: AssessmentSession = {
      _id: "guest_" + Math.random().toString(36).substring(2, 11),
      userId: "guest",
      status: "input",
      jobTitle: "",
      companyName: "",
      jobDescriptionRaw: "",
      resumeRaw: "",
      skillsToAssess: [],
      currentSkillIndex: 0,
      conversationHistory: [],
      skillScores: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const current = getLocalAssessments();
    current.push(newSession);
    saveLocalAssessments(current);
    return successResponse(newSession);
  }

  // GET /assessments/:id
  const getMatch = path.match(/^\/?assessments\/([^\/]+)$/);
  if (getMatch && method.toLowerCase() === "get") {
    const id = getMatch[1];
    const item = getLocalAssessments().find(a => a._id === id);
    if (!item) return errorResponse(404, "Assessment not found");
    return successResponse(item);
  }

  // DELETE /assessments/:id
  if (getMatch && method.toLowerCase() === "delete") {
    const id = getMatch[1];
    let current = getLocalAssessments();
    current = current.filter(a => a._id !== id);
    saveLocalAssessments(current);
    return successResponse({ success: true });
  }

  // POST /assessments/:id/upload-resume
  const uploadMatch = path.match(/^\/?assessments\/([^\/]+)\/upload-resume$/);
  if (uploadMatch && method.toLowerCase() === "post") {
    const id = uploadMatch[1];
    const current = getLocalAssessments();
    const session = current.find(a => a._id === id);
    if (!session) return errorResponse(404, "Assessment not found");
    
    let fileName = "Uploaded Resume.pdf";
    if (data instanceof FormData) {
      const file = data.get("resume") as File;
      if (file) fileName = file.name;
    }
    session.resumeFileName = fileName;
    session.resumeRaw = `Resume text extracted from ${fileName}. [Offline Sandbox Mode]`;
    session.updatedAt = new Date().toISOString();
    saveLocalAssessments(current);
    return successResponse(session);
  }

  // POST /assessments/:id/parse
  const parseMatch = path.match(/^\/?assessments\/([^\/]+)\/parse$/);
  if (parseMatch && method.toLowerCase() === "post") {
    const id = parseMatch[1];
    const current = getLocalAssessments();
    const session = current.find(a => a._id === id);
    if (!session) return errorResponse(404, "Assessment not found");

    const payload = typeof data === "string" ? JSON.parse(data) : data;
    session.jobTitle = payload.jobTitle || session.jobTitle;
    session.companyName = payload.companyName || session.companyName;
    session.jobDescriptionRaw = payload.jobDescriptionRaw || session.jobDescriptionRaw;
    if (payload.resumeRaw) {
      session.resumeRaw = payload.resumeRaw;
    }
    session.status = "parsing";
    saveLocalAssessments(current);

    const apiKey = useAuthStore.getState().geminiApiKey;
    try {
      if (apiKey) {
        const parsed = await parseJDAndResumeWithGemini(apiKey, session.jobDescriptionRaw, session.resumeRaw);
        session.parsedJD = parsed.parsedJD;
        session.parsedResume = parsed.parsedResume;
        session.skillsToAssess = parsed.skillsToAssess;
      } else {
        const mockParsed = generateMockData(session.jobTitle, session.companyName);
        session.parsedJD = mockParsed.parsedJD;
        session.parsedResume = mockParsed.parsedResume;
        session.skillsToAssess = mockParsed.skillsToAssess;
      }
      session.status = "skill_map";
      session.updatedAt = new Date().toISOString();
      saveLocalAssessments(current);
      return successResponse(session);
    } catch (e: any) {
      console.error(e);
      session.status = "input";
      saveLocalAssessments(current);
      return errorResponse(500, e.message || "Failed to parse profile");
    }
  }

  // POST /assessments/:id/confirm-skills
  const confirmMatch = path.match(/^\/?assessments\/([^\/]+)\/confirm-skills$/);
  if (confirmMatch && method.toLowerCase() === "post") {
    const id = confirmMatch[1];
    const current = getLocalAssessments();
    const session = current.find(a => a._id === id);
    if (!session) return errorResponse(404, "Assessment not found");

    const payload = typeof data === "string" ? JSON.parse(data) : data;
    session.skillsToAssess = payload.skills || session.skillsToAssess;
    session.currentSkillIndex = 0;
    session.status = "assessing";
    session.conversationHistory = [];
    session.updatedAt = new Date().toISOString();
    saveLocalAssessments(current);
    return successResponse(session);
  }

  // POST /assessments/:id/score
  const scoreMatch = path.match(/^\/?assessments\/([^\/]+)\/score$/);
  if (scoreMatch && method.toLowerCase() === "post") {
    const id = scoreMatch[1];
    const current = getLocalAssessments();
    const session = current.find(a => a._id === id);
    if (!session) return errorResponse(404, "Assessment not found");

    session.status = "scoring";
    saveLocalAssessments(current);

    const apiKey = useAuthStore.getState().geminiApiKey;
    try {
      let scores;
      if (apiKey) {
        scores = await scoreAllSkillsWithGemini(apiKey, session);
      } else {
        scores = generateMockScores(session);
      }
      session.skillScores = scores;
      session.status = "plan_gen";
      session.updatedAt = new Date().toISOString();
      saveLocalAssessments(current);
      return successResponse(session);
    } catch (e: any) {
      console.error(e);
      session.status = "assessing";
      saveLocalAssessments(current);
      return errorResponse(500, e.message || "Failed to score assessment");
    }
  }

  // POST /assessments/:id/generate-plan
  const planMatch = path.match(/^\/?assessments\/([^\/]+)\/generate-plan$/);
  if (planMatch && method.toLowerCase() === "post") {
    const id = planMatch[1];
    const current = getLocalAssessments();
    const session = current.find(a => a._id === id);
    if (!session) return errorResponse(404, "Assessment not found");

    const apiKey = useAuthStore.getState().geminiApiKey;
    try {
      let plan;
      if (apiKey) {
        plan = await generateLearningPlanWithGemini(apiKey, session);
      } else {
        plan = generateMockLearningPlan(session);
      }
      session.learningPlan = plan;
      session.status = "complete";
      session.updatedAt = new Date().toISOString();
      saveLocalAssessments(current);
      return successResponse(session);
    } catch (e: any) {
      console.error(e);
      session.status = "plan_gen";
      saveLocalAssessments(current);
      return errorResponse(500, e.message || "Failed to generate learning plan");
    }
  }

  return errorResponse(404, `No simulated endpoint found for ${method} ${path}`);
};

// ─── API Setup ────────────────────────────────────────────────────
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
});

// Configure Axios Adapter to route guest requests locally
const originalAdapter = api.defaults.adapter;

api.defaults.adapter = async (config) => {
  if (useAuthStore.getState().isGuest) {
    return mockAdapter(config);
  }
  if (originalAdapter) {
    return (originalAdapter as any)(config);
  }
  // Fallback if defaults.adapter is not set
  return axios.defaults.adapter
    ? (axios.defaults.adapter as any)(config)
    : Promise.reject(new Error("No adapter configured"));
};

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    // Don't run standard interceptor refreshes if in guest mode
    if (useAuthStore.getState().isGuest) {
      return Promise.reject(error);
    }
    
    const isRefreshCall = originalRequest.url?.includes("/auth/refresh");
    const isLoginCall = originalRequest.url?.includes("/auth/login");

    if (error.response?.status === 401 && !originalRequest._retry && !isRefreshCall && !isLoginCall) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await api.post("/auth/refresh");
        isRefreshing = false;
        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        processQueue(refreshError);
        useAuthStore.getState().logout();
        window.location.href = "/";
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
