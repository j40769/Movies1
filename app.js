var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config(); //enviroment variable

//express
var app = express();


const mongoDBUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/movies';
mongoose.connect(mongoDBUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('Failed to connect to MongoDB', err));


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//cors (connect to frontend)
app.use(cors({
  origin: 'http://localhost:3000',
  methods: 'GET,POST,PUT,DELETE',
  credentials: true
}));


var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

app.use('/', indexRouter);
app.use('/users', usersRouter);

//schemas
const Movie = require('./models/Movie'); // Import Movie model
const User = require('./models/User');   // Import User model


//register
app.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  console.log("register is hit");

  try {
    //user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).send('Email is already registered');
    }
//new user
    const newUser = new User({
      name,
      email,
      password
    });

    await newUser.save();

    //email
    sendConfirmationEmail(email, name);

    res.status(201).send('User registered successfully, confirmation email sent');
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).send(`Failed to register user: ${error.message}`);
  }
});


app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

//email being sent from
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'cinemabookingsystem.info@gmail.com',
    pass: 'duom gnax qbvr cfkj' // Ensure you use an app password for Gmail
  }
});


const sendConfirmationEmail = (userEmail, name) => {
  const mailOptions = {
    from: 'cinemabookingsystem.info@gmail.com',
    to: userEmail,
    subject: 'Confirmation For Registration',
    text: `Hello ${name},\n\nThank you for registering! This is confirmation that you successfully registered as a user for the website.`
  };

  console.log('mail options');
  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.error('Error sending email:', err);
    } else {
      console.log('Email sent:', info.response);
    }
  });
};

//add movie to DB
app.post('/add-movie', async (req, res) => {
  const { movieName, directorName, yearReleased, movieRating, moviePoster, trailerUrl, movieLength, shortDescription, status } = req.body;

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
      status
    });

    await newMovie.save();
    res.status(201).send('Movie added successfully');
  } catch (error) {
    console.error(error);
    res.status(500).send('Failed to add movie');
  }
});

//get movies
app.get('/get-movies', async (req, res) => {
  try {
    const movies = await Movie.find();
    const currentlyRunning = movies.filter(movie => movie.status === 'currentlyRunning');
    const comingSoon = movies.filter(movie => movie.status === 'comingSoon');

    res.json({ currentlyRunning, comingSoon });
  } catch (error) {
    console.error('Error retrieving movies:', error);
    res.status(500).send('Failed to retrieve movies');
  }
});

//search movie w name
app.get('/api/movies', async (req, res) => {
  const { search } = req.query;

  if (!search) {
    return res.status(400).send('Search query is required');
  }

  try {
    const movies = await Movie.find({
      movieName: { $regex: search, $options: 'i' }
    });
    res.json(movies);
  } catch (error) {
    console.error('Error searching movies:', error);
    res.status(500).send('Failed to search movies');
  }
});

app.use(function(req, res, next) {
  next(createError(404));
});

app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

// Export the app
module.exports = app;
