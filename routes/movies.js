const express = require('express');
const router = express.Router();
const movieController = require('../controllers/movieController');


//currentlyRunning, comingSoon
router.get('/get-movies', async (req, res) => {
    try {
        const categorizedMovies = await movieController.getCategorizedMovies();
        res.json(categorizedMovies);
    } catch (error) {
        console.error('Error retrieving categorized movies:', error);
        res.status(500).send('Failed to retrieve categorized movies');
    }
});

router.get('/api/movies/:id', async (req, res) => {
    try {
        const movie = await movieController.getMovieById(req.params.id);
        res.json(movie);
    } catch (error) {
        console.error('Error fetching movie:', error);
        res.status(500).send('Error fetching movie');
    }
});

router.post('/add-movie', async (req, res) => {
    try {
        const response = await movieController.addNewMovie(req.body);
        res.status(201).json(response);  // Respond with a success message and the newly added movie
    } catch (error) {
        console.error('Error adding movie:', error);
        res.status(500).json({ message: error.message });
    }
});

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



