const Booking = require('../models/Booking');
const Ticket = require('../models/Ticket');
const Showroom = require('../models/showroom');

//factory class for creating model instances
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

exports.getBookedSeats = async (req, res) => {
    const { movieName, selectedDate, selectedTime } = req.query;

    console.log("Fetching booked seats for:", req.query);

    try {
        const bookings = await Factory.createModel('Booking', {}).constructor.find({
            movieName,
            selectedDate,
            selectedTime,
        });

        console.log("Found bookings:", bookings);

        const bookedSeats = bookings.reduce((acc, booking) => {
            return [...acc, ...booking.selectedSeats];
        }, []);

        console.log("Booked seats:", bookedSeats);

        res.json({ success: true, bookedSeats });
    } catch (error) {
        console.error("Error fetching booked seats:", error);
        res.status(500).json({ success: false, message: 'Error fetching booked seats.' });
    }
};

exports.createBooking = async (req, res) => {
    const { userEmail, movieName, selectedDate, selectedTime, selectedSeats, ageCategories } = req.body;

    try {
        const booking = Factory.createModel('Booking', {
            email: userEmail,
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

