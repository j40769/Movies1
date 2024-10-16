const mongoose = require('mongoose');

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
    password: {
        type: String,
        required: true
    },

});

/* const User = mongoose.model('User', userSchema);
module.exports = User;
=======
const bcrypt = require('bcrypt');

// Create User Schema
const userSchema = new mongoose.Schema({
    userID: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    }
    role: {
        type: String,
        required: true,
        enum: ['admin', 'customer'],
    }
}, { discriminatorKey: 'role' }););

// Hash the password before saving the user
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};*/


const User = mongoose.model('User', userSchema);
module.exports = User;
