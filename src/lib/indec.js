// Fetches from https://api.argly.com.ar/api/ipc/history (via Proxy)
const API_URL = '/api/ipc/history';

export const fetchIPCData = async () => {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Failed to fetch data');
        const json = await response.json();

        // Data format: { data: [ { anio: 2025, mes: 11, nombre_mes: "noviembre", valor: 2.5 }, ... ] }
        const rawList = json.data || [];

        // VALIDATION: Ensure we have enough history (e.g. at least 12 months)
        if (rawList.length < 12) {
            throw new Error("API returned insufficient history (" + rawList.length + " months)");
        }

        return rawList.map(item => {
            // date construction: YYYY-MM-DD
            // Pad month with 0 if needed
            const monthStr = item.mes.toString().padStart(2, '0');
            const dateStr = `${item.anio}-${monthStr}-01`;

            return {
                date: dateStr,
                value: item.valor / 100 // Convert Percentage to Decimal (2.5 -> 0.025)
            };
        }).sort((a, b) => new Date(b.date) - new Date(a.date));

    } catch (error) {
        console.warn("API Error, using user-provided fallback:", error);

        const officialData = [
            // 2025 (User Provided Data)
            { date: '2025-12-01', value: 0.028 },
            { date: '2025-11-01', value: 0.025 },
            { date: '2025-10-01', value: 0.023 },
            { date: '2025-09-01', value: 0.021 },
            { date: '2025-08-01', value: 0.019 },
            { date: '2025-07-01', value: 0.019 },
            { date: '2025-06-01', value: 0.016 },
            { date: '2025-05-01', value: 0.015 },
            { date: '2025-04-01', value: 0.028 },
            { date: '2025-03-01', value: 0.037 },
            { date: '2025-02-01', value: 0.024 },
            { date: '2025-01-01', value: 0.022 },

            // 2024 (Official)
            { date: '2024-12-01', value: 0.027 },
            { date: '2024-11-01', value: 0.024 },
            { date: '2024-10-01', value: 0.027 },
            { date: '2024-09-01', value: 0.035 },
            { date: '2024-08-01', value: 0.042 },
            { date: '2024-07-01', value: 0.040 },
            { date: '2024-06-01', value: 0.046 },
            { date: '2024-05-01', value: 0.042 },
            { date: '2024-04-01', value: 0.088 },
            { date: '2024-03-01', value: 0.110 },
            { date: '2024-02-01', value: 0.132 },
            { date: '2024-01-01', value: 0.206 },
        ];
        return officialData;
    }
};
