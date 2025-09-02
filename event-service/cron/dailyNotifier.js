/**
 * @file This script sets up a daily cron job to send event reminders to users
 * who have RSVP'd to events happening within the next two days.
 * It connects to MongoDB and Redis, fetches event and user data,
 * and queues emails using BullMQ.
 */
require('dotenv').config();
const cron = require('node-cron');
const Redis = require('ioredis');
const { Queue } = require('bullmq');
const mongoose = require('mongoose');
const Event = require('../models/eventModels');


/**
 * Initializes a Redis client connection.
 * Used for BullMQ to store job data.
 * @type {Redis}
 */

console.log("Connecting to Redis at:", process.env.REDIS_URL);

const connection = new Redis({
  host: 'redis',
  port: 6379,
  maxRetriesPerRequest: null, // Disable retries to prevent connection issues from hanging the application
});

/**
 * Initializes a BullMQ queue for sending emails.
 * @type {Queue}
 */
const emailQueue = new Queue('emailQueue', { connection });

/**
 * Connects to the MongoDB database.
 * The connection URI is loaded from environment variables.
 * Logs success or error messages to the console.
 */
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('INFO: MongoDB connection established successfully.'))
  .catch(err => console.error('ERROR: Failed to connect to MongoDB:', err));

/**
 * Schedules a daily cron job to run at 8:40 PM (20:40).
 * This job checks for upcoming events and queues reminder emails.
 */
cron.schedule('30 22 * * *', async () => {
  console.log("INFO: Initiating daily event reminder check...");

  const now = new Date();
  /**
   * Calculates the date two days from the current time.
   * Events within this timeframe will trigger reminders.
   * @type {Date}
   */
  const twoDaysLater = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

  try {
    /**
     * Fetches events from the database that are scheduled to occur
     * between the current time and two days from now.
     * @type {Array<Object>}
     */
    const events = await Event.find({
      date: { $gte: now, $lte: twoDaysLater }
    });

    if (events && events.length > 0) {
      console.log(`INFO: Found ${events.length} event(s) for upcoming reminders.`);
      /**
       * Iterates through each found event to process reminders.
       */
      for (const event of events) {
        /**
         * Iterates through each user who has RSVP'd to the current event.
         */
        for (const userId of event.rsvpedUsers) {
          console.log(`DEBUG: Processing reminder for user ID: ${userId} for event: "${event.title}"`);
          const url = `http://localhost:8000/api/userInfo.php?id=${userId}`;

          try {
            /**
             * Fetches user information from an external API.
             * @type {Response}
             */
            const res = await fetch(url, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json'
              }
            });

            /**
             * Parses the JSON response containing user data.
             * @type {Object}
             */
            const data = await res.json();

            /**
             * Checks if user data was successfully retrieved.
             */
            if (!data?.user) {
              console.warn(`WARNING: User data not found for ID: ${userId}. Skipping email queuing for this user.`);
              continue; // Skip to the next user if no user data is found
            }

            /**
             * Adds a 'sendDelayedEmail' job to the email queue.
             * The job contains all necessary data for sending the reminder email.
             */
            await emailQueue.add('sendDelayedEmail', {
              goNoGo: true, // Indicates that the email should be sent
              eventId: event._id,
              recipiantEmail: data.user.email,
              userName: data.user.name,
              event: {
                orgName: event.organizer,
                title: event.title,
                organizerId: event.organizerId,
                date: event.date,
                location: event.location,
                description: event.description,
                price: event.price,
                organizerEmail: event.organizerEmail,
                time: event.time,
              }
            });

            console.log(`INFO: Successfully queued reminder email for "${data.user.name}" <${data.user.email}> for event: "${event.title}".`);
          } catch (err) {
            console.error(`ERROR: Failed to fetch user data for ID ${userId} or queue email:`, err.message);
          }
        }
      }
    } else {
      console.log("INFO: No events found within the next two days for which to send reminders.");
    }
  } catch (err) {
    console.error('CRITICAL: An error occurred during the daily reminder processing:', err);
  }
});