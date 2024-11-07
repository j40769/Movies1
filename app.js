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
const Ticket = require('./models/Ticket')

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

function encrypt(text) {
  const algorithm = 'aes-256-cbc';
  const secretKey = 'your-secret-key';  // Replace with your real secret key
  const key = crypto.createHash('sha256').update(secretKey).digest(); // Generate 32-byte key
  const iv = crypto.randomBytes(16); // Generate 16-byte IV
  console.log('Generated IV (hex):', iv.toString('hex'));


  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return { encryptedData: encrypted, iv: iv.toString('hex') };
}



// POST route for user registration
app.post('/register', async (req, res) => {
  const {
    name,
    email,
    password,
    userStatus,
    billingAddress,
    city,
    postalCode,
    state,
    creditCardNumber, // Expecting an array of credit card numbers
    expiryDate, // Expecting an array of expiry dates
    cvv, // Expecting an array of CVVs
    promotionOptIn
  } = req.body;

  // Basic validation
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Please fill out all required fields.' });
  }

  try {
    // Hash the password with bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const role = userStatus === 'admin' ? 'admin' : 'user';

    // Ensure the credit card info, CVV, and expiry date are arrays, or wrap them in arrays if not
    const encryptedCreditCardNumber = Array.isArray(creditCardNumber)
        ? creditCardNumber.map(num => encrypt(num.toString()))
        : [encrypt(creditCardNumber.toString())];

    const encryptedExpiryDate = Array.isArray(expiryDate)
        ? expiryDate.map(date => encrypt(date.toString()))
        : [encrypt(expiryDate.toString())];

    const encryptedCVV = Array.isArray(cvv)
        ? cvv.map(c => encrypt(c.toString()))
        : [encrypt(cvv.toString())];

    // Log encrypted data for debugging
    console.log({
      encryptedCreditCardNumber,
      encryptedExpiryDate,
      encryptedCVV
    });

    // Create a new user instance
    const user = new User({
      name,
      email,
      password: hashedPassword,
      verificationToken,
      tokenCreatedAt: Date.now(),
      userStatus,
      billingAddress,
      city,
      postalCode,
      state,
      creditCardNumber: encryptedCreditCardNumber, // Array of objects {encryptedData, iv}
      expiryDate: encryptedExpiryDate, // Array of objects {encryptedData, iv}
      cvv: encryptedCVV, // Array of objects {encryptedData, iv}
      promotionOptIn,
    });

    // Save the user to the database
    await user.save();

    // Send confirmation email (make sure this function is defined elsewhere)
    sendConfirmationEmail(email, name, verificationToken);

    res.status(201).json({ message: 'User registered successfully.' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});



// Ticket Purchase Endpoint
app.post('/api/tickets/purchase', async (req, res) => {
  const { movieId, showtime, seats, ages } = req.body;

  try {
    // Save the ticket purchase details in the database
    const newTicket = new Ticket({
      movieId,
      showtime,
      seats,
      ages,
    });

    await newTicket.save();

    res.status(201).json({ message: 'Tickets purchased successfully!' });
  } catch (error) {
    console.error('Error purchasing tickets:', error);
    res.status(500).json({ message: 'Internal server error' });
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
    console.log(isMatch);

    if (!isMatch) {
      return res.status(401).send('Invalid email or password');
    }
    if (user.status !== 'active') {
      return res.status(403).send('User is not active. Please verify your email.');
    }
    res.status(200).json({ message: 'Login successful', role: user.userStatus, email: user.email });
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


function decrypt(encryptedData, iv) {
  console.log('IV passed for decryption (hex):', iv);
  const algorithm = 'aes-256-cbc';
  const secretKey = 'your-secret-key'; // Must match the key used in encryption
  const key = crypto.createHash('sha256').update(secretKey).digest(); // Generate 32-byte key

  const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(iv, 'hex'));
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}


app.get('/user-profile', async (req, res) => {
  const { email } = req.query;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const decryptedCreditCardNumber = user.creditCardNumber.map(cc => decrypt(cc.encryptedData, cc.iv)); // Assuming it's an array of encrypted card numbers

    console.log(decryptedCreditCardNumber);

    const decryptedExpiryDate = user.expiryDate.map(exp => decrypt(exp.encryptedData, exp.iv)); // Decrypt expiry date
    console.log(decryptedExpiryDate);
    
    const decryptedCVV = user.cvv.map(cvv => decrypt(cvv.encryptedData, cvv.iv)); // Decrypt CVV

    console.log(decryptedCVV);
    
    // Return the decrypted data to the frontend
    res.json({
      name: user.name,
      email: user.email,
      
      billingAddress: user.billingAddress,
      city: user.city,
      postalCode: user.postalCode,
      state: user.state,
      
      creditCards: decryptedCreditCardNumber.map((number, index) => ({
        cardLast4: number.slice(-4), // Show only the last 4 digits
        expiryDate: decryptedExpiryDate[index], // Assuming dates are stored in parallel arrays
        cvv: decryptedCVV[index], // Return the decrypted CVV here
      })),
      promotionOptIn: user.promotionOptIn

    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});


app.post('/update-profile', async (req, res) => {
  const { email, name, password, currentPassword, confirmPassword, billingAddress, city, postalCode, state, creditCards, promotions } = req.body;
  console.log('Request body:', req.body);

  try {
    console.log('Received update profile request for email:', email);

    let encryptedCards = [];
    if (creditCards && creditCards.length > 0) {
      console.log('Credit cards provided, starting encryption process...');
      encryptedCards = await Promise.all(
          creditCards.map(async (card, index) => {
            console.log(`Processing card ${index + 1}:`, card);

            // Validate card data
            if (!card.cardLast4 || !card.expiryDate || !card.cvv) {
              console.error('Missing required credit card fields for card', index + 1, card);
              throw new Error('Incomplete credit card data');
            }

            // Encrypt card number and cvv
            const encryptedCardNumber = encrypt(card.cardLast4);  // Encrypting the card's last 4 digits
            const encryptedCvv = encrypt(card.cvv);  // Encrypting the CVV
            const encryptedExpiryDate = encrypt(card.expiryDate);  // Encrypting the expiry date

            console.log(`Card ${index + 1} encryption complete. Encrypted data:`);
            console.log('Encrypted Card Number:', encryptedCardNumber.encryptedData);
            console.log('Encrypted CVV:', encryptedCvv.encryptedData);

            return {
              encryptedData: encryptedCardNumber.encryptedData,
              iv: encryptedCardNumber.iv,
              expiryDate: [{ encryptedData: encryptedExpiryDate.encryptedData, iv: encryptedExpiryDate.iv }],  // Encrypted expiry date as an array of objects
              encryptedCvvData: encryptedCvv.encryptedData,
              cvvIv: encryptedCvv.iv,
            };
          })
      );
    } else {
      console.log('No credit cards provided, skipping encryption.');
    }

    // Prepare the update data object
    const updateData = {
      name,
      billingAddress, // Updating billing address directly
      city,
      postalCode,
      state,
      creditCardNumber: encryptedCards.map(card => ({
        encryptedData: card.encryptedData,
        iv: card.iv,
      })),
      expiryDate: encryptedCards.map(card => ({
        encryptedData: card.expiryDate[0].encryptedData,
        iv: card.expiryDate[0].iv,
      })),
      cvv: encryptedCards.map(card => ({
        encryptedData: card.encryptedCvvData,
        iv: card.cvvIv,
      })),
      promotionOptIn: promotions, // Updating promotion opt-in status
    };

    if (password) {
      // Check if password is provided, and hash it if it is
      if (password !== confirmPassword) {
        return res.status(400).json({ error: 'Passwords do not match' });
      }
      console.log('Password provided, encrypting...');
      updateData.password = bcrypt.hashSync(password, 10); // Encrypt password
      console.log('Password encrypted.');
    }

    console.log('Final update data:', updateData);

    // Update the user document in the database
    const updatedUser = await User.findOneAndUpdate({ email }, updateData, { new: true });

    if (!updatedUser) {
      console.error('User not found with email:', email);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('User profile updated:', updatedUser);
    return res.status(200).json(updatedUser); // Send back updated user data
  } catch (err) {
    console.error('Error updating user profile:', err);
    return res.status(500).json({ error: 'Internal server error' }); // Handle server error
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
    genre
  } = req.body;

  try {
    // Format `showDates` as Date objects
    const formattedShowDates = showDates.map(date => new Date(date));

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
      showDates: formattedShowDates,
      showTimes,
      genre
    });

    // Save the movie to the database
    await newMovie.save();
    res.status(201).json({ message: 'Movie added successfully', movie: newMovie });
  } catch (error) {
    res.status(500).json({ message: 'Error adding movie', error: error.message });
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

const { ObjectId } = require('mongodb'); // Ensure ObjectId is imported

app.get('/api/movies/:id', async (req, res) => {
  try {
    console.log("hello");
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).send('Movie not found');
    }
    res.json(movie);
  } catch (err) {
    console.error('Error fetching movie:', err);
    res.status(500).send('Error fetching movie');
  }
});



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



