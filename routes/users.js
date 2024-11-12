const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/Success', userController.verifyEmail);
router.post('/update-profile', userController.updateProfile);
router.get('/user-profile', userController.getUserProfile);

module.exports = router;

