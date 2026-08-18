import { Router } from "express";
import memberController from "../controllers/memberController.js";

const router = Router();

router.get("/members/email/:email", (req, res) => memberController.getMemberByEmail(req, res));
router.post("/members", (req, res) => memberController.upsertMember(req, res));
router.delete("/members/address", (req, res) => memberController.deleteAddress(req, res));

export default router;
