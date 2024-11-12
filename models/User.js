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
    state: {
        type: String,
        default: ''
    },
    creditCardNumber: [{
        encryptedData: { type: String },
        iv: { type: String }
    }],
    expiryDate: [{
        encryptedData: { type: String },
        iv: { type: String }
    }],
    cvv: [{
        encryptedData: { type: String },
        iv: { type: String }
    }],
    promotionOptIn: {
        type: Boolean,
        default: true
    }
});

const User = mongoose.model('User', userSchema);

module.exports = User;



