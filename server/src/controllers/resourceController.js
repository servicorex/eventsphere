import { pool } from '../config/db.js';

export async function getResources(req, res) {
  try {
    const result = await pool.query('SELECT * FROM resources ORDER BY id ASC');
    return res.status(200).json({
      success: true,
      resources: result.rows
    });
  } catch (error) {
    console.error('[getResources Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve resources.' });
  }
}

export async function getResourceById(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM resources WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Resource not found.' });
    }
    return res.status(200).json({ success: true, resource: result.rows[0] });
  } catch (error) {
    console.error('[getResourceById Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve resource.' });
  }
}

export async function createResource(req, res) {
  try {
    const { resource_code, name, type, quantity } = req.body;

    if (!name || !type || quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Name, type, and quantity are required.'
      });
    }

    const validTypes = ['Equipment', 'Staff', 'Transport', 'Other'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Type must be one of: ${validTypes.join(', ')}`
      });
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a non-negative integer.'
      });
    }

    let code = resource_code;
    if (!code) {
      const countRes = await pool.query('SELECT COUNT(*) FROM resources');
      const nextNum = parseInt(countRes.rows[0].count, 10) + 1;
      code = `R${String(nextNum).padStart(3, '0')}`;
    }

    const status = qty > 0 ? 'Available' : 'Depleted';

    const result = await pool.query(
      `INSERT INTO resources (resource_code, name, type, quantity, available_quantity, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [code, name.trim(), type, qty, qty, status]
    );

    return res.status(201).json({
      success: true,
      message: 'Resource created successfully.',
      resource: result.rows[0]
    });
  } catch (error) {
    console.error('[createResource Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to create resource.' });
  }
}

export async function updateResource(req, res) {
  try {
    const { id } = req.params;
    const { name, type, quantity, status } = req.body;

    const existing = await pool.query('SELECT * FROM resources WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Resource not found.' });
    }

    const current = existing.rows[0];
    const newQty = quantity !== undefined ? parseInt(quantity, 10) : current.quantity;
    if (isNaN(newQty) || newQty < 0) {
      return res.status(400).json({ success: false, message: 'Quantity must be non-negative.' });
    }

    // Adjust available quantity proportionally if total quantity changed
    const allocated = current.quantity - current.available_quantity;
    if (newQty < allocated) {
      return res.status(400).json({
        success: false,
        message: `Cannot reduce total quantity below currently allocated quantity (${allocated}).`
      });
    }

    const newAvailable = newQty - allocated;
    const computedStatus = status || (newAvailable > 0 ? 'Available' : 'Depleted');

    const result = await pool.query(
      `UPDATE resources
       SET name = COALESCE($1, name),
           type = COALESCE($2, type),
           quantity = $3,
           available_quantity = $4,
           status = $5,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [name, type, newQty, newAvailable, computedStatus, id]
    );

    return res.status(200).json({
      success: true,
      message: 'Resource updated successfully.',
      resource: result.rows[0]
    });
  } catch (error) {
    console.error('[updateResource Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to update resource.' });
  }
}

export async function deleteResource(req, res) {
  try {
    const { id } = req.params;
    const existing = await pool.query('SELECT * FROM resources WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Resource not found.' });
    }

    await pool.query('DELETE FROM resources WHERE id = $1', [id]);
    return res.status(200).json({ success: true, message: 'Resource deleted successfully.' });
  } catch (error) {
    console.error('[deleteResource Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete resource.' });
  }
}
