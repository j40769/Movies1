const mongoose = require('mongoose');
const Showroom = require('./Showroom');

const movieSchema = new mongoose.Schema({
    movieName: {
        type: String,
        required: true,
    },
    directorName: {
        type: String,
        required: true,
    },
    yearReleased: {
        type: Number,
        required: true,
    },
    movieRating: {
        type: Number,
        min: 0,
        max: 10,
        required: true,
    },
    showRoom: {
        type: String,
        default: 'Showroom A', // Default value set to "Showroom A"
    },
    moviePoster: {
        type: String,
    },
    trailerUrl: {
        type: String,
    },
    movieLength: {
        type: String,
    },
    shortDescription: {
        type: String,
    },
    status: {
        type: String,
        enum: ['currentlyRunning', 'comingSoon'],
        required: true,
    },
    showDates: {
        type: [Date], // Array of dates
        required: true,
    },
    showTimes: {
        type: [String], // Array of strings (e.g., ["2:00 PM", "6:00 PM"])
        required: true,
    },
    genre: { // New genre field
        type: String,
        required: true
    }
});

const Movie = mongoose.model('Movie', movieSchema);
module.exports = Movie;
