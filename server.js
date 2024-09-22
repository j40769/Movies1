const app = require('./app'); // Import the app from app.js
const port = process.env.PORT || 9090; // Set the port

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
