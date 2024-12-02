const mongoose = require('mongoose');

// Define the promotion schema
const promotionSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true, // Make title required
    },
    discount: {
        type: Number,
        required: true, // Make discount required
    },
    validUntil: {
        type: Date,
        required: true, // Make validUntil required
    },
    createdAt: {
        type: Date,
        default: Date.now, // Automatically set createdAt to the current date
    },
});

// Export the Promotion model
//module.exports = mongoose.model('Promotion', promotionSchema);

const Promotion = mongoose.model('Promotion', promotionSchema);
module.exports = Promotion;