const feedbackModel = require('../models/feedbackModel');

exports.submitFeedback = async (req, res) => {
  const { eventId, eventName, message, rating } = req.body;

  if (!eventId || !eventName || !message || !rating) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  if (typeof rating !== 'number' || rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'Rating must be 1 to 5' });
  }

  try {
    await feedbackModel.createAnonymousFeedback(eventId, eventName, message, rating);
    res.status(201).json({ message: 'Anonymous feedback submitted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};


exports.getFeedbacks = async (req, res) => {
  const { eventName } = req.query;
  if (!eventName) {
    return res.status(400).json({ message: 'eventName query parameter is required' });
  }
  try {
    const feedbacks = await require('../models/feedbackModel').getFeedbacksByEvent(eventName);
    res.json(feedbacks);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
