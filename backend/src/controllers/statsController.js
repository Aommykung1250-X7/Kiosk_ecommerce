import statsRepository from "../repositories/statsRepository.js";

class StatsController {
  /**
   * Handle POST /api/kiosk/wakeup
   */
  async incrementWakeups(req, res) {
    try {
      const value = await statsRepository.incrementWakeups();
      return res.json({ message: "Kiosk wakeup incremented successfully", value });
    } catch (error) {
      console.error("Error in StatsController.incrementWakeups:", error);
      return res.status(500).json({ error: "Internal server error occurred." });
    }
  }

  /**
   * Handle GET /api/kiosk/stats
   */
  async getKioskStats(req, res) {
    try {
      const stats = await statsRepository.getStats();
      return res.json(stats);
    } catch (error) {
      console.error("Error in StatsController.getKioskStats:", error);
      return res.status(500).json({ error: "Internal server error occurred." });
    }
  }
}

export default new StatsController();
