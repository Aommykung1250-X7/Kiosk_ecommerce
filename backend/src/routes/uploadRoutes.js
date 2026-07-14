import { Router } from "express";
import uploadController, { uploadAuth } from "../controllers/uploadController.js";

const router = Router();

router.get("/uploads/:filename", uploadAuth, (req, res) => uploadController.getSlip(req, res));

export default router;
