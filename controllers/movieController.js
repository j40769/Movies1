const Movie = require('../models/Movie');
const { ObjectId } = require('mongodb');

class MovieController {
    static #instance;

    //private constructor to prevent direct instantiation
    constructor() {
        if (MovieController.#instance) {
            throw new Error('Use MovieController.getInstance() to get the single instance of this class.');
        }
    }

    //get the single instance
    static getInstance() {
        if (!MovieController.#instance) {
            MovieController.#instance = new MovieController();
        }
        return MovieController.#instance;
    }

    async getCategorizedMovies() {
        try {
            const movies = await this.getMovies(); // Reuse the original getMovies method
            const categorizedMovies = {
                currentlyRunning: movies.filter(movie => movie.status === 'currentlyRunning'),
                comingSoon: movies.filter(movie => movie.status === 'comingSoon')
            };
            return categorizedMovies;
        } catch (error) {
            throw new Error('Failed to retrieve categorized movies');
        }
    }

    async getMovieById(id) {
        try {
            const movie = await Movie.findById(id);
            if (!movie) {
                throw new Error('Movie not found');
            }
            return movie;
        } catch (error) {
            throw new Error('Error fetching movie');
        }
    }

    async addNewMovie(movieData) {
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
        } = movieData;

        try {
            const formattedShowDates = showDates.map(date => {
                const d = new Date(date);
                return d.toISOString().split('T')[0];
            });

            const conflictingMovie = await Movie.findOne({
                showRoom,
                showDates: { $in: formattedShowDates },
                showTimes: { $in: showTimes }
            });

            if (conflictingMovie) {
                throw new Error(`A movie is already scheduled in showroom "${showRoom}" for the provided dates and times.`);
            }

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
            return { message: 'Movie added successfully', movie: newMovie };
        } catch (error) {
            throw new Error(`Failed to add movie: ${error.message}`);
        }
    }

    async searchMovies(searchQuery) {
        if (!searchQuery) {
            throw new Error('Search query is required');
        }

        try {
            const regex = new RegExp(searchQuery, 'i');
            const movies = await Movie.find({
                $or: [
                    { movieName: { $regex: regex } },
                    { genre: { $regex: regex } }
                ]
            });
            return movies;
        } catch (error) {
            throw new Error('Failed to search movies');
        }
    }

    async getMovies() {
        try {
            return await Movie.find(); // Fetch all movies
        } catch (error) {
            throw new Error('Error retrieving movies');
        }
    }
}

module.exports = MovieController.getInstance();


