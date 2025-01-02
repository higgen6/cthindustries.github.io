const express = require('express');
const { getTradableAssets, calculateIndicators, placeOrder, getAccountData } = require('../services/tradingServices');

const router = express.Router();

// Route: Fetch tradable assets
router.get('/assets', async (req, res) => {
    try {
        const assets = await getTradableAssets();
        res.status(200).json(assets);
    } catch (error) {
        console.error('Error fetching assets:', error.message);
        res.status(500).json({ error: 'Failed to fetch assets.' });
    }
});

// Route: Trigger trading logic
router.get('/trade', async (req, res) => {
    try {
        const assets = await getTradableAssets();

        for (const asset of assets) {
            const { sma, rsi } = await calculateIndicators(asset.symbol);

            // Example buy/sell logic
            if (asset.last_trade_price < sma && rsi < 30) {
                await placeOrder(asset.symbol, 1, 'buy');
            } else if (asset.last_trade_price > sma && rsi > 70) {
                await placeOrder(asset.symbol, 1, 'sell');
            }
        }

        res.status(200).send('Trading logic executed.');
    } catch (error) {
        console.error('Error executing trading logic:', error.message);
        res.status(500).json({ error: 'Failed to execute trading logic.' });
    }
});

// Route: Fetch Profit and Loss (P&L)
router.get('/profit-loss', async (req, res) => {
    try {
        const accountData = await getAccountData();
        const profitLoss = accountData.equity - accountData.cash; // Equity minus starting cash

        res.status(200).json({ profitLoss });
    } catch (error) {
        console.error('Error fetching profit and loss:', error.message);
        res.status(500).json({ error: 'Failed to fetch profit and loss.' });
    }
});

module.exports = router;
