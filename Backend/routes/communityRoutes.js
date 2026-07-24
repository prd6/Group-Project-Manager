import express from "express";
import { getCommunityStats } from "../controllers/communityController.js";

const router = express.Router();

router.get("/stats", getCommunityStats);

export default router;