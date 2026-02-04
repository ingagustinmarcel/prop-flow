import { createRateLimiter, sendRateLimitError } from './middleware/rate-limiter.js';
import { applySecurityHeaders, applyCorsHeaders } from './middleware/security-headers.js';

// Rate limiter: 100 requests per 15 minutes
const rateLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    maxRequests: 100,
});

const ALLOWED_ORIGINS = [
    'https://prop-flow-eosin.vercel.app',
    'http://localhost:5173',
];

export default async function handler(request, response) {
    // Apply security headers
    applySecurityHeaders(response);

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
        applyCorsHeaders(request, response, ALLOWED_ORIGINS);
        return response.status(200).end();
    }

    // Only allow GET requests
    if (request.method !== 'GET') {
        return response.status(405).json({ error: 'Method not allowed' });
    }

    // Apply rate limiting
    const rateLimitResult = rateLimiter(request);
    Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
        response.setHeader(key, value);
    });

    if (rateLimitResult.isLimited) {
        return sendRateLimitError(response, rateLimitResult);
    }

    // Apply CORS headers
    applyCorsHeaders(request, response, ALLOWED_ORIGINS);

    const SERIES_ID = '148.3_INIVELGEN_D_A_0_26';
    const API_URL = `https://apis.datos.gob.ar/series/api/series?ids=${SERIES_ID}&limit=12&format=json`;

    try {
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

        const res = await fetch(API_URL, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Prop-flow/1.0',
            },
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
            throw new Error(`API returned status ${res.status}`);
        }

        const data = await res.json();

        // Set cache headers (cache for 1 hour)
        response.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');

        return response.status(200).json(data);
    } catch (error) {
        console.error('IPC API Error:', error.message);

        // Don't expose internal error details
        if (error.name === 'AbortError') {
            return response.status(504).json({ error: 'Request timeout' });
        }

        return response.status(500).json({ error: 'Failed to fetch data' });
    }
}
