const Movie = require('../models/Movie');
const { ObjectId } = require('mongodb');

// Get all movies, categorized by status
exports.getMovies = async (req, res) => {
    try {
        const movies = await Movie.find();
        const currentlyRunning = movies.filter(movie => movie.status === 'currentlyRunning');
        const comingSoon = movies.filter(movie => movie.status === 'comingSoon');

        res.json({ currentlyRunning, comingSoon });
    } catch (error) {
        console.error('Error retrieving movies:', error);
        res.status(500).send('Failed to retrieve movies');
    }
};

// Get a single movie by ID
exports.getMovieById = async (req, res) => {
    try {
        const movie = await Movie.findById(req.params.id);
        if (!movie) {
            return res.status(404).send('Movie not found');
        }
        res.json(movie);
    } catch (error) {
        console.error('Error fetching movie:', error);
        res.status(500).send('Error fetching movie');
    }
};

// Add a new movie
exports.addMovie = async (req, res) => {
    const {
        movieName,
        directorName,
        yearReleased,
        movieRating,
        showRoom,
        moviePoster,
        trailerUrl,
        movieLength,
        shortDescription,
        status,
        showDates,
        showTimes,
        genre
    } = req.body;

    try {
        // Format showDates as Date objects
        const formattedShowDates = showDates.map(date => new Date(date));

        const newMovie = new Movie({
            movieName,
            directorName,
            yearReleased,
            movieRating,
            showRoom,
            moviePoster,
            trailerUrl,
            movieLength,
            shortDescription,
            status,
            showDates: formattedShowDates,
            showTimes,
            genre
        });

        await newMovie.save();
        res.status(201).json({ message: 'Movie added successfully', movie: newMovie });
    } catch (error) {
        console.error('Error adding movie:', error);
        res.status(500).json({ message: 'Error adding movie', error: error.message });
    }
};

// Search for movies by name or genre
exports.searchMovies = async (req, res) => {
    const { search } = req.query;

    if (!search) {
        return res.status(400).send('Search query is required');
    }

    try {
        const regex = new RegExp(search, 'i'); // Case-insensitive search
        const movies = await Movie.find({
            $or: [
                { movieName: { $regex: regex } },
                { genre: { $regex: regex } }
            ]
        });

        res.json(movies);
    } catch (error) {
        console.error('Error searching movies:', error);
        res.status(500).send('Failed to search movies');
    }
};
