const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const feedbackRoutes = require('./routes/feedbackRoutes');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/feedback', feedbackRoutes);

app.use(express.static(path.join(__dirname, '../frontend')));


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend','review.html' ));
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Feedback service running on port ${PORT}`));
