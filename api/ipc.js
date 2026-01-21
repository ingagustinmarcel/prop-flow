export default async function handler(request, response) {
    const SERIES_ID = '148.3_INIVELGEN_D_A_0_26';
    const API_URL = `https://apis.datos.gob.ar/series/api/series?ids=${SERIES_ID}&limit=12&format=json`;

    try {
        const res = await fetch(API_URL);
        const data = await res.json();

        // Return JSON with CORS headers
        response.setHeader('Content-Type', 'application/json');
        response.setHeader('Access-Control-Allow-Origin', '*');
        response.status(200).json(data);
    } catch (error) {
        response.status(500).json({ error: 'Failed to fetch data' });
    }
}
