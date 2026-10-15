import { pool } from '../config/db.js';

/**
 * Retrieve real-time dashboard analytics from PostgreSQL
 * GET /api/dashboard/stats
 */
export async function getDashboardStats(req, res) {
  try {
    const totalEventsRes = await pool.query(
      "SELECT COUNT(*) FROM events WHERE status != 'Cancelled'"
    );

    const upcomingEventsRes = await pool.query(
      "SELECT COUNT(*) FROM events WHERE date >= CURRENT_DATE AND status != 'Cancelled'"
    );

    const availableVenuesRes = await pool.query(
      "SELECT COUNT(*) FROM venues WHERE availability = 'Available'"
    );

    const totalVenuesRes = await pool.query(
      "SELECT COUNT(*) FROM venues"
    );

    const totalResourcesRes = await pool.query(
      "SELECT COUNT(*) FROM resources"
    );

    const availableResourcesRes = await pool.query(
      "SELECT COALESCE(SUM(available_quantity), 0) AS total_available, COALESCE(SUM(quantity), 0) AS total_capacity FROM resources"
    );

    const recentEventsRes = await pool.query(`
      SELECT 
        e.id, 
        e.title, 
        e.event_type, 
        TO_CHAR(e.date, 'YYYY-MM-DD') AS date,
        e.start_time, 
        e.end_time, 
        e.status, 
        e.expected_attendees,
        v.name AS venue_name
      FROM events e
      LEFT JOIN venues v ON e.venue_id = v.id
      ORDER BY e.date ASC, e.start_time ASC
      LIMIT 5
    `);

    return res.status(200).json({
      success: true,
      stats: {
        totalEvents: parseInt(totalEventsRes.rows[0].count, 10),
        upcomingEvents: parseInt(upcomingEventsRes.rows[0].count, 10),
        availableVenues: parseInt(availableVenuesRes.rows[0].count, 10),
        totalVenues: parseInt(totalVenuesRes.rows[0].count, 10),
        totalResources: parseInt(totalResourcesRes.rows[0].count, 10),
        resourceStock: {
          available: parseInt(availableResourcesRes.rows[0].total_available, 10),
          total: parseInt(availableResourcesRes.rows[0].total_capacity, 10)
        },
        recentEvents: recentEventsRes.rows
      }
    });
  } catch (error) {
    console.error('[getDashboardStats Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to compute dashboard analytics.'
    });
  }
}
