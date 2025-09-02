/**
 * @file This script sets up a daily cron job to send post-event feedback emails
 * to users who have RSVP'd to events that concluded two days prior.
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
 * Used by BullMQ to manage and store job data.
 * @type {Redis}
 */

console.log("Connecting to Redis at:", process.env.REDIS_URL);

const connection = new Redis({
    host: 'redis',
    port: 6379,
    maxRetriesPerRequest: null, // Essential for BullMQ to function correctly
});

/**
 * Initializes a BullMQ queue specifically for email-related jobs.
 * @type {Queue}
 */
const emailQueue = new Queue('emailQueue', { connection });

/**
 * Connects to the MongoDB database using the URI provided in environment variables.
 * Logs the connection status to the console.
 */
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log('INFO: MongoDB connection established successfully.'))
    .catch(err => console.error('ERROR: Failed to connect to MongoDB:', err.message));

/**
 * Schedules a daily cron job to run at 11:49 PM (23:49).
 * This job identifies events that ended two days ago and queues feedback emails
 * for all users who RSVP'd to those events.
 */
cron.schedule('33 22 * * *', async () => {
    console.log("INFO: Initiating daily post-event feedback check...");

    const now = new Date();
    /**
     * Calculates the date exactly two days prior to the current time.
     * Events with a date within the window [twoDaysAgo, oneDayAgo) will be considered.
     * @type {Date}
     */
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    /**
     * Calculates the date exactly one day prior to the current time.
     * Used to define the upper bound of the event date range for feedback emails.
     * @type {Date}
     */
    const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);

    try {
        /**
         * Fetches events from the database that occurred between two days ago (inclusive)
         * and one day ago (exclusive). This targets events that ended exactly two days prior.
         * @type {Array<Object>}
         */
        const events = await Event.find({
            date: { $gte: twoDaysAgo, $lt: oneDayAgo }
        });

        if (events && events.length > 0) {
            console.log(`INFO: Found ${events.length} event(s) that concluded two days ago for feedback emails.`);
            /**
             * Iterates through each found event to process feedback email queuing.
             */
            for (const event of events) {
                /**
                 * Iterates through each user who RSVP'd to the current event.
                 */
                for (const userId of event.rsvpedUsers) {
                    console.log(`DEBUG: Processing feedback request for user ID: ${userId} for event: "${event.title}"`);
                    const url = `http://localhost:8000/api/userInfo.php?id=${userId}`;

                    try {
                        /**
                         * Fetches user information from an external API using the user ID.
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
                         * @type {object}
                         */
                        const data = await res.json();

                        /**
                         * Checks if user data was successfully retrieved. If not, logs a warning and skips to the next user.
                         */
                        if (!data?.user) {
                            console.warn(`WARNING: No user data found for ID: ${userId}. Skipping feedback email for this user.`);
                            continue;
                        }

                        /**
                         * Adds a 'sendAfterEvent' job to the email queue. This job will trigger the sending of
                         * a feedback request email to the user for the completed event.
                         */
                        await emailQueue.add('sendAfterEvent', {
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
                            }
                        });

                        console.log(`INFO: Successfully queued post-event feedback email for "${data.user.name}" <${data.user.email}> for event: "${event.title}".`);

                    } catch (err) {
                        console.error(`ERROR: Failed to fetch user data for ID ${userId} or queue email for event "${event.title}":`, err.message);
                    }
                }
            }
        } else {
            console.log("INFO: No events found that concluded two days ago for which to send feedback requests.");
        }
    } catch (err) {
        console.error('CRITICAL: An error occurred during the daily post-event feedback processing:', err);
    }
});