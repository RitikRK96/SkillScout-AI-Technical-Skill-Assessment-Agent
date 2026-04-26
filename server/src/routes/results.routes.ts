import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { scoreAssessment, generatePlan } from "../controllers/results.controller";

const router = Router();

router.use(authenticate);

router.post("/:id/score", scoreAssessment);
router.post("/:id/generate-plan", generatePlan);

export default router;
