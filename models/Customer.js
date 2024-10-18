const mongoose = require('mongoose');
const User = require('./User');
const Payment = require('./Payment'); // Import the Payment schema

const customerSchema = new mongoose.Schema({
    customerID: {
        type: String,
        required: true,
        unique: true,
    },
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },

    state: {
        type: String,
        required: true,
        enum: ['Active', 'Inactive', 'Suspended'],
        unique: true,
    },

    paymentMethods: {
        type: [paymentSchema],
        validate: [arrayLimit, '{PATH} exceeds the limit of 4'],
        required: true
    }

});

// Custom validator to limit array size
function arrayLimit(val) {
    return val.length <= 4; // Limit the array to four elements
}

// Create the Customer model as a discriminator of User
const Customer = User.discriminator('customer', customerSchema);

module.exports = Customer;