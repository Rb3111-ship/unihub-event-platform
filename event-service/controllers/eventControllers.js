// Import the Event model
const Event = require('../models/eventModels');
const { generateGeminiResponse } = require('../workers/geminiWorker');
const jwt = require('jsonwebtoken');

const { Queue } = require('bullmq');
const Redis = require('ioredis');
require('dotenv').config();
const connection = new Redis(process.env.REDIS_URL);
const emailQueue = new Queue('emailQueue', { connection });



/**
 * Get all events (Public - for students and guests)
 */
const getAllEvents = async (req, res) => {

    const page = parseInt(req.query.page) || 1; // if page is not specified, automatically get page 1and limit=10
    const limit = parseInt(req.query.limit) || 10;  
    try {

        const now = new Date();
        //pagination 
        const events = await Event.find({ date: { $gte: now } })
            .skip((page - 1) * limit) // skips events in db based on page number * number of events on the page
            .limit(limit) // limits events returned
            .sort({ createdAt: -1 });

        const total = await Event.countDocuments({ date: { $gte: now } });

        res.status(200).json({
            page,
            totalPages: Math.ceil(total / limit), events
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/**
 * Search events by keyword (title, description, location, or type)
 * Supports multiple words, e.g., "music party night"
 */
const getEvents = async (req, res) => {
    const keyword = req.params.keyword;
    const words = keyword.split(' ');
    const searchConditions = [];

    const now = new Date;

    words.forEach((word) => {
        searchConditions.push({ title: { $regex: word, $options: 'i' } });
        searchConditions.push({ description: { $regex: word, $options: 'i' } });
        searchConditions.push({ location: { $regex: word, $options: 'i' } });
        searchConditions.push({ type: { $regex: word, $options: 'i' } });

    });

    try {
        const events = await Event.find({
            $and: [
                { date: { $gte: now } }, // only shows events that have not yet happened
                { $or: searchConditions }]
        });
        res.status(200).json(events); // Return matched events

    } catch (error) {
        res.status(500).json({ message: 'Search failed', error: error.message });
    }
};

/**
 * RSVP to an event (toggle interested state or increment counter) 
 * This Adds user ID to Array of RSVP'ed users. If same user RSVP's twice
 * the rsvp count decreases and their ID is removed from the list
 */
const rsvp = async (req, res) => {
    const data = req.body;
    const userId = req.userId;
    const userName = req.userName;
    const email = req.email;
    const eventId = req.params.eventId;
    const jobId = `email-${eventId}-${userId}`; //create a uniqe jobQueue id for the email queue

    let buttonColor = '';
    try {

        //go through DB and get the event
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        const hasRSVP = event.rsvpedUsers.includes(userId);
        if (hasRSVP) {
            // Remove RSVP in event
            console.log('Removing RSVP:', hasRSVP);
            event.rsvpedUsers = event.rsvpedUsers.filter(id => id !== userId);
            event.rsvpCount = Math.max(0, event.rsvpCount - 1);
            buttonColor = false;
            await emailQueue.remove(jobId);

        } else {
            // Add RSVP in event
            console.log('aDDING RSVP:', hasRSVP);
            event.rsvpedUsers.push(userId);
            event.rsvpCount += 1;
            buttonColor = true;

            // Queue email job with a 5-minute delay
            await emailQueue.add('sendEmail', {
                eventId: eventId,
                recipiantEmail: email,
                userName: userName,
                event: {
                    title: event.title,
                    organizerId: event.organizerId,
                    date: event.date,
                    location: event.location,
                    description: event.description,
                    price: event.price,
                    organizerEmail: event.organizerEmail,

                }
            }, {
                delay: 2 * 60 * 1000, // 5 minutes
                jobId: jobId
            });
        }


        //save event in DB
        await event.save();

        return res.status(200).json({
            message: hasRSVP ? 'RSVP removed' : 'RSVP added',
            rsvpCount: event.rsvpCount,
            rsvpedUsers: event.rsvpedUsers, //User Ids that have RSVPed
            btnColor: buttonColor
        });
    } catch (error) {
        console.error('Server error during RSVP:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}

//--------------------------------------------------------------------------------------------------------

/**
 * Retrieve number of RSVP'ed users . Not used yet use for organizer feedback
 */

const getRSVP = async (req, res) => {
    const eventId = req.params.eventId;

    try {
        const rsvps = await Event.findById(eventId).select('rsvpCount');
        if (!rsvps) {
            return res.status(404).json({ message: 'Event not found' });
        }
        res.status(200).json({ rsvpCount: rsvps.rsvpCount });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};



/**
 * Retrieve only recent events
 */
const getRecent = async (req, res) => {
    const now = new Date();
    try {

        const events = await Event.find({ date: { $gte: now } })
            .sort({ createdAt: -1 })
            .limit(9);
        res.status(200).json(events);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}


/**
 * Retrieve only upcoming events
 */

const getUpcomingEvents = async (req, res) => {
    const now = new Date();
    const future = new Date();
    future.setDate(now.getDate() + 5);
    try {
        const event = await Event.find({ date: { $gte: now, $lt: future } })
            .sort({ date: 1 }); // gets events that will happen, not yet happened
        if (!event) {
            res.status(201).json({ message: "Nothing In the next Five Days" });
        }
        else {
            res.status(200).json(event);
        }
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}



/*------------------------------Organizer Controllers-------------------------------------*/



/**
 * Create a new event (Organizer-only)
 */
const createEvent = async (req, res) => { //to create an event the organizer must be logged in and provide an organization id


    try {

        console.log("sending organizerId", req.organizerId);
        req.body.organizerId = req.organizerId;
        req.body.organizer = req.organizer;
        req.body.organizerEmail = req.organizerEmail;

        console.log("organizer id", req.organizerId);
        console.log("Organizer name", req.organizer);
        const event = await Event.create(req.body);
        res.status(201).json(event);
    } catch (err) {
        console.error('Error creating Event:', err);
        res.status(400).json({ message: err.message, error: err });

    }
};

//--------------------------------------------------------------------------------------------------
const eventPrompt = async (req, res) => {

    try {
        const { title, prompt, type, location, date, price } = req.body;

       const descriptionPrompt = `Generate a compelling and concise event description based on the following details. Make it only text not mark down:
        User prompt/context: "${prompt}"
        Event Information:
        - Title: ${title}
        - Type: ${type}
        - Location: ${location}
        - Date: ${date}
        - Price: ${price}`;

        console.log('Sending prompt to Gemini:', descriptionPrompt);
        const generatedText = await generateGeminiResponse(descriptionPrompt);
        res.json({ success: true, generatedText: generatedText });

    } catch (err) {
        // Log the full error for server-side debugging.
        console.error('Error in eventPrompt controller:', err);

        // Handle specific error messages that might come from the Gemini service.
        if (err.message.includes('Invalid prompt provided to generateGeminiResponse')) {
            // If the prompt itself was malformed for Gemini.
            return res.status(400).json({
                success: false,
                message: 'Invalid input for event description generation. Please check your prompt and event details.',
                error: err.message
            });
        } else if (err.message.includes('Gemini model not initialized yet.')) {
            // If the Gemini model wasn't ready (less likely with the improved Gemini service).
            return res.status(503).json({ // 503 Service Unavailable is appropriate here
                success: false,
                message: 'The AI service is not yet ready. Please try again in a moment.',
                error: err.message
            });
        } else if (err.message.includes('Gemini API error')) {
            // General errors communicating with the Gemini API, including "API key not valid".
            return res.status(500).json({
                success: false,
                message: 'Failed to generate event description due to an AI service error. Please try again later.',
                error: err.message
            });
        }

        // Catch-all for any other unexpected errors.
        res.status(500).json({
            success: false,
            message: 'An unexpected error occurred while processing your request. Please try again.',
            error: err.message // Include the error message for more detail on the client-side
        });

    }
};

//--------------------------------------------------------------------------------------------------
/**
 * Update an existing event (Organizer-only)
 */
const updateEvent = async (req, res) => {
    const eventId = req.params.eventId;
    const data = req.body;
    const organizerId = req.organizerId;
    try {
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: "Event Not Found" });
        }
        if (event.organizerId !== organizerId) {
            return res.status(403).json({ message: "Unauthorized User: Cannot modify Event" })
        }
        const updated = await Event.findByIdAndUpdate(eventId, data, { new: true });
        res.status(200).json(updated);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Delete an event (Organizer-only)
 */
const deleteEvent = async (req, res) => {
    console.log("Org id22", req.organizerId)

    const orgId = req.organizerId;
    const eventId = req.params.eventId;
    console.log('deleting', eventId);
    try {
        const event = await Event.findOne({ _id: eventId, organizerId: orgId });
        if (!event) {

            return res.status(404).json({ message: 'Event not found or not authorized' });
        }
        console.log('deleting', event);
        await Event.deleteOne({ _id: eventId });
        res.status(200).json({ message: 'Event deleted successfully' });

    } catch (err) {
        console.error('Error deleting event:', err);
        res.status(500).json({ message: 'Server error', error: err });
    }
};


/**
 * Get all events created by a specific organizer
 */
const getEventsByOrganizer = async (req, res) => {
    console.log("Org id", req.organizerId)
    const orgId = req.organizerId;
    try {
        const orgEvents = await Event.find({ organizerId: orgId });

        if (orgEvents.length === 0) {
            return res.status(404).json({ message: 'No events yet for this organizer' });
        }
        res.status(200).json(orgEvents);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


const singleEvent = async (req, res) => {
    console.log("Org id22", req.organizerId)

    const orgId = req.organizerId;
    const eventId = req.params.eventId;
    console.log('getting', eventId);
    try {
        const event = await Event.findOne({ _id: eventId, organizerId: orgId });
        if (!event) {

            return res.status(404).json({ message: 'Event not found or not authorized' });
        }

        res.status(200).json(event);

    }
    catch (err) {
        console.error('Error getting event:', err);
        res.status(500).json({ message: 'Server error', error: err });
    }
}

module.exports = {
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
};
