var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mongoose = require('mongoose');  // Add Mongoose
require('dotenv').config();  // Add dotenv to load environment variables

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// Connect to MongoDB using Mongoose
const mongoDBUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/movies'; // Update with movies database
mongoose.connect(mongoDBUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('Failed to connect to MongoDB', err));

// Movie schema and model
const movieSchema = new mongoose.Schema({
  movieName: { type: String, required: true },
  directorName: { type: String, required: true },
  yearReleased: { type: Number, required: true },
  movieRating: { type: Number, min: 0, max: 10, required: true },
  moviePoster: { type: String }, // URL for poster
  trailerUrl: { type: String }, // YouTube link
  movieLength: { type: String }, // e.g., "2h 28m"
  shortDescription: { type: String }, // Optional short description
});

const Movie = mongoose.model('Movie', movieSchema, 'moviesdb'); // Create Movie model

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json()); // Ensure that JSON is parsed
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// Add a movie to the database
app.post('/add-movie', async (req, res) => {
  const { movieName, directorName, yearReleased, movieRating, moviePoster, trailerUrl, movieLength, shortDescription } = req.body;

  try {
    const newMovie = new Movie({
      movieName,
      directorName,
      yearReleased,
      movieRating,
      moviePoster,
      trailerUrl,
      movieLength,
      shortDescription,
    });

    await newMovie.save();
    res.status(201).send('Movie added successfully');
  } catch (error) {
    console.error(error);
    res.status(500).send('Failed to add movie');
  }
});

app.get('/get-movies', async (req, res) => {
  console.log('GET /get-movies hit'); // Log when the route is accessed
  try {
    const movies = await Movie.find();
    res.json(movies);
  } catch (error) {
    console.error('Error retrieving movies:', error);
    res.status(500).send('Failed to retrieve movies');
  }
});


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});




module.exports = app;
