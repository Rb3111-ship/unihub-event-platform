const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    title: {
        type: String,
    },

    description: String,

    type: String,

    location: String,

    date: Date,
    
    time: String,
    
    price: String,

    capacity: String,

    image: String,

    organizerId: String,

    organizer: String,

    organizerEmail: String,

    rsvpCount: {
        type: Number,
        default: 0
    },

    rsvpedUsers: [{ type: String }]

}, { timestamps: true }); // automatically generates time stamps for data

module.exports = mongoose.model('Event', eventSchema);
// use this exported value to access the db. it will pluralize Event to events
//which is the name of the collection and access it
// eventSchema is the schema we want to store 