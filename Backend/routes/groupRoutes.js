import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  createGroup,
  joinGroup,
  getMyGroups,
  getSingleGroup,
} from "../controllers/groupController.js";

const router = express.Router();

router.post("/create", authMiddleware, createGroup);

router.post("/join", authMiddleware, joinGroup);

router.get("/my-groups", authMiddleware, getMyGroups);

router.get("/:id", authMiddleware, getSingleGroup);

export default router;