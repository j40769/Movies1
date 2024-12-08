const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');

router.post('/api/bookings', bookingController.createBooking);

router.post('/api/tickets/purchase', bookingController.purchaseTicket);

router.post('/showrooms', bookingController.createShowroom);

router.get('/fetchBooking', bookingController.getBookedSeats);

router.get('/api/bookings', bookingController.getBookingsByEmail);


module.exports = router;
