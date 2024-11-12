const User = require('../models/User');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

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

// Email verification endpoint
exports.verifyEmail = async (req, res) => {
    const { token } = req.query;
    try {
        const user = await User.findOne({ verificationToken: token });
        if (!user) return res.status(400).json({ message: 'Invalid or expired token.' });

        if (user.status === 'active') {
            return res.status(304).json({ message: 'User is already active.' });
        }

        user.status = 'active';
        await user.save();
        res.status(200).json({ message: 'User successfully verified and activated.' });
    } catch (error) {
        console.error('Error verifying email:', error);
        res.status(500).json({ message: 'An error occurred while verifying your email.' });
    }
};

exports.updateProfile = async (req, res) => {
    const { email, name, password, currentPassword, confirmPassword, billingAddress, city, postalCode, state, creditCards, promotions } = req.body;
    console.log('Request body:', req.body);

    try {
        console.log('Received update profile request for email:', email);

        let encryptedCards = [];
        if (creditCards && creditCards.length > 0) {
            console.log('Credit cards provided, starting encryption process...');
            encryptedCards = await Promise.all(
                creditCards.map(async (card, index) => {
                    console.log(`Processing card ${index + 1}:`, card);

                    // Validate card data
                    if (!card.cardLast4 || !card.expiryDate || !card.cvv) {
                        console.error('Missing required credit card fields for card', index + 1, card);
                        throw new Error('Incomplete credit card data');
                    }

                    // Encrypt card number and cvv
                    const encryptedCardNumber = encrypt(card.cardLast4);  // Encrypting the card's last 4 digits
                    const encryptedCvv = encrypt(card.cvv);  // Encrypting the CVV
                    const encryptedExpiryDate = encrypt(card.expiryDate);  // Encrypting the expiry date

                    console.log(`Card ${index + 1} encryption complete. Encrypted data:`);
                    console.log('Encrypted Card Number:', encryptedCardNumber.encryptedData);
                    console.log('Encrypted CVV:', encryptedCvv.encryptedData);

                    return {
                        encryptedData: encryptedCardNumber.encryptedData,
                        iv: encryptedCardNumber.iv,
                        expiryDate: [{ encryptedData: encryptedExpiryDate.encryptedData, iv: encryptedExpiryDate.iv }],  // Encrypted expiry date as an array of objects
                        encryptedCvvData: encryptedCvv.encryptedData,
                        cvvIv: encryptedCvv.iv,
                    };
                })
            );
        } else {
            console.log('No credit cards provided, skipping encryption.');
        }

        // Prepare the update data object
        const updateData = {
            name,
            billingAddress, // Updating billing address directly
            city,
            postalCode,
            state,
            creditCardNumber: encryptedCards.map(card => ({
                encryptedData: card.encryptedData,
                iv: card.iv,
            })),
            expiryDate: encryptedCards.map(card => ({
                encryptedData: card.expiryDate[0].encryptedData,
                iv: card.expiryDate[0].iv,
            })),
            cvv: encryptedCards.map(card => ({
                encryptedData: card.encryptedCvvData,
                iv: card.cvvIv,
            })),
            promotionOptIn: promotions, // Updating promotion opt-in status
        };

        if (password) {
            // Check if password is provided, and hash it if it is
            if (password !== confirmPassword) {
                return res.status(400).json({ error: 'Passwords do not match' });
            }
            console.log('Password provided, encrypting...');
            updateData.password = bcrypt.hashSync(password, 10); // Encrypt password
            console.log('Password encrypted.');
        }

        console.log('Final update data:', updateData);

        // Update the user document in the database
        const updatedUser = await User.findOneAndUpdate({ email }, updateData, { new: true });

        if (!updatedUser) {
            console.error('User not found with email:', email);
            return res.status(404).json({ error: 'User not found' });
        }

        console.log('User profile updated:', updatedUser);
        return res.status(200).json(updatedUser); // Send back updated user data
    } catch (err) {
        console.error('Error updating user profile:', err);
        return res.status(500).json({ error: 'Internal server error' }); // Handle server error
    }
};

// Get user profile endpoint
exports.getUserProfile = async (req, res) => {
    const { email } = req.query;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const decryptedCreditCardNumber = user.creditCardNumber.map(cc => decrypt(cc.encryptedData, cc.iv)); // Assuming it's an array of encrypted card numbers

        console.log(decryptedCreditCardNumber);

        const decryptedExpiryDate = user.expiryDate.map(exp => decrypt(exp.encryptedData, exp.iv)); // Decrypt expiry date
        console.log(decryptedExpiryDate);

        const decryptedCVV = user.cvv.map(cvv => decrypt(cvv.encryptedData, cvv.iv)); // Decrypt CVV

        console.log(decryptedCVV);

        // Return the decrypted data to the frontend
        res.json({
            name: user.name,
            email: user.email,

            billingAddress: user.billingAddress,
            city: user.city,
            postalCode: user.postalCode,
            state: user.state,

            creditCards: decryptedCreditCardNumber.map((number, index) => ({
                cardLast4: number.slice(-4), // Show only the last 4 digits
                expiryDate: decryptedExpiryDate[index], // Assuming dates are stored in parallel arrays
                cvv: decryptedCVV[index], // Return the decrypted CVV here
            })),
            promotionOptIn: user.promotionOptIn

        });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
};
