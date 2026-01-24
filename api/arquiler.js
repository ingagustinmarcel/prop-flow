export default async function handler(request, response) {
    const TARGET_URL = 'https://arquiler.com/';

    try {
        const res = await fetch(TARGET_URL);
        const html = await res.text();

        // Extract data-page attribute content
        // Regex to find: data-page="{...}"
        // It's usually encoded: data-page="{&quot;...}"
        const match = html.match(/data-page="([^"]+)"/);

        if (!match || !match[1]) {
            throw new Error('Could not find data-page attribute');
        }

        const rawData = match[1];
        // Decode HTML entities
        const decodedData = rawData.replace(/&quot;/g, '"');
        const json = JSON.parse(decodedData);

        // Extract relevant stats
        const stats = json.props?.stats || json.stats; // Structure might vary, based on reading it seems to be in props.stats or root stats?
        // In the chunk 4: props: { stats: { ... } } is not visible, wait.
        // Chunk 4: data-page="{&quot;component&quot;:&quot;welcome&quot;,&quot;props&quot;:{...,&quot;stats&quot;:{&quot;rates&quot;:{...}

        const rates = json.props?.stats?.rates;

        if (!rates) {
            throw new Error('Could not find rates in data');
        }

        // Return with CORS allowed for our app
        const allowedOrigins = ['https://prop-flow-eosin.vercel.app', 'http://localhost:5173'];
        const origin = request.headers.origin;
        if (allowedOrigins.includes(origin)) {
            response.setHeader('Access-Control-Allow-Origin', origin);
        }

        response.status(200).json(rates);
    } catch (error) {
        console.error('Scraping error:', error);
        response.status(500).json({ error: 'Failed to fetch arquiler data', details: error.message });
    }
}
