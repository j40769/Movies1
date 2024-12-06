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
/*const express = require('express');
const router = express.Router();
const movieController = require('../controllers/movieController');

// Define specific routes first
router.get('/get-movies', movieController.getMovies.bind(movieController));

// Define dynamic routes afterward
router.get('/api/movies/:id', movieController.getMovieById.bind(movieController));

// Other routes
router.post('/add-movie', movieController.addMovie.bind(movieController));
router.get('/api/movies', movieController.searchMovies.bind(movieController));

module.exports = router;*/

const express = require('express');
const router = express.Router();
const movieController = require('../controllers/movieController');

// Define specific routes first using the facade methods

// Route to get categorized movies (currentlyRunning, comingSoon)
router.get('/get-movies', async (req, res) => {
    try {
        const categorizedMovies = await movieController.getCategorizedMovies();
        res.json(categorizedMovies);
    } catch (error) {
        console.error('Error retrieving categorized movies:', error);
        res.status(500).send('Failed to retrieve categorized movies');
    }
});

// Route to get a movie by ID (dynamic route)
router.get('/api/movies/:id', async (req, res) => {
    try {
        const movie = await movieController.getMovieById(req.params.id);
        res.json(movie);
    } catch (error) {
        console.error('Error fetching movie:', error);
        res.status(500).send('Error fetching movie');
    }
});

// Route to add a new movie
router.post('/add-movie', async (req, res) => {
    try {
        const response = await movieController.addNewMovie(req.body);
        res.status(201).json(response);  // Respond with a success message and the newly added movie
    } catch (error) {
        console.error('Error adding movie:', error);
        res.status(500).json({ message: error.message });
    }
});

// Route to search for movies by name or genre
router.get('/api/movies', async (req, res) => {
    const searchQuery = req.query.search;

    if (!searchQuery) {
        return res.status(400).send('Search query is required');
    }

    try {
        const movies = await movieController.searchMovies(searchQuery);
        res.json(movies);
    } catch (error) {
        console.error('Error searching movies:', error);
        res.status(500).send('Failed to search movies');
    }
});

module.exports = router;



