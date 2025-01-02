import React, { useEffect, useState } from 'react';
import './App.css';

function App() {
    const [profitLoss, setProfitLoss] = useState(0);

    // Fetch P&L from the backend
    const fetchProfitLoss = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/profit-loss');
            const data = await response.json();
            setProfitLoss(data.profitLoss);
        } catch (error) {
            console.error('Error fetching profit and loss:', error);
        }
    };

    // Update P&L every minute
    useEffect(() => {
        fetchProfitLoss(); // Initial fetch
        const interval = setInterval(() => {
            fetchProfitLoss();
        }, 60000); // 60,000ms = 1 minute

        return () => clearInterval(interval); // Cleanup interval on component unmount
    }, []);

    return (
        <div className="App">
            <header className="App-header">
                <h1>Trading Dashboard</h1>
                <h2>Profit and Loss</h2>
                <p style={{ color: profitLoss >= 0 ? 'green' : 'red' }}>
                    ${profitLoss.toFixed(2)}
                </p>
            </header>
        </div>
    );
}

export default App;
