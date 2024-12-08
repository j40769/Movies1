const express = require('express');
const router = express.Router();
const authController = require('../controllers/authControllers');

router.post('/register', authController.registerUser);

router.post('/send-confirmation-email', authController.sendOrderConfirmationEmail);

router.post('/api/promotions/add', authController.addPromotion);

router.get('/api/promotions', authController.getPromotions);

router.post('/forgot-password', authController.forgotPassword);

router.get('/reset-password', authController.verifyResetToken);

router.post('/reset-password', authController.resetPassword);

router.post('/login', authController.loginUser);



module.exports = router;
