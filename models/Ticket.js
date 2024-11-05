const mongoose = require('mongoose');

// Define the Ticket schema
const ticketSchema = new mongoose.Schema({
    movieId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Movie' // Reference to the Movie model
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User' // Reference to the User model
    },
    showtime: {
        type: Date, // Store the showtime as a date object
        required: true
    },
    seats: {
        type: [String], // Array of selected seats (e.g., ['A1', 'A2'])
        required: true
    },
    ages: {
        type: Map, // Map to store age corresponding to each seat (e.g., { 'A1': 10, 'A2': 12 })
        of: Number // Each entry in the map is a number (the age)
    },
    bookingStatus: {
        type: String,
        enum: ['booked', 'cancelled'], // Status of the ticket
        default: 'booked'
    },
    createdAt: {
        type: Date,
        default: Date.now // Automatically set the timestamp when the ticket is created
    }
});

// Create and export the Ticket model
const Ticket = mongoose.model('Ticket', ticketSchema);
module.exports = Ticket;
