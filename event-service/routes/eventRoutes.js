const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const jwt = require('jsonwebtoken');
require('dotenv').config();
const {
  createEvent,
  getAllEvents,
  getEvents,
  rsvp,
  updateEvent,
  deleteEvent,
  getEventsByOrganizer,
  getRecent,
  getUpcomingEvents,
  getRSVP,
  singleEvent,
  eventPrompt
} = require('../controllers/eventControllers');


// validation rules  for ceating an updating events

const validateEvent = [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('location').notEmpty().withMessage('Location is required'),
  body('date').isISO8601().withMessage('Date must be a valid ISO8601 date'),
  body('type').notEmpty().withMessage('Type is required'),
];


const { validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};


/**
 * Authentication Middleware
 */
function authenticateToken(req, res, next) {
  console.log("Test")
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {

    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
    if (err) {
      console.log("Token Auth failed")
      return res.status(403).json({ error: 'Invalid token' });
    }

    console.log("the decoded token", decoded);
    if (decoded.role === 'Organizer') {
      req.organizerId = decoded.id; // Attach the organizer ID to the request object
      req.organizer = decoded.name;
      req.organizerEmail= decoded.email;
      console.log('org id',decoded.id);
      console.log('Organizer Name', req.organizer);
    }
    else{
      req.userId = decoded.id;
      req.userName= decoded.name;
      req.email= decoded.email;
    }

    next();
  });
}



// ======================
// STUDENT ROUTES
// ======================

//  Search events by keyword (e.g. description, location, title)
router.get('/event/search/:keyword', getEvents);

//  Get all upcoming events (for students)
router.get('/event', getAllEvents);

//  RSVP to an event (toggle "I'm Interested") 
router.put('/event/rsvpCount/:eventId', authenticateToken, rsvp);

// RSVP get count for overlay
router.get('/event/rsvp/:eventId', getRSVP);

// Get recent events
router.get('/event/recent', getRecent);

// Get upcomming events within 5 days
router.get('/event/upcoming', getUpcomingEvents);





// ======================
// ORGANIZER ROUTES
// ======================

// Create a new event (organizer submits form) //
router.post('/event', validateEvent, validate, authenticateToken, createEvent);   

//  Update an existing event
router.put('/event/:eventId', validateEvent, validate, authenticateToken, updateEvent);    

//  Delete an event by ID
router.delete('/event/:eventId', authenticateToken, deleteEvent);    

//  Get all events created by a specific organizer
router.get('/event/organizer', authenticateToken, getEventsByOrganizer);    

//Get event to update
router.get('/event/:eventId', authenticateToken, singleEvent);

//Prompt for a AI generated Event description
router.post('/prompt',  authenticateToken, eventPrompt);

module.exports = router;
