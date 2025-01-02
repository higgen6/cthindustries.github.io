const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const alpacaRoutes = require('./routes/alpaca');

dotenv.config();

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', alpacaRoutes);

// Default route
app.get('/', (req, res) => {
    res.send('Alpaca Trading Backend is running!');
});

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
