/**
 * @file This script defines a BullMQ worker responsible for processing email jobs.
 * It connects to Redis, listens for jobs on the 'emailQueue', constructs email messages
 * based on job type, and sends them to a notification service.
 */
require('dotenv').config();
const { Worker } = require('bullmq');
const Redis = require('ioredis');

/**
 * Disables TLS certificate validation. This is generally not recommended for production
 * environments due to security implications but might be used in development or
 * specific testing scenarios.
 * @deprecated Consider proper TLS certificate handling in production.
 */
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

/**
 * Initializes a Redis client connection for BullMQ.
 * maxRetriesPerRequest is set to null, which is required for BullMQ.
 * @type {Redis}
 */
const connection = new Redis({
  maxRetriesPerRequest: null,
});

console.log('INFO: Email worker service started and is running...');

/**
 * Initializes a BullMQ worker for the 'emailQueue'.
 * This worker processes jobs by constructing email messages and sending them
 * to the external notification service.
 * @type {Worker}
 */
const worker = new Worker(
  'emailQueue',
  async job => {
    console.log(`INFO: Processing job '${job.name}' with ID: ${job.id}`);

    /**
     * Destructures job data to extract necessary information for email construction.
     * @type {object}
     * @property {string} eventId - The ID of the event.
     * @property {string} recipiantEmail - The email address of the recipient.
     * @property {string} userName - The name of the recipient.
     * @property {object} event - Details about the event.
     */
    const { eventId, recipiantEmail, userName, event } = job.data;
    let message;

    /**
     * Constructs the email message based on the job name.
     */
    if (job.name === 'sendDelayedEmail') {
      console.log(`INFO: Preparing '2-day reminder' email for event: "${event.title}"`);
      message = `Hi ${userName},\n\nJust a quick reminder that "${event.title}" is happening in 2 days — ${event.date} at ${event.location} starting time is (${event.time}).\n\nEvent Details:\n\nHosted by ${event.orgName} (${event.organizerEmail}).\n\nWe’re excited to see you there!\n\nBest,\nThe UniHub Team`;
      console.log('DEBUG: Generated email message preview for "sendDelayedEmail":\n', message);
    } else if (job.name === 'sendAfterEvent') {
      console.log(`INFO: Preparing 'post-event feedback' email for event: "${event.title}"`);
      // Placeholder for feedback link - ensure it's handled when uncommenting
      message = `Hi ${userName},\n\nThanks for attending "${event.title}" on ${event.date} at ${event.location}.\n\nHosted by: ${event.orgName} (${event.organizerEmail})\n\nWe’d really appreciate it if you could take a moment to share your feedback http://localhost:4000?eventId=${eventId}&eventName=${event.title} .\n\nThanks for your time!`; // Placeholder for ${feedbackLink}
      console.log('DEBUG: Generated email message preview for "sendAfterEvent":\n', message);
    } else {
      console.log(`INFO: Preparing 'initial interest' email for event: "${event.title}"`);
      message = `Hi ${userName},\n\nYou’ve shown interest in "${event.title}" happening on ${event.date} at ${event.location}.\nHosted by ${event.orgName} (${event.organizerEmail}).\n\nStay tuned for updates, and feel free to reach out if you have any questions!(${event.organizerEmail})\n\nCheers,\nThe UniHub Team`;
      console.log('DEBUG: Generated email message preview for default (1-min after) email:\n', message);
    }

    try {
      /**
       * Sends the constructed email message to the external notification service.
       * @type {Response}
       */
      const response = await fetch('http://localhost:5145/api/notifications/receive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'DarkKnight123' // API key for authentication with the notification service
        },
        body: JSON.stringify({
          eventId: eventId,
          eventName: event.title,
          organizerId: event.organizerId,
          organizerEmail: event.organizerEmail,
          recipients: [
            {
              email: recipiantEmail,
              name: userName
            }
          ],
          message: message
        })
      });

      /**
       * Checks if the response from the notification service was successful.
       * Throws an error if the response is not OK.
       */
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Notification service responded with an error: ${errorData.message || response.statusText}`);
      }

      console.log(`SUCCESS: Email for job ID ${job.id} sent successfully to ${recipiantEmail} for event: "${event.title}".`);
    } catch (err) {
      console.error(`ERROR: Email job ID ${job.id} failed to send email for recipient ${recipiantEmail}:`, err.message);
    }
  },
  { connection }
);

//Worker Event Handlers

/**
 * Logs a message when a job successfully completes.
 * @event Worker#completed
 * @param {object} job - The job that completed.
 */
worker.on('completed', job => {
  console.log(`INFO: Job ID ${job.id} ('${job.name}') completed successfully.`);
});

/**
 * Logs an error message when a job fails.
 * @event Worker#failed
 * @param {object} job - The job that failed.
 * @param {Error} err - The error that caused the job to fail.
 */
worker.on('failed', (job, err) => {
  console.error(`ERROR: Job ID ${job.id} ('${job.name}') failed with error:`, err.message);
});