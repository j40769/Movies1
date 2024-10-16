const mongoose = require('mongoose');
const User = require('./User');

// Define any additional fields for the Customer schema here
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
    }
});

// Create the Customer model as a discriminator of User
const Customer = User.discriminator('customer', customerSchema);

module.exports = Customer;