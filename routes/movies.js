const express = require('express');
const router = express.Router();
const movieController = require('../controllers/movieController');

// Route to get all movies, categorized
router.get('/get-movies', movieController.getMovies);

// Route to get a specific movie by ID
router.get('/api/movies/:id', movieController.getMovieById);

// Route to add a new movie
router.post('/add-movie', movieController.addMovie);

// Route to search for movies by name or genre
router.get('/api/movies', movieController.searchMovies);

module.exports = router;
