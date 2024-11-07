// models/Booking.js
const mongoose = require('mongoose');

// Define the Booking schema
const bookingSchema = new mongoose.Schema({
    movieName: {
        type: String,
        required: true
    },
    selectedDate: {
        type: String,
        required: true
    },
    selectedTime: {
        type: String,
        required: true
    },
    selectedSeats: {
        type: [String],
        required: true
    },
    ageCategories: {
        type: Map,
        of: String, // The age category for each selected seat (e.g., Adult, Child, Senior)
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now // Automatically set the booking creation date
    }
});

const Booking = mongoose.model('Booking', bookingSchema);
module.exports = Booking;

