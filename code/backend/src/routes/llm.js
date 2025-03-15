import { Router } from "express";
import dotenv from "dotenv";
import { llm, test_llm } from "../controllers/llm.js";
import authenticate_jwt from "../middlewares/authenticate_jwt.js";

dotenv.config();
const router = Router();
// POST endpoint to interact with OpenAI
router.post("/", authenticate_jwt,llm);

// GET endpoint for testing
router.get("/test", test_llm);

export default router;