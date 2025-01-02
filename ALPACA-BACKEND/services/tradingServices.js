const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const alpacaRoutes = require('./routes/alpaca');
const schedule = require('node-schedule');
const axios = require('axios');

dotenv.config();

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Default route
app.get('/', (req, res) => {
    res.send('Alpaca Trading Backend is running!');
});

// Notify when waiting for the stock market to open
const waitingForMarket = () => {
    console.log('Waiting for the stock market to open...');
};

// Schedule trading to run only on weekdays from 10:00 AM to 4:30 PM Eastern Time
const runTrading = () => {
    console.log('Trading session started.');
    app.use('/api', alpacaRoutes);
};

const stopTrading = () => {
    console.log('Trading session ended.');
    app._router.stack = app._router.stack.filter(layer => layer.name !== 'router');
};

// Notify before trading begins
schedule.scheduleJob({ dayOfWeek: [1, 2, 3, 4, 5], hour: 9, minute: 30, tz: 'America/New_York' }, () => {
    waitingForMarket();
});

schedule.scheduleJob({ dayOfWeek: [1, 2, 3, 4, 5], hour: 10, minute: 0, tz: 'America/New_York' }, () => {
    runTrading();
});

schedule.scheduleJob({ dayOfWeek: [1, 2, 3, 4, 5], hour: 16, minute: 30, tz: 'America/New_York' }, () => {
    stopTrading();
});

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Trading Service Logic
const API_KEY = process.env.APCA_API_KEY_ID;
const SECRET_KEY = process.env.APCA_API_SECRET_KEY;
const BASE_URL = 'https://paper-api.alpaca.markets/v2';

// Fetch all tradable assets
const getTradableAssets = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/assets`, {
            headers: {
                'APCA-API-KEY-ID': API_KEY,
                'APCA-API-SECRET-KEY': SECRET_KEY,
            },
        });

        // Filter for only tradable stocks
        return response.data.filter(asset => asset.tradable && asset.class === 'us_equity');
    } catch (error) {
        console.error('Error fetching tradable assets:', error.message);
        throw error;
    }
};

// Calculate trading indicators
const calculateIndicators = async (symbol) => {
    try {
        const response = await axios.get(`${BASE_URL}/stocks/${symbol}/bars`, {
            headers: {
                'APCA-API-KEY-ID': API_KEY,
                'APCA-API-SECRET-KEY': SECRET_KEY,
            },
            params: {
                timeframe: '1Min',  // Intraday 1-minute data
                limit: 50,         // Fetch the last 50 bars
            },
        });

        const bars = response.data.bars;

        // Example: Calculate Simple Moving Average (SMA)
        const sma = bars
            .slice(-10) // Last 10 bars
            .reduce((sum, bar) => sum + bar.close, 0) / 10;

        // Example: Calculate Relative Strength Index (RSI)
        const gains = [];
        const losses = [];
        for (let i = 1; i < bars.length; i++) {
            const change = bars[i].close - bars[i - 1].close;
            if (change > 0) {
                gains.push(change);
            } else {
                losses.push(Math.abs(change));
            }
        }
        const avgGain = gains.reduce((sum, gain) => sum + gain, 0) / gains.length || 1;
        const avgLoss = losses.reduce((sum, loss) => sum + loss, 0) / losses.length || 1;
        const rs = avgGain / avgLoss;
        const rsi = 100 - (100 / (1 + rs));

        return { sma, rsi };
    } catch (error) {
        console.error(`Error calculating indicators for ${symbol}:`, error.message);
        throw error;
    }
};

// Place buy or sell orders
const placeOrder = async (symbol, qty, side) => {
    try {
        const response = await axios.post(`${BASE_URL}/orders`, {
            symbol,
            qty,
            side,        // "buy" or "sell"
            type: "market",
            time_in_force: "day"
        }, {
            headers: {
                'APCA-API-KEY-ID': API_KEY,
                'APCA-API-SECRET-KEY': SECRET_KEY,
            },
        });

        console.log(`${side.toUpperCase()} order placed for ${symbol}:`, response.data);
        return response.data;
    } catch (error) {
        console.error(`Error placing ${side} order for ${symbol}:`, error.message);
        throw error;
    }
};

// Fetch account data for profit and loss calculations
const getAccountData = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/account`, {
            headers: {
                'APCA-API-KEY-ID': API_KEY,
                'APCA-API-SECRET-KEY': SECRET_KEY,
            },
        });

        return response.data;
    } catch (error) {
        console.error('Error fetching account data:', error.message);
        throw error;
    }
};

module.exports = { getTradableAssets, calculateIndicators, placeOrder, getAccountData };
