import { Router } from "express";
import dotenv from "dotenv";
import { authenticate } from "passport";
import { llm, test_llm } from "../controllers/llm";
import authenticate_jwt from "../middlewares/authenticate_jwt";

dotenv.config();
const router = Router();
// POST endpoint to interact with OpenAI
router.post("/", authenticate_jwt,llm);

// GET endpoint for testing
router.get("/test", test_llm);

export default router;