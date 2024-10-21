const mongoose = require('mongoose');
const bcrypt = require('bcrypt'); // Ensure bcrypt is imported

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    status: {
        type: String,
        enum: ['suspended', 'active', 'inactive'],
        default: 'inactive'
    },
    password: {
        type: String,
        required: true
    },
    verificationToken: {
        type: String,
        default: null
    },
    tokenCreatedAt: {
        type: Date,
        default: Date.now,
        expires: '1h'
    },
    userStatus: {
        type: String,
        enum: ['admin', 'user'],
        default: 'user'
    },
    // New fields for billing information and promotions
    billingAddress: {
        type: String,
        default: ''
    },
    city: {
        type: String,
        default: ''
    },
    postalCode: {
        type: String,
        default: ''
    },
    country: {
        type: String,
        default: ''
    },
    creditCardNumber: [{
        type: String,
        default: ''
    }],
    expiryDate: [{
        type: String,
        default: ''
    }],
    cvv: [{
        type: String,
        default: ''
    }],
    promotionOptIn: {
        type: Boolean,
        default: false
    }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
