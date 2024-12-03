/*const express = require('express');
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

module.exports = router;*/

// routes/movies.js
const express = require('express');
const router = express.Router();
const movieController = require('../controllers/movieController');

// Define specific routes first
router.get('/get-movies', movieController.getMovies.bind(movieController));

// Define dynamic routes afterward
router.get('/api/movies/:id', movieController.getMovieById.bind(movieController));

// Other routes
router.post('/add-movie', movieController.addMovie.bind(movieController));
router.get('/api/movies', movieController.searchMovies.bind(movieController));

module.exports = router;


