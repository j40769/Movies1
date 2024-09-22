const mongoose = require('mongoose');

// Create Movie Schema
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
        type: String, // URL for the movie poster image
    },
    trailerUrl: {
        type: String, // YouTube link for the trailer
    },
    movieLength: {
        type: String, // Movie length in format like "2h 30m"
    },
    shortDescription: {
        type: String, // Optional short description of the movie
    }
});

// Create and export the Movie model
const Movie = mongoose.model('Movie', movieSchema);
module.exports = Movie;
