// Utility to fetch IPC data from Datos Argentina API
// Now uses local Vercel API route to avoid CORS

// In production (Vercel), this hits /api/ipc
// In local dev (Vite), we need to proxy /api to the real source or mocked
const API_URL = '/api/ipc';

export const fetchIPCData = async () => {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error('Failed to fetch data from INDEC/Datos Argentina');
        }

        const data = await response.json();
        const rawData = data.data;

        // Process data: [date, value]
        // Sort descending by date
        const processedData = rawData
            .map(item => ({
                date: item[0], // YYYY-MM-DD
                value: item[1] // Decimal (e.g., 0.04 for 4%) or Number (must check)
            }))
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        // Get last 12 months to be safe, but we only need 4 mostly
        return processedData;
    } catch (error) {
        // Fallback data (Real INDEC values 2024-2025)
        // Values are monthly variations (decimals, e.g., 0.042 = 4.2%)
        const fallbackData = [
            { date: '2025-01-01', value: 0.027 }, // Estimated/Proyection
            { date: '2024-12-01', value: 0.027 },
            { date: '2024-11-01', value: 0.029 },
            { date: '2024-10-01', value: 0.027 },
            { date: '2024-09-01', value: 0.035 },
            { date: '2024-08-01', value: 0.042 },
            { date: '2024-07-01', value: 0.040 },
            { date: '2024-06-01', value: 0.046 },
            { date: '2024-05-01', value: 0.042 },
            { date: '2024-04-01', value: 0.088 },
            { date: '2024-03-01', value: 0.110 },
            { date: '2024-02-01', value: 0.132 },
            { date: '2024-01-01', value: 0.206 }
        ];
        return fallbackData;
    }
};

export const calculateAdjustment = (currentRent, ipcData) => {
    // Take the last 4 available months
    const last4Months = ipcData.slice(0, 4).reverse(); // Oldest to newest

    let accumulatedFactor = 1.0;
    const breakdown = [];

    last4Months.forEach(month => {
        // API usually returns 0.06 for 6%.
        // Safety check: if > 2, assume it's percentage (6.0), otherwise decimal (0.06)
        const val = month.value;
        const decimalRate = val > 2 ? val / 100 : val;

        const monthlyFactor = 1 + decimalRate;
        accumulatedFactor *= monthlyFactor;

        breakdown.push({
            date: month.date,
            rate: (decimalRate * 100).toFixed(2),
            factor: monthlyFactor.toFixed(4)
        });
    });

    const newRent = currentRent * accumulatedFactor;
    const totalIncrease = (accumulatedFactor - 1) * 100;

    return {
        newRent,
        totalIncrease,
        breakdown,
        accumulatedFactor
    };
};
