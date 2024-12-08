const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const User = require('../models/User');
const Promotion = require('../models/Promotion');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'cinemabookingsystem.info@gmail.com',
        pass: 'duom gnax qbvr cfkj'
    }
});

const sendConfirmationEmail = (userEmail, name, token) => {
    const confirmationUrl = `http://localhost:3000/Success?token=${token}`;
    const mailOptions = {
        from: 'cinemabookingsystem.info@gmail.com',
        to: userEmail,
        subject: 'Confirm your Registration',
        text: `Hello ${name},\n\nThank you for registering! Please confirm your email by clicking the following link:\n\n${confirmationUrl}`
    };
    return transporter.sendMail(mailOptions);
};

const sendResetPasswordEmail = (userEmail, token) => {
    const resetUrl = `http://localhost:3000/ResetPassword?token=${token}`;
    const mailOptions = {
        from: 'cinemabookingsystem.info@gmail.com',
        to: userEmail,
        subject: 'Reset your Password',
        text: `To reset your password, please click the following link:\n\n${resetUrl}`
    };
    return transporter.sendMail(mailOptions);
};


const sendOrderConfirmationEmail = async ({ userEmail, userName, order, orderTotal, movieDate, movieTime, movieName }) => {
    console.log(userEmail);

    const emailBody = `
        Hello,

        Thank you for your purchase! Your order has been successfully placed.

        Order Summary:
        ${order.map(({ seat, age }) => `Seat: ${seat} (Age: ${age})`).join('\n')}
        
        Movie Name: ${movieName}
        Total Price: $${orderTotal.toFixed(2)}
        Movie Date: ${movieDate}
        Movie Time: ${movieTime}

        Enjoy your movie!

        Regards,
        Cinema Booking System
    `;
    const mailOptions = {
        from: 'cinemabookingsystem.info@gmail.com',
        to: userEmail,
        subject: 'Your Movie Ticket Confirmation',
        text: emailBody
    };
    return transporter.sendMail(mailOptions);
};

function encrypt(text) {
    const algorithm = 'aes-256-cbc';
    const secretKey = 'your-secret-key';  // Replace with your real secret key
    const key = crypto.createHash('sha256').update(secretKey).digest(); // Generate 32-byte key
    const iv = crypto.randomBytes(16); // Generate 16-byte IV
    console.log('Generated IV (hex):', iv.toString('hex'));


    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return { encryptedData: encrypted, iv: iv.toString('hex') };
}

function decrypt(encryptedData, iv) {
    console.log('IV passed for decryption (hex):', iv);
    const algorithm = 'aes-256-cbc';
    const secretKey = 'your-secret-key'; // Must match the key used in encryption
    const key = crypto.createHash('sha256').update(secretKey).digest(); // Generate 32-byte key

    const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(iv, 'hex'));
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

exports.sendOrderConfirmationEmail = async (req, res) => {
    try {
        await sendOrderConfirmationEmail(req.body);
        res.status(200).json({ message: 'Confirmation email sent successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.registerUser = async (req, res) => {
    const { name, email, password, userStatus, billingAddress, city, postalCode, state, creditCardNumber, expiryDate, cvv, promotionOptIn } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Please fill out all required fields.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const role = userStatus === 'admin' ? 'admin' : 'user';

        const encryptedCreditCardNumber = creditCardNumber.map(num => encrypt(num.toString()));
        const encryptedExpiryDate = expiryDate.map(date => encrypt(date.toString()));
        const encryptedCVV = cvv.map(c => encrypt(c.toString()));

        const user = new User({
            name,
            email,
            password: hashedPassword,
            verificationToken,
            tokenCreatedAt: Date.now(),
            userStatus,
            billingAddress,
            city,
            postalCode,
            state,
            creditCardNumber: encryptedCreditCardNumber,
            expiryDate: encryptedExpiryDate,
            cvv: encryptedCVV,
            promotionOptIn,
        });

        await user.save();
        await sendConfirmationEmail(email, name, verificationToken);

        res.status(201).json({ message: 'User registered successfully.' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
};

exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).send('User not found');
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        user.resetToken = resetToken;
        user.tokenCreatedAt = Date.now();
        await user.save();

        await sendResetPasswordEmail(email, resetToken);

        res.status(200).send('Password reset email sent');
    } catch (error) {
        console.error('Error in forgot password:', error);
        res.status(500).send('Failed to send reset password email');
    }
};

exports.verifyResetToken = async (req, res) => {
    const { token } = req.query;

    try {
        const user = await User.findOne({ resetToken: token, tokenCreatedAt: { $gte: Date.now() - 3600000 } }); // Token valid for 1 hour

        if (!user) {
            return res.status(404).json({ message: 'Invalid or expired token.' });
        }

        res.status(200).json({ message: 'Token is valid.' });
    } catch (error) {
        console.error('Error verifying reset token:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.resetPassword = async (req, res) => {
    const { token, password } = req.body;

    try {
        const user = await User.findOne({ resetToken: token, tokenCreatedAt: { $gte: Date.now() - 3600000 } }); // Token valid for 1 hour

        if (!user) {
            return res.status(404).json({ message: 'Invalid or expired token.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;
        user.resetToken = undefined; 
        user.tokenCreatedAt = undefined;
        await user.save();

        res.status(200).json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.addPromotion = async (req, res) => {
    const { title, discount, code, validUntil } = req.body;
    console.log(req.body);
    
    try {
        const newPromotion = new Promotion({ title, discount, code, validUntil });
        await newPromotion.save();

        const optedInUsers = await User.find({ promotionOptIn: true });

        console.log(optedInUsers);

        optedInUsers.forEach((user) => {
            const mailOptions = {
                from: 'your-email@gmail.com',
                to: user.email,
                subject: 'New Promotion Alert!',
                text: `Hello ${user.name},\n\nA new promotion has been added: ${title} with a discount of ${discount}%, with a code of ${code}, valid until ${validUntil}. Check it out!`,
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error('Error sending email:', error);
                } else {
                    console.log(`Email sent to ${user.email}:`, info.response);
                }
            });
        });

        res.status(201).send('Promotion added and emails sent to opted-in users');
    } catch (error) {
        console.error('Error adding promotion:', error);
        res.status(500).send('Failed to add promotion');
    }
};

exports.getPromotions = async (req, res) => {
    try {
        const promotions = await Promotion.find();

        if (!promotions || promotions.length === 0) {
            return res.status(404).send('No promotions found.');
        }

        res.status(200).json(promotions);
    } catch (error) {
        console.error('Error fetching promotions:', error);
        res.status(500).send('Failed to fetch promotions');
    }
};


exports.loginUser = async (req, res) => {
    const { email, password } = req.body;
    console.log(req.body);
    
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).send('Invalid email or password');
        }

        const isMatch = await bcrypt.compare(password, user.password);
        console.log(isMatch);
        if (!isMatch) {
            return res.status(401).send('Invalid email or password');
        }

        console.log(user.status);
        
        if (user.status !== 'active') {
            return res.status(403).send('User is not active. Please verify your email.');
        }

        res.status(200).json({ message: 'Login successful', role: user.userStatus, email: user.email });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).send('An error occurred during login');
    }
};






