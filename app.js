// Import required modules
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
require('dotenv').config();

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

// Schemas
const Movie = require('./models/Movie');
const User = require('./models/User');
const Promotion = require('./models/Promotion')

// Email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'cinemabookingsystem.info@gmail.com',
    pass: 'duom gnax qbvr cfkj'
  }
});

// Function to send confirmation email
const sendConfirmationEmail = (userEmail, name, token) => {
  const confirmationUrl = `http://localhost:3000/Success?token=${token}`;
  const mailOptions = {
    from: 'cinemabookingsystem.info@gmail.com',
    to: userEmail,
    subject: 'Confirm your Registration',
    text: `Hello ${name},\n\nThank you for registering! Please confirm your email by clicking the following link:\n\n${confirmationUrl}`
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.error('Error sending email:', err);
    } else {
      console.log('Email sent:', info.response);
    }
  });
};

// Function to send password reset email
const sendResetPasswordEmail = (userEmail, token) => {
  const resetUrl = `http://localhost:3000/reset-password?token=${token}`;
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: userEmail,
    subject: 'Reset your Password',
    text: `To reset your password, please click the following link:\n\n${resetUrl}`
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.error('Error sending email:', err);
    } else {
      console.log('Password reset email sent:', info.response);
    }
  });
};

app.post('/register', async (req, res) => {
  console.log(req.body);

  const {
    name,
    email,
    password,
    userStatus,
    billingAddress,
    city,
    postalCode,
    state,
    creditCardNumber, // Expecting an array
    expiryDate, // Expecting an array
    cvv, // Expecting an array
    promotionOptIn
  } = req.body;

  // Basic validation
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Please fill out all required fields.' });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists.' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const role = userStatus === 'admin' ? 'admin' : 'user';

    // Hash credit card info, CVV, and expiry date
    const hashedCreditCardNumber = await Promise.all(
        creditCardNumber.map(num => bcrypt.hash(num, 10))
    );
    const hashedExpiryDate = await Promise.all(
        expiryDate.map(date => bcrypt.hash(date, 10))
    );
    const hashedCVV = await Promise.all(
        cvv.map(c => bcrypt.hash(c, 10))
    );

    // Create new user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      verificationToken,
      tokenCreatedAt: Date.now(),
      userStatus: role,
      billingAddress,
      city,
      postalCode,
      state,
      creditCardNumber: hashedCreditCardNumber, // Store hashed credit card numbers
      expiryDate: hashedExpiryDate, // Store hashed expiry dates
      cvv: hashedCVV, // Store hashed CVV
      promotionOptIn,
    });

    console.log(user);

    // Save the user to the database
    await user.save();

    console.log(user);

    // Send the confirmation email
    sendConfirmationEmail(email, name, verificationToken);

    // Respond with success
    res.status(201).json({ message: 'User registered successfully! A confirmation email has been sent.' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Endpoint to add a new promotion
app.post('/api/promotions/add', async (req, res) => {
  const { title, discount, validUntil } = req.body;
  console.log(req.body);
  

  try {
    const newPromotion = new Promotion({ title, discount, validUntil });
    await newPromotion.save();

    // Find users opted into promotions
    const optedInUsers = await User.find({ promotionOptIn: true });

    console.log(optedInUsers);
    
    // Send email notification to each opted-in user
    optedInUsers.forEach((user) => {
      const mailOptions = {
        from: 'your-email@gmail.com',
        to: user.email,
        subject: 'New Promotion Alert!',
        text: `Hello ${user.name},\n\nA new promotion has been added: ${title} with a discount of ${discount}, valid until ${validUntil}. Check it out!`,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('Error sending email:', error);
        } else {
          console.log(`Email sent to ${user.email}:`, info.response);
        }
      });
    });

    res.status(201).send('Promotion added and emails sent to opted-in users');
  } catch (error) {
    console.error('Error adding promotion:', error);
    res.status(500).send('Failed to add promotion');
  }
});

// Route to update promotion opt-in status
app.post('/api/users/promotion-optin', async (req, res) => {
  const { userId, optIn } = req.body;

  try {
    await User.findByIdAndUpdate(userId, { promotionOptIn: optIn });
    res.status(200).send(`Promotion opt-in status updated to ${optIn}`);
  } catch (error) {
    console.error('Error updating promotion opt-in status:', error);
    res.status(500).send('Failed to update promotion opt-in status');
  }
});

// Update Profile endpoint
app.post('/update-profile', async (req, res) => {
  const {
    email,
    name,
    billingAddress,
    city,
    postalCode,
    state,
    creditCardNumber,
    expiryDate,
    cvv,
    promotionOptIn
  } = req.body;

  try {
    const updatedUser = await User.findOneAndUpdate(
        { email }, // Assuming email is used to identify the user
        {
          name,
          billingAddress,
          city,
          postalCode,
          state,
          creditCardNumber,
          expiryDate,
          cvv,
          promotionOptIn
        },
        { new: true } // Return the updated document
    );

    if (!updatedUser) {
      return res.status(404).send('User not found');
    }

    await sendConfirmationEmaill(email, name);

    res.status(200).send('Profile updated successfully');
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).send(`Failed to update profile: ${error.message}`);
  }
});

const sendConfirmationEmaill = async (userEmail, name) => {
  const mailOptions = {
    from: 'cinemabookingsystem.info@gmail.com',
    to: userEmail,
    subject: 'Confirm your Registration',
    text: `Hello ${name},\n\nThank you for registering! Please confirm your email.`
  };
}

// Forgot password endpoint
app.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).send('User not found');
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetToken = resetToken;
    user.tokenCreatedAt = Date.now();
    await user.save();

    // Construct the reset link
    const resetLink = `http://localhost:3000/ResetPassword?token=${resetToken}`;

    // Send reset password email
    await transporter.sendMail({
      to: email,
      subject: 'Password Reset',
      text: `Click here to reset your password: ${resetLink}`
    });

    res.status(200).send('Password reset email sent');
  } catch (error) {
    console.error('Error in forgot password:', error);
    res.status(500).send('Failed to send reset password email');
  }
});

// Route to reset password by email
app.post('/reset-password', async (req, res) => {
  const { email, password } = req.body;
  console.log(email);

  try {
    // Check if user exists by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update the user's password
    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error resetting password:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Login endpoint
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).send('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).send('Invalid email or password');
    }

    if (user.status !== 'active') {
      return res.status(403).send('User is not active. Please verify your email.');
    }

    res.status(200).json({ message: 'Login successful', role: user.userStatus });
  } catch (error) {
    console.error('Error during login:', error);
    return res.status(500).send('An error occurred during login');
  }
});

// Logout endpoint
app.post('/logout', (req, res) => {
  // Logic for logout can vary based on session management
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
      return res.status(500).send('Logout failed');
    }
    res.clearCookie('connect.sid', { path: '/' });
    return res.status(200).send('Logout successful');
  });
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

    const userProfile = {
      name: user.name,
      email: user.email,
      billingAddress: user.billingAddress,
      city: user.city,
      postalCode: user.postalCode,
      state: user.state,
      creditCards: user.creditCardNumber.map((card, index) => ({
        cardNumber: card,
        expiryDate: user.expiryDate[index],
        cvv: user.cvv[index]
      })),
      promotionOptIn: user.promotionOptIn
    };

    // Send back the user profile
    res.status(200).json(userProfile);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.post('/update-profile', async (req, res) => {
  console.log("Update hit");
  const { userId, name, email, billingAddress, city, postalCode, country, creditCardNumber, expiryDate, cvv, promotionOptIn } = req.body;

  try {
    // Validate user input (you might want to add more validation here)
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required.' });
    }

    // Find the user by ID and update the fields
    const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          name,
          email,
          billingAddress,
          city,
          postalCode,
          state,
          creditCardNumber,
          expiryDate,
          cvv,
          promotionOptIn
        },
        { new: true, runValidators: true } // Options to return the updated document and run validators
    );

    // Check if the user was found and updated
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Prepare the response (exclude sensitive information if needed)
    const userProfile = {
      name: updatedUser.name,
      email: updatedUser.email,
      billingAddress: updatedUser.billingAddress,
      city: updatedUser.city,
      postalCode: updatedUser.postalCode,
      state: updatedUser.state,
      creditCards: updatedUser.creditCardNumber.map((card, index) => ({
        cardNumber: card,
        expiryDate: updatedUser.expiryDate[index],
        cvv: updatedUser.cvv[index]
      })),
      promotionOptIn: updatedUser.promotionOptIn
    };

    // Send response
    res.json(userProfile);
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: 'An error occurred while updating the profile.', error: error.message });
  }
});

// Success endpoint for email verification
app.get('/Success', async (req, res) => {
  const { token } = req.query;
  console.log('Received token for verification:', token);

  try {
    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token.' });
    }

    if (user.status === 'active') {
      return res.status(304).json({ message: 'User is already active.' });
    }

    user.status = 'active';
    await user.save();
    return res.status(200).json({ message: 'User successfully verified and activated.' });
  } catch (error) {
    console.error('Error verifying email:', error);
    return res.status(500).json({ message: 'An error occurred while verifying your email.' });
  }
});

app.post('/add-movie', async (req, res) => {
  const {
    movieName,
    directorName,
    yearReleased,
    movieRating,
    moviePoster,
    trailerUrl,
    movieLength,
    shortDescription,
    status,
    showDates,
    showTimes,
    genre // New field
  } = req.body;

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
      status,
      showDates,
      showTimes,
      genre // Save genre
    });

    await newMovie.save();
    res.status(201).send('Movie added successfully');
  } catch (error) {
    console.error('Error adding movie:', error);
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
/*app.get('/api/movies', async (req, res) => {
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
  res.json({ error: res.locals.message });
});*/

app.get('/api/movies', async (req, res) => {
  const { search } = req.query;

  // Check if search query is provided
  if (!search) {
    return res.status(400).send('Search query is required');
  }

  try {
    const regex = new RegExp(search, 'i'); // Create a case-insensitive regex for search
    // Search for movies by movieName or genre
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
});

// Error handling middleware
app.use(function(req, res, next) {
  next(createError(404));
});

app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.json({ error: res.locals.message });
});


// Export the app
module.exports = app;