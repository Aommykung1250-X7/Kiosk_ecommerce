import { Router } from "express";
import memberController from "../controllers/memberController.js";

const router = Router();

router.get("/members/:lineUserId", (req, res) => memberController.getMember(req, res));
router.post("/members", (req, res) => memberController.upsertMember(req, res));

export default router;
