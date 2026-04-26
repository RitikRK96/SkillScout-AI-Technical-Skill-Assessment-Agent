import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import {
  getAssessments,
  createAssessment,
  getAssessment,
  deleteAssessment,
  uploadResume,
  parseAssessment,
  confirmSkills,
  scoreAssessment,
  generatePlan,
} from "../controllers/assessment.controller";
import { upload, parsePDFUpload } from "../middleware/upload.middleware";

const router = Router();

router.use(authenticate);

router.get("/", getAssessments);
router.post("/", createAssessment);
router.get("/:id", getAssessment);
router.delete("/:id", deleteAssessment);

router.post("/:id/upload-resume", (req, res, next) => {
  // Try multer first; if it fails (e.g. Firebase pre-parsed body), fall through to busboy
  upload.single("resume")(req, res, (err) => {
    if (err) {
      console.warn("[MULTER WARN] Falling back to busboy:", err.message);
    }
    next();
  });
}, parsePDFUpload("resume"), uploadResume);
router.post("/:id/parse", parseAssessment);
router.post("/:id/confirm-skills", confirmSkills);
router.post("/:id/score", scoreAssessment);
router.post("/:id/generate-plan", generatePlan);

export default router;
