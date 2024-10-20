const mongoose = require('mongoose');

// Create Movie Schema
const paymentSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
    },

    lastName: {
        type: String,
        required: true,
    },

    cardNumber: {
        type: Number,
        required: true,
    },

    expiration: {
        type: String,
        required: true,
    },

    securityCode: {
        type: Number,
        required: true,
    },

    //edit profile
    billingAddress: {
        type: String,
        required: false, // Ensure the billing address is required
        unique: true, // Allow only one billing address per user
    },
    paymentCards: {
        type: [String],
        validate: [arrayLimit, 'Exceeds the limit of 4 payment cards.'], // Custom validator
    },
    promotionalEmails: {
        type: Boolean,
        default: false,
    },



});

const Payment = mongoose.model('Payment', paymentSchema);
module.exports = Payment;
