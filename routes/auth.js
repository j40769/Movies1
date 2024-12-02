const express = require('express');
const router = express.Router();
const authController = require('../controllers/authControllers');

// Registration Route
router.post('/register', authController.registerUser);

// Send Confirmation Email Route
router.post('/send-confirmation-email', authController.sendOrderConfirmationEmail);

router.post('/api/promotions/add', authController.addPromotion);

router.get('/api/promotions', authController.getPromotions);

// Forgot Password Route
router.post('/forgot-password', authController.forgotPassword);

router.get('/reset-password', authController.verifyResetToken);

// Submit new password (POST)
router.post('/reset-password', authController.resetPassword);

// Login Route
router.post('/login', authController.loginUser);



module.exports = router;
