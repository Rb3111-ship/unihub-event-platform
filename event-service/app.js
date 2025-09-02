const express = require('express');
const cors = require('cors');
const eventRoutes = require('./routes/eventRoutes');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json()); // For JSON parsing

// Serve static files from the frontend folder
app.use(express.static(path.join(__dirname, '../frontend')));

app.use('/api/events', eventRoutes); // every route prefixed by /api/events

app.get('/', (req, res) => {
  res.send('Event Service API is running...');
});

module.exports = app;


