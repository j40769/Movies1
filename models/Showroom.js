const mongoose = require('mongoose');

const showroomSchema = new mongoose.Schema({
    showroomName: {
        type: String,
        required: true,
    },
    numberOfSeats: {
        type: Number,
        required: true,
    },
});

// Check if the model is already compiled
const Showroom = mongoose.models.Showroom || mongoose.model('Showroom', showroomSchema);

module.exports = Showroom;
