// Import required modules
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');
const crypto = require('crypto'); // To generate the token
const bcrypt = require('bcrypt'); // For password hashing
require('dotenv').config(); // To use environment variables

// Initialize express
var app = express();

// MongoDB connection
const mongoDBUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/movies';
mongoose.connect(mongoDBUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('Failed to connect to MongoDB', err));

// Middleware
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Enable CORS
app.use(cors({
  origin: 'http://localhost:3000',
  methods: 'GET,POST,PUT,DELETE',
  credentials: true
}));

// Routes
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

app.use('/', indexRouter);
app.use('/users', usersRouter);

// Schemas
const Movie = require('./models/Movie'); // Import Movie model
const User = require('./models/User');   // Import User model

// Logout endpoint
app.post('/logout', (req, res) => {
  console.log("logout is hit");

  // Check if the user is logged in (session exists)
  if (!req.session) {
    return res.status(400).send('No active session to log out from');
  }

  // Destroy the session
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
      return res.status(500).send('Logout failed');
    }

    // Clear the session cookie
    res.clearCookie('connect.sid', { path: '/' });
    console.log("Session and cookie cleared");

    // Send a success message
    return res.status(200).send('Logout successful');
  });
});



// Registration endpoint
app.post('/register', async (req, res) => {
  const { name, email, password, userStatus } = req.body;

  console.log("register is hit");

  try {
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).send('Email is already registered');
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const role = userStatus === 'admin' ? 'admin' : 'user'; // Ensure valid roles

    // Create a new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword, // Store the hashed password
      status: 'inactive', // User is inactive until email is verified
      verificationToken, // Set the token for verification
      tokenCreatedAt: Date.now(), // Set the current timestamp
      userStatus: role,
    });

    await newUser.save();

    // Send confirmation email
    sendConfirmationEmail(email, name, verificationToken);

    res.status(201).send('User registered successfully, confirmation email sent');
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).send(`Failed to register user: ${error.message}`);
  }
});

// Email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'cinemabookingsystem.info@gmail.com',
    pass: 'duom gnax qbvr cfkj' // Ensure you use an app password for Gmail
  }
});

// GET user profile by email
app.get('/user-profile', async (req, res) => {
  const { email } = req.query;

  // Validate email query parameter
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    // Find the user by email
    const user = await User.findOne({ email });

    // Check if user was found
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prepare user profile response excluding sensitive information
    const userProfile = {
      name: user.name,
      email: user.email,
      billingAddress: user.billingAddress,
      city: user.city,
      postalCode: user.postalCode,
      country: user.country,
      creditCards: user.creditCards,
      promotions: user.promotions,
    };

    // Send back the user profile
    res.status(200).json(userProfile);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Example of an update profile endpoint
app.post('/update-profile', async (req, res) => {
  console.log("Update hit");
  const {
    name,
    email,
    currentPassword,
    password,
    confirmPassword,
    billingAddress,
    city,
    postalCode,
    country,
    creditCards,
    promotions
  } = req.body;

  console.log("Request body:", req.body);

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).send('User not found');
    }

    // Update fields
    if (name) user.name = name;
    if (billingAddress) user.billingAddress = billingAddress;
    if (city) user.city = city;
    if (postalCode) user.postalCode = postalCode;
    if (country) user.country = country;

    // Password update logic
    if (currentPassword && password && password === confirmPassword) {
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(401).send('Current password is incorrect');
      }
      user.password = password; // Don't forget to hash the password before saving
    }

    user.creditCards = creditCards;
    user.promotions = promotions;

    await user.save();

    res.status(200).send('Profile updated successfully');
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).send('Internal server error');
  }
});



// Function to send confirmation email
const sendConfirmationEmail = (userEmail, name, token) => {
  const confirmationUrl = `http://localhost:3000/Success?token=${token}`; // Link with token
  const mailOptions = {
    from: 'cinemabookingsystem.info@gmail.com',
    to: userEmail,
    subject: 'Confirm your Registration',
    text: `Hello ${name},\n\nThank you for registering! Please confirm your email by clicking the following link:\n\n${confirmationUrl}`
  };

  console.log('Sending email to:', userEmail);
  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.error('Error sending email:', err);
    } else {
      console.log('Email sent:', info.response);
    }
  }); // Make sure to close this bracket here
} // Added closing brace for sendConfirmationEmail function

// Login endpoint
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log("login is hit");

  try {
    // Find the user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).send('Invalid email or password'); // User not found
    }

    // Check if the password is correct
    const isMatch = await bcrypt.compare(password, user.password); // Compare the hashed password

    if (!isMatch) {
      return res.status(401).send('Invalid email or password'); // Incorrect password
    }


    // Check user status
    if (user.userStatus === 'admin') {
      console.log("login admin");
      return res.status(200).json({ message: 'Login successful', role: 'admin' }); // Redirect to admin page
    } else {
      console.log("login user");
      return res.status(200).json({ message: 'Login successful', role: 'user' }); // Redirect to user page
    }
  } catch (error) {
    console.error('Error during login:', error);
    return res.status(500).send('An error occurred during login');
  }
});

// Success endpoint for email verification
app.get('/Success', async (req, res) => {
  const { token } = req.query;
  console.log('Received token:', token); // Log the received token

  try {
    // Find the user by the token
    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token.' });
    }

    // Check if the user is already active
    if (user.status === 'active') {
      // Return a 304 Not Modified if the user is already active
      return res.status(304).json({ message: 'User is already active.' }); // Consider using 409 for conflicts instead
    }

    // Update user status to 'active'
    user.status = 'active';
    await user.save();

    // Send success message
    return res.status(200).json({ message: 'User successfully verified and activated.' });
  } catch (error) {
    console.error('Error verifying email:', error);
    return res.status(500).json({ message: 'An error occurred while verifying your email.' });
  }
});

// Add movie to DB
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

// Get all movies
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

// Search movie by name
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

// Error handling
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