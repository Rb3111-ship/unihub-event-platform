const app = require('./app');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
// const express = require('express');
dotenv.config();
connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT,'0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

require('./workers/emailWorker');      // run once and listens forever
require('./cron/dailyNotifier');
require('./cron/feedBack');
