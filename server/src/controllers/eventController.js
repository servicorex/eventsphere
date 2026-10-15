import { pool } from '../config/db.js';

/**
 * Retrieve all events with venue info and allocated resources
 */
export async function getEvents(req, res) {
  try {
    const result = await pool.query(`
      SELECT 
        e.id,
        e.title,
        e.event_type,
        TO_CHAR(e.date, 'YYYY-MM-DD') as date,
        e.start_time,
        e.end_time,
        e.budget,
        e.expected_attendees,
        e.venue_id,
        e.organizer_id,
        e.status,
        e.created_at,
        e.updated_at,
        v.name AS venue_name,
        v.capacity AS venue_capacity,
        v.location AS venue_location,
        v.cost_per_day AS venue_cost,
        u.name AS organizer_name,
        COALESCE(
          json_agg(
            json_build_object(
              'id', r.id,
              'resource_code', r.resource_code,
              'name', r.name,
              'type', r.type,
              'quantity', er.quantity
            )
          ) FILTER (WHERE r.id IS NOT NULL),
          '[]'
        ) AS allocated_resources
      FROM events e
      LEFT JOIN venues v ON e.venue_id = v.id
      LEFT JOIN users u ON e.organizer_id = u.id
      LEFT JOIN event_resources er ON e.id = er.event_id
      LEFT JOIN resources r ON er.resource_id = r.id
      GROUP BY e.id, v.id, u.id
      ORDER BY e.date ASC, e.start_time ASC
    `);

    return res.status(200).json({
      success: true,
      events: result.rows
    });
  } catch (error) {
    console.error('[getEvents Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve events.' });
  }
}

/**
 * Retrieve a single event by ID
 */
export async function getEventById(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT 
        e.id,
        e.title,
        e.event_type,
        TO_CHAR(e.date, 'YYYY-MM-DD') as date,
        e.start_time,
        e.end_time,
        e.budget,
        e.expected_attendees,
        e.venue_id,
        e.organizer_id,
        e.status,
        e.created_at,
        e.updated_at,
        v.name AS venue_name,
        v.capacity AS venue_capacity,
        v.location AS venue_location,
        u.name AS organizer_name,
        COALESCE(
          json_agg(
            json_build_object(
              'id', r.id,
              'resource_code', r.resource_code,
              'name', r.name,
              'type', r.type,
              'quantity', er.quantity
            )
          ) FILTER (WHERE r.id IS NOT NULL),
          '[]'
        ) AS allocated_resources
      FROM events e
      LEFT JOIN venues v ON e.venue_id = v.id
      LEFT JOIN users u ON e.organizer_id = u.id
      LEFT JOIN event_resources er ON e.id = er.event_id
      LEFT JOIN resources r ON er.resource_id = r.id
      WHERE e.id = $1
      GROUP BY e.id, v.id, u.id
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    return res.status(200).json({ success: true, event: result.rows[0] });
  } catch (error) {
    console.error('[getEventById Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve event.' });
  }
}

/**
 * Create a new event with capacity and conflict validations
 */
export async function createEvent(req, res) {
  const client = await pool.connect();
  try {
    const {
      title,
      event_type,
      date,
      start_time,
      end_time,
      budget,
      expected_attendees,
      venue_id,
      resources
    } = req.body;

    if (!title || !event_type || !date || !start_time || !end_time) {
      return res.status(400).json({
        success: false,
        message: 'Title, event type, date, start time, and end time are required.'
      });
    }

    // Validate times
    if (start_time >= end_time) {
      return res.status(400).json({
        success: false,
        message: 'End time must be after start time.'
      });
    }

    const attendees = expected_attendees ? parseInt(expected_attendees, 10) : 0;
    const bgt = budget ? parseFloat(budget) : 0;
    const organizerId = req.user ? req.user.id : null;

    await client.query('BEGIN');

    // 1. Venue Validations (if venue selected)
    if (venue_id) {
      const venueRes = await client.query('SELECT * FROM venues WHERE id = $1', [venue_id]);
      if (venueRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, message: 'Selected venue does not exist.' });
      }

      const venue = venueRes.rows[0];

      // A. Capacity Check: Expected Attendees <= Venue Capacity
      if (attendees > venue.capacity) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: `Selected venue does not have sufficient capacity. (Capacity: ${venue.capacity}, Expected: ${attendees})`
        });
      }

      // B. Venue Conflict Detection (Overlapping Date & Time)
      const conflictRes = await client.query(`
        SELECT id, title, start_time, end_time 
        FROM events 
        WHERE venue_id = $1 
          AND date = $2 
          AND status != 'Cancelled'
          AND (start_time < $4::time AND end_time > $3::time)
      `, [venue_id, date, start_time, end_time]);

      if (conflictRes.rows.length > 0) {
        const c = conflictRes.rows[0];
        await client.query('ROLLBACK');
        return res.status(409).json({
          success: false,
          message: `Venue Conflict: ${venue.name} is already booked on ${date} between ${c.start_time} and ${c.end_time} for "${c.title}".`
        });
      }
    }

    // 2. Insert Event
    const insertEventRes = await client.query(`
      INSERT INTO events (title, event_type, date, start_time, end_time, budget, expected_attendees, venue_id, organizer_id, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Scheduled')
      RETURNING *
    `, [title.trim(), event_type.trim(), date, start_time, end_time, bgt, attendees, venue_id || null, organizerId]);

    const newEvent = insertEventRes.rows[0];

    // 3. Resource Allocation (if resources supplied)
    if (resources && Array.isArray(resources) && resources.length > 0) {
      for (const item of resources) {
        const rId = item.resourceId || item.id;
        const reqQty = parseInt(item.quantity, 10);

        if (!rId || isNaN(reqQty) || reqQty <= 0) continue;

        // Fetch resource and lock row for update
        const rRes = await client.query(
          'SELECT * FROM resources WHERE id = $1 FOR UPDATE',
          [rId]
        );

        if (rRes.rows.length === 0) {
          await client.query('ROLLBACK');
          return res.status(400).json({
            success: false,
            message: `Resource with ID ${rId} does not exist.`
          });
        }

        const resource = rRes.rows[0];

        // Quantity availability check
        if (reqQty > resource.available_quantity) {
          await client.query('ROLLBACK');
          return res.status(400).json({
            success: false,
            message: `Insufficient quantity for ${resource.name}. Requested: ${reqQty}, Available: ${resource.available_quantity}.`
          });
        }

        // Deduct available quantity
        const newAvailable = resource.available_quantity - reqQty;
        const newStatus = newAvailable === 0 ? 'Depleted' : 'Available';

        await client.query(`
          UPDATE resources 
          SET available_quantity = $1, status = $2, updated_at = CURRENT_TIMESTAMP
          WHERE id = $3
        `, [newAvailable, newStatus, rId]);

        // Insert event_resource record
        await client.query(`
          INSERT INTO event_resources (event_id, resource_id, quantity)
          VALUES ($1, $2, $3)
        `, [newEvent.id, rId, reqQty]);
      }
    }

    await client.query('COMMIT');

    return res.status(201).json({
      success: true,
      message: 'Event created and scheduled successfully.',
      event: newEvent
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[createEvent Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to create event.' });
  } finally {
    client.release();
  }
}

/**
 * Update an existing event with conflict and capacity validations
 */
export async function updateEvent(req, res) {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const {
      title,
      event_type,
      date,
      start_time,
      end_time,
      budget,
      expected_attendees,
      venue_id,
      status
    } = req.body;

    await client.query('BEGIN');

    const existingRes = await client.query('SELECT * FROM events WHERE id = $1', [id]);
    if (existingRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    const current = existingRes.rows[0];
    const targetDate = date || current.date;
    const targetStart = start_time || current.start_time;
    const targetEnd = end_time || current.end_time;
    const targetAttendees = expected_attendees !== undefined ? parseInt(expected_attendees, 10) : current.expected_attendees;
    const targetVenueId = venue_id !== undefined ? venue_id : current.venue_id;

    if (targetStart >= targetEnd) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'End time must be after start time.' });
    }

    // Venue checks if venue is assigned
    if (targetVenueId) {
      const venueRes = await client.query('SELECT * FROM venues WHERE id = $1', [targetVenueId]);
      if (venueRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, message: 'Selected venue does not exist.' });
      }

      const venue = venueRes.rows[0];

      // Capacity Check
      if (targetAttendees > venue.capacity) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: `Selected venue does not have sufficient capacity. (Capacity: ${venue.capacity}, Expected: ${targetAttendees})`
        });
      }

      // Conflict Check (exclude current event)
      const conflictRes = await client.query(`
        SELECT id, title, start_time, end_time 
        FROM events 
        WHERE venue_id = $1 
          AND date = $2 
          AND id != $3
          AND status != 'Cancelled'
          AND (start_time < $5::time AND end_time > $4::time)
      `, [targetVenueId, targetDate, id, targetStart, targetEnd]);

      if (conflictRes.rows.length > 0) {
        const c = conflictRes.rows[0];
        await client.query('ROLLBACK');
        return res.status(409).json({
          success: false,
          message: `Venue Conflict: ${venue.name} is already booked on ${targetDate} between ${c.start_time} and ${c.end_time} for "${c.title}".`
        });
      }
    }

    const updateRes = await client.query(`
      UPDATE events
      SET title = COALESCE($1, title),
          event_type = COALESCE($2, event_type),
          date = COALESCE($3, date),
          start_time = COALESCE($4, start_time),
          end_time = COALESCE($5, end_time),
          budget = COALESCE($6, budget),
          expected_attendees = COALESCE($7, expected_attendees),
          venue_id = $8,
          status = COALESCE($9, status),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $10
      RETURNING *
    `, [title, event_type, targetDate, targetStart, targetEnd, budget, targetAttendees, targetVenueId || null, status, id]);

    await client.query('COMMIT');

    return res.status(200).json({
      success: true,
      message: 'Event updated successfully.',
      event: updateRes.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[updateEvent Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to update event.' });
  } finally {
    client.release();
  }
}

/**
 * Delete event and automatically release all allocated resources
 */
export async function deleteEvent(req, res) {
  const client = await pool.connect();
  try {
    const { id } = req.params;

    await client.query('BEGIN');

    const existing = await client.query('SELECT * FROM events WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    // Release allocated resources back to inventory
    const allocated = await client.query(
      'SELECT resource_id, quantity FROM event_resources WHERE event_id = $1',
      [id]
    );

    for (const alloc of allocated.rows) {
      await client.query(`
        UPDATE resources
        SET available_quantity = available_quantity + $1,
            status = 'Available',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [alloc.quantity, alloc.resource_id]);
    }

    // Delete event (event_resources cascade deleted via FK)
    await client.query('DELETE FROM events WHERE id = $1', [id]);

    await client.query('COMMIT');

    return res.status(200).json({
      success: true,
      message: 'Event deleted and allocated resources released back to inventory.'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[deleteEvent Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete event.' });
  } finally {
    client.release();
  }
}

/**
 * Allocate a resource to an event
 * POST /api/events/:id/resources
 */
export async function allocateResourceToEvent(req, res) {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { resourceId, quantity } = req.body;

    const qty = parseInt(quantity, 10);
    if (!resourceId || isNaN(qty) || qty <= 0) {
      return res.status(400).json({ success: false, message: 'Valid resourceId and positive quantity are required.' });
    }

    await client.query('BEGIN');

    // Check event exists
    const eventRes = await client.query('SELECT * FROM events WHERE id = $1', [id]);
    if (eventRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    // Lock resource
    const rRes = await client.query('SELECT * FROM resources WHERE id = $1 FOR UPDATE', [resourceId]);
    if (rRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Resource not found.' });
    }

    const resource = rRes.rows[0];
    if (qty > resource.available_quantity) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: `Cannot allocate ${qty} units. Only ${resource.available_quantity} available.`
      });
    }

    // Update or insert allocation
    const existingAlloc = await client.query(
      'SELECT quantity FROM event_resources WHERE event_id = $1 AND resource_id = $2',
      [id, resourceId]
    );

    if (existingAlloc.rows.length > 0) {
      await client.query(`
        UPDATE event_resources 
        SET quantity = quantity + $1
        WHERE event_id = $2 AND resource_id = $3
      `, [qty, id, resourceId]);
    } else {
      await client.query(`
        INSERT INTO event_resources (event_id, resource_id, quantity)
        VALUES ($1, $2, $3)
      `, [id, resourceId, qty]);
    }

    // Deduct stock
    const newAvail = resource.available_quantity - qty;
    const newStatus = newAvail === 0 ? 'Depleted' : 'Available';
    await client.query(`
      UPDATE resources
      SET available_quantity = $1, status = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
    `, [newAvail, newStatus, resourceId]);

    await client.query('COMMIT');

    return res.status(200).json({
      success: true,
      message: `Allocated ${qty} units of ${resource.name} to event.`,
      availableQuantity: newAvail
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[allocateResourceToEvent Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to allocate resource.' });
  } finally {
    client.release();
  }
}

/**
 * Release an allocated resource from an event
 * DELETE /api/events/:id/resources/:resourceId
 */
export async function releaseResourceFromEvent(req, res) {
  const client = await pool.connect();
  try {
    const { id, resourceId } = req.params;

    await client.query('BEGIN');

    const allocRes = await client.query(
      'SELECT quantity FROM event_resources WHERE event_id = $1 AND resource_id = $2',
      [id, resourceId]
    );

    if (allocRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Resource is not allocated to this event.' });
    }

    const allocQty = allocRes.rows[0].quantity;

    // Delete allocation
    await client.query('DELETE FROM event_resources WHERE event_id = $1 AND resource_id = $2', [id, resourceId]);

    // Restore resource availability
    await client.query(`
      UPDATE resources
      SET available_quantity = available_quantity + $1,
          status = 'Available',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [allocQty, resourceId]);

    await client.query('COMMIT');

    return res.status(200).json({
      success: true,
      message: 'Resource released successfully.'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[releaseResourceFromEvent Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to release resource.' });
  } finally {
    client.release();
  }
}
