import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { chatStream } from "../controllers/chat.controller";

const router = Router();

router.use(authenticate);

router.get("/:id/message", chatStream);

export default router;
