import fs from "fs";
import path from "path";
import { authenticateJWT } from "../middlewares/authMiddleware.js";

const uploadRoot = path.join(process.cwd(), "uploads", "slips");

const findFileSafely = (filename) => {
  const normalized = path.normalize(filename);
  const resolvedBase = path.resolve(uploadRoot, normalized);
  const resolvedRoot = path.resolve(uploadRoot);

  if (!resolvedBase.startsWith(resolvedRoot)) {
    throw new Error("Invalid file path");
  }

  const matches = [];
  const walk = (currentDir) => {
    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && entry.name === normalized) {
        matches.push(fullPath);
      }
    }
  };

  walk(resolvedRoot);
  return matches[0] || resolvedBase;
};

class UploadController {
  async getSlip(req, res) {
    try {
      const { filename } = req.params;
      const resolvedPath = findFileSafely(filename);

      if (!fs.existsSync(resolvedPath)) {
        return res.status(404).json({ error: "Slip not found." });
      }

      return res.sendFile(resolvedPath);
    } catch (error) {
      return res.status(400).json({ error: "Invalid slip request." });
    }
  }
}

export const uploadAuth = authenticateJWT;
export default new UploadController();
