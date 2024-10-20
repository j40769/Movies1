const mongoose = require('mongoose');
const User = require('./User');

// Define any additional fields for the Admin schema here
const adminSchema = new mongoose.Schema({

});

// Create the Admin model as a discriminator of User
const Admin = User.discriminator('Admin', adminSchema);

module.exports = Admin;
