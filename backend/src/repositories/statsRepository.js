import pool from "../data/db.js";

class StatsRepository {
  /**
   * Increment the session wakeup counter in kiosk_stats
   * @returns {Promise<number>}
   */
  async incrementWakeups() {
    const query = `
      INSERT INTO kiosk_stats (key, value) 
      VALUES ('session_wakeups', 1)
      ON CONFLICT (key) 
      DO UPDATE SET value = kiosk_stats.value + 1
      RETURNING value
    `;
    try {
      const res = await pool.query(query);
      return res.rows[0].value;
    } catch (error) {
      console.error("Error incrementing wakeups in DB:", error);
      throw error;
    }
  }

  /**
   * Get accumulated session stats (wakeups and total product views)
   * @returns {Promise<object>}
   */
  async getStats() {
    const wakeupsQuery = `SELECT value FROM kiosk_stats WHERE key = 'session_wakeups'`;
    const viewsQuery = `SELECT COALESCE(SUM(views), 0) AS total_views FROM products`;
    try {
      const [wakeupsRes, viewsRes] = await Promise.all([
        pool.query(wakeupsQuery),
        pool.query(viewsQuery)
      ]);

      const wakeups = wakeupsRes.rows[0] ? wakeupsRes.rows[0].value : 0;
      const totalViews = viewsRes.rows[0] ? parseInt(viewsRes.rows[0].total_views, 10) : 0;

      return {
        wakeups,
        totalViews
      };
    } catch (error) {
      console.error("Error fetching stats from DB:", error);
      throw error;
    }
  }
}

export default new StatsRepository();
