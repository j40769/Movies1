/*const Booking = require('../models/Booking'); // Ensure Booking model is correctly required
const Ticket = require('../models/Ticket'); // Ensure Ticket model is correctly required

const Showroom = require('../models/showroom'); // Adjust the path if needed

// Fetch booked seats for a movie, date, and time
exports.getBookedSeats = async (req, res) => {
    const { movieName, selectedDate, selectedTime } = req.query;

    console.log("Fetching booked seats for:", req.query);

    try {
        // Find all bookings matching the movie, date, and time
        const bookings = await Booking.find({ movieName, selectedDate, selectedTime });

        // Log bookings for debugging purposes
        console.log("Found bookings:", bookings);

        // Extract and flatten all selectedSeats from the bookings
        const bookedSeats = bookings.reduce((acc, booking) => {
            return [...acc, ...booking.selectedSeats];
        }, []);

        // Log the resulting bookedSeats array
        console.log("Booked seats:", bookedSeats);

        // Return the booked seats as a response
        res.json({ success: true, bookedSeats });
    } catch (error) {
        // Log the error and return a response with a failure message
        console.error("Error fetching booked seats:", error);
        res.status(500).json({ success: false, message: 'Error fetching booked seats.' });
    }
};


// Create a new booking
exports.createBooking = async (req, res) => {
    const { movieName, selectedDate, selectedTime, selectedSeats, ageCategories } = req.body;

    try {
        const booking = new Booking({
            movieName,
            selectedDate,
            selectedTime,
            selectedSeats,
            ageCategories,
        });

        await booking.save();
        res.status(201).json({ success: true, bookingId: booking._id });
    } catch (error) {
        console.error("Error creating booking:", error);
        res.status(500).json({ success: false, message: 'Booking creation failed' });
    }
};

// Create a new showroom
exports.createShowroom = async (req, res) => {
    const { showroomName, numberOfSeats } = req.body;

    try {
        // Create a new showroom instance
        const newShowroom = new Showroom({
            showroomName,
            numberOfSeats,
        });

        // Save the showroom to the database
        await newShowroom.save();

        // Respond with a success message
        res.status(201).json({ success: true, showroomId: newShowroom._id });
    } catch (error) {
        console.error('Error creating showroom:', error);
        res.status(500).json({ success: false, message: 'Showroom creation failed' });
    }
};

// Ticket purchase
exports.purchaseTicket = async (req, res) => {
    const { movieId, showtime, seats, ages } = req.body;
    console.log(req.body);

    try {
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
};*/

// bookingController.js

// Import required models
const Booking = require('../models/Booking');
const Ticket = require('../models/Ticket');
const Showroom = require('../models/showroom');

// Factory class for creating model instances
class Factory {
    static createModel(type, data) {
        switch (type) {
            case 'Booking':
                return new Booking(data);
            case 'Ticket':
                return new Ticket(data);
            case 'Showroom':
                return new Showroom(data);
            default:
                throw new Error(`Unknown model type: ${type}`);
        }
    }
}

// Fetch booked seats for a movie, date, and time
exports.getBookedSeats = async (req, res) => {
    const { movieName, selectedDate, selectedTime } = req.query;

    console.log("Fetching booked seats for:", req.query);

    try {
        // Find all bookings matching the movie, date, and time
        const bookings = await Factory.createModel('Booking', {}).constructor.find({
            movieName,
            selectedDate,
            selectedTime,
        });

        // Log bookings for debugging purposes
        console.log("Found bookings:", bookings);

        // Extract and flatten all selectedSeats from the bookings
        const bookedSeats = bookings.reduce((acc, booking) => {
            return [...acc, ...booking.selectedSeats];
        }, []);

        // Log the resulting bookedSeats array
        console.log("Booked seats:", bookedSeats);

        // Return the booked seats as a response
        res.json({ success: true, bookedSeats });
    } catch (error) {
        // Log the error and return a response with a failure message
        console.error("Error fetching booked seats:", error);
        res.status(500).json({ success: false, message: 'Error fetching booked seats.' });
    }
};

// Create a new booking
exports.createBooking = async (req, res) => {
    const { email, movieName, selectedDate, selectedTime, selectedSeats, ageCategories } = req.body;
    console.log(req.body);

    try {
        const booking = Factory.createModel('Booking', {
            email,
            movieName,
            selectedDate,
            selectedTime,
            selectedSeats,
            ageCategories,
        });

        await booking.save();
        res.status(201).json({ success: true, bookingId: booking._id });
    } catch (error) {
        console.error("Error creating booking:", error);
        res.status(500).json({ success: false, message: 'Booking creation failed' });
    }
};

// Function to fetch bookings by email
exports.getBookingsByEmail = async (req, res) => {
    try {
        const { email } = req.query;

        if (!email) {
            return res.status(400).json({ error: "Email is required" });
        }

        const bookings = await Booking.find({ email }).sort({ createdAt: -1 });
        res.json(bookings);
    } catch (err) {
        console.error("Error fetching bookings:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// Create a new showroom
exports.createShowroom = async (req, res) => {
    const { showroomName, numberOfSeats } = req.body;

    try {
        const showroom = Factory.createModel('Showroom', {
            showroomName,
            numberOfSeats,
        });

        await showroom.save();
        res.status(201).json({ success: true, showroomId: showroom._id });
    } catch (error) {
        console.error('Error creating showroom:', error);
        res.status(500).json({ success: false, message: 'Showroom creation failed' });
    }
};

// Ticket purchase
exports.purchaseTicket = async (req, res) => {
    const { movieId, showtime, seats, ages } = req.body;

    try {
        const ticket = Factory.createModel('Ticket', {
            movieId,
            showtime,
            seats,
            ages,
        });

        await ticket.save();
        res.status(201).json({ message: 'Tickets purchased successfully!' });
    } catch (error) {
        console.error('Error purchasing tickets:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

