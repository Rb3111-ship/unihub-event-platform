const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const authMiddleware = require('../middleware/authMiddleware');

// POST /api/feedback
router.post('/',  feedbackController.submitFeedback);

// GET /api/feedback?eventName=...
router.get('/', feedbackController.getFeedbacks);

module.exports = router;
