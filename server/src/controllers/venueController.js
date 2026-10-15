import { pool } from '../config/db.js';

export async function getVenues(req, res) {
  try {
    const result = await pool.query('SELECT * FROM venues ORDER BY id ASC');
    return res.status(200).json({
      success: true,
      venues: result.rows
    });
  } catch (error) {
    console.error('[getVenues Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve venues.' });
  }
}

export async function getVenueById(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM venues WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Venue not found.' });
    }
    return res.status(200).json({ success: true, venue: result.rows[0] });
  } catch (error) {
    console.error('[getVenueById Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve venue details.' });
  }
}

export async function createVenue(req, res) {
  try {
    const { venue_code, name, location, capacity, availability, cost_per_day } = req.body;

    if (!name || !location || !capacity) {
      return res.status(400).json({
        success: false,
        message: 'Name, location, and capacity are required.'
      });
    }

    const cap = parseInt(capacity, 10);
    if (isNaN(cap) || cap <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Capacity must be a positive integer.'
      });
    }

    const cost = cost_per_day ? parseFloat(cost_per_day) : 0;
    const avail = availability || 'Available';

    // Auto-generate venue_code if not supplied
    let code = venue_code;
    if (!code) {
      const countRes = await pool.query('SELECT COUNT(*) FROM venues');
      const nextNum = parseInt(countRes.rows[0].count, 10) + 1;
      code = `V${String(nextNum).padStart(3, '0')}`;
    }

    const result = await pool.query(
      `INSERT INTO venues (venue_code, name, location, capacity, availability, cost_per_day)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [code, name.trim(), location.trim(), cap, avail, cost]
    );

    return res.status(201).json({
      success: true,
      message: 'Venue created successfully.',
      venue: result.rows[0]
    });
  } catch (error) {
    console.error('[createVenue Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to create venue.' });
  }
}

export async function updateVenue(req, res) {
  try {
    const { id } = req.params;
    const { name, location, capacity, availability, cost_per_day } = req.body;

    const existing = await pool.query('SELECT * FROM venues WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Venue not found.' });
    }

    const cap = capacity !== undefined ? parseInt(capacity, 10) : existing.rows[0].capacity;
    if (isNaN(cap) || cap <= 0) {
      return res.status(400).json({ success: false, message: 'Capacity must be a positive integer.' });
    }

    const result = await pool.query(
      `UPDATE venues
       SET name = COALESCE($1, name),
           location = COALESCE($2, location),
           capacity = $3,
           availability = COALESCE($4, availability),
           cost_per_day = COALESCE($5, cost_per_day),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [name, location, cap, availability, cost_per_day, id]
    );

    return res.status(200).json({
      success: true,
      message: 'Venue updated successfully.',
      venue: result.rows[0]
    });
  } catch (error) {
    console.error('[updateVenue Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to update venue.' });
  }
}

export async function deleteVenue(req, res) {
  try {
    const { id } = req.params;
    const existing = await pool.query('SELECT * FROM venues WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Venue not found.' });
    }

    await pool.query('DELETE FROM venues WHERE id = $1', [id]);
    return res.status(200).json({ success: true, message: 'Venue deleted successfully.' });
  } catch (error) {
    console.error('[deleteVenue Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete venue.' });
  }
}
