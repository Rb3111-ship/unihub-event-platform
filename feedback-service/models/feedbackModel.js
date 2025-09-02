const pool = require('../db');

const createAnonymousFeedback = async (eventId, eventName, message, rating) => {
  const [result] = await pool.query(
    'INSERT INTO feedback (event_id, event_name, message, rating, created_at) VALUES (?, ?, ?, ?, NOW())',
    [eventId, eventName, message, rating]
  );
  return result.insertId;
};


const getFeedbacksByEvent = async (eventName) => {
  const [rows] = await pool.query(
    'SELECT f.event_name, f.message, f.rating, f.created_at FROM feedback f WHERE f.event_name = ? ORDER BY f.created_at DESC',
    [eventName]
  );
  return rows;
};

module.exports = { createAnonymousFeedback, getFeedbacksByEvent };
