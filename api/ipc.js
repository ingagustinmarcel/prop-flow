export default async function handler(request, response) {
    const SERIES_ID = '148.3_INIVELGEN_D_A_0_26';
    const API_URL = `https://apis.datos.gob.ar/series/api/series?ids=${SERIES_ID}&limit=12&format=json`;

    try {
        const res = await fetch(API_URL);
        const data = await res.json();

        // Return JSON with CORS headers
        // Return JSON with CORS headers (Restricted)
        const allowedOrigins = ['https://prop-flow-eosin.vercel.app', 'http://localhost:5173'];
        const origin = request.headers.origin;
        if (allowedOrigins.includes(origin)) {
            response.setHeader('Access-Control-Allow-Origin', origin);
        }
        response.status(200).json(data);
    } catch (error) {
        response.status(500).json({ error: 'Failed to fetch data' });
    }
}
