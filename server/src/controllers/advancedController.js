import { pool } from '../config/db.js';

// --- ATTENDEE & REGISTRATION CONTROLLERS ---

export async function getRegistrations(req, res) {
  try {
    const { eventId } = req.query;
    let queryText = `
      SELECT r.*, e.title AS event_title, TO_CHAR(e.date, 'YYYY-MM-DD') AS event_date, e.start_time, e.end_time, v.name AS venue_name
      FROM event_registrations r
      JOIN events e ON r.event_id = e.id
      LEFT JOIN venues v ON e.venue_id = v.id
    `;
    const params = [];
    if (eventId) {
      queryText += ' WHERE r.event_id = $1';
      params.push(eventId);
    }
    queryText += ' ORDER BY r.registered_at DESC';

    const result = await pool.query(queryText, params);
    return res.status(200).json({ success: true, registrations: result.rows });
  } catch (err) {
    console.error('[getRegistrations Error]:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch registrations.' });
  }
}

export async function registerForEvent(req, res) {
  try {
    const { event_id, attendee_name, attendee_email } = req.body;
    if (!event_id || !attendee_name || !attendee_email) {
      return res.status(400).json({ success: false, message: 'Event, name, and email are required.' });
    }

    // Verify event exists
    const eventRes = await pool.query('SELECT * FROM events WHERE id = $1', [event_id]);
    if (eventRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    const ticketCode = `TCK-${event_id}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const insertRes = await pool.query(
      `INSERT INTO event_registrations (event_id, attendee_name, attendee_email, ticket_code, check_in_status)
       VALUES ($1, $2, $3, $4, 'Registered')
       RETURNING *`,
      [event_id, attendee_name.trim(), attendee_email.trim().toLowerCase(), ticketCode]
    );

    return res.status(201).json({
      success: true,
      message: 'Registration successful! Digital ticket generated.',
      ticket: insertRes.rows[0]
    });
  } catch (err) {
    console.error('[registerForEvent Error]:', err);
    return res.status(500).json({ success: false, message: 'Failed to register for event.' });
  }
}

export async function checkInTicket(req, res) {
  try {
    const { ticketCode } = req.body;
    if (!ticketCode) {
      return res.status(400).json({ success: false, message: 'Ticket code is required.' });
    }

    const findRes = await pool.query(
      'SELECT * FROM event_registrations WHERE UPPER(ticket_code) = UPPER($1)',
      [ticketCode.trim()]
    );

    if (findRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Invalid ticket code. Ticket not found.' });
    }

    const reg = findRes.rows[0];
    if (reg.check_in_status === 'Checked-In') {
      return res.status(400).json({ success: false, message: 'Ticket has ALREADY been checked in!' });
    }

    await pool.query(
      "UPDATE event_registrations SET check_in_status = 'Checked-In' WHERE id = $1",
      [reg.id]
    );

    return res.status(200).json({
      success: true,
      message: `Verified! Check-in successful for ${reg.attendee_name}.`,
      attendee: reg.attendee_name,
      ticketCode: reg.ticket_code
    });
  } catch (err) {
    console.error('[checkInTicket Error]:', err);
    return res.status(500).json({ success: false, message: 'Failed to process check-in.' });
  }
}

// --- VENDOR CONTRACTS CONTROLLERS ---

export async function getVendorContracts(req, res) {
  try {
    const result = await pool.query(`
      SELECT vc.*, e.title AS event_title, TO_CHAR(e.date, 'YYYY-MM-DD') AS event_date
      FROM vendor_contracts vc
      JOIN events e ON vc.event_id = e.id
      ORDER BY vc.created_at DESC
    `);
    return res.status(200).json({ success: true, contracts: result.rows });
  } catch (err) {
    console.error('[getVendorContracts Error]:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch vendor contracts.' });
  }
}

export async function createVendorContract(req, res) {
  try {
    const { event_id, vendor_name, service_type, contract_amount, payment_status, notes } = req.body;
    if (!event_id || !vendor_name || !service_type) {
      return res.status(400).json({ success: false, message: 'Event, vendor name, and service type are required.' });
    }

    const amount = contract_amount ? parseFloat(contract_amount) : 0;
    const status = payment_status || 'Pending';

    const insertRes = await pool.query(
      `INSERT INTO vendor_contracts (event_id, vendor_name, service_type, contract_amount, payment_status, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [event_id, vendor_name.trim(), service_type.trim(), amount, status, notes || '']
    );

    return res.status(201).json({
      success: true,
      message: 'Vendor contract created successfully.',
      contract: insertRes.rows[0]
    });
  } catch (err) {
    console.error('[createVendorContract Error]:', err);
    return res.status(500).json({ success: false, message: 'Failed to create vendor contract.' });
  }
}

export async function updateContractStatus(req, res) {
  try {
    const { id } = req.params;
    const { payment_status } = req.body;

    const updateRes = await pool.query(
      'UPDATE vendor_contracts SET payment_status = $1 WHERE id = $2 RETURNING *',
      [payment_status, id]
    );

    if (updateRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Contract not found.' });
    }

    return res.status(200).json({ success: true, contract: updateRes.rows[0] });
  } catch (err) {
    console.error('[updateContractStatus Error]:', err);
    return res.status(500).json({ success: false, message: 'Failed to update contract.' });
  }
}
