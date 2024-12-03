const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');

// Route to create a new booking
router.post('/api/bookings', bookingController.createBooking);

// Route for ticket purchase
router.post('/api/tickets/purchase', bookingController.purchaseTicket);

router.post('/showrooms', bookingController.createShowroom);

router.get('/fetchBooking', bookingController.getBookedSeats);

router.get('/api/bookings', bookingController.getBookingsByEmail);


module.exports = router;
