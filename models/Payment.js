const mongoose = require('mongoose');

// Create Movie Schema
const Payment = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
    },

    lastName: {
        type: String,
        required: true,
    },

    cardNumber: {
        type: int,
        required: true,
    },

    expiration: {
        type: String,
        required: true,
    },

    securityCode: {
        type: int,
        required: true,
    },



});

const Payment = mongoose.model('Payment', Payment);
module.exports = Movie;
