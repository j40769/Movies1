const mongoose = require('mongoose');

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
    }
});

const Movie = mongoose.model('Movie', movieSchema);
module.exports = Movie;
