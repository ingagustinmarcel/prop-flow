import { createRateLimiter, sendRateLimitError } from './middleware/rate-limiter.js';
import { applySecurityHeaders, applyCorsHeaders } from './middleware/security-headers.js';

// Stricter rate limiting for web scraping: 30 requests per 15 minutes
const rateLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    maxRequests: 30,
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

    const TARGET_URL = 'https://arquiler.com/';

    try {
        // Create abort controller for timeout (longer for scraping)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

        const res = await fetch(TARGET_URL, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; Prop-flow/1.0)',
            },
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
            throw new Error(`Target site returned status ${res.status}`);
        }

        const html = await res.text();

        // Basic HTML length validation to detect anomalies
        if (html.length < 1000) {
            throw new Error('Response too short, possible error page');
        }

        // Extract data-page attribute content
        const match = html.match(/data-page="([^"]+)"/);

        if (!match || !match[1]) {
            throw new Error('Could not find data-page attribute');
        }

        const rawData = match[1];

        // Decode HTML entities
        const decodedData = rawData.replace(/&quot;/g, '"');

        // Parse JSON with error handling
        let json;
        try {
            json = JSON.parse(decodedData);
        } catch (parseError) {
            throw new Error('Failed to parse data-page JSON');
        }

        // Extract rates with validation
        const rates = json.props?.stats?.rates;

        if (!rates || typeof rates !== 'object') {
            throw new Error('Invalid rates data structure');
        }

        // Set cache headers (cache for 6 hours to reduce scraping frequency)
        response.setHeader('Cache-Control', 'public, max-age=21600, s-maxage=21600');

        return response.status(200).json(rates);
    } catch (error) {
        console.error('Arquiler scraping error:', error.message);

        // Don't expose internal error details
        if (error.name === 'AbortError') {
            return response.status(504).json({ error: 'Request timeout' });
        }

        return response.status(500).json({ error: 'Failed to fetch arquiler data' });
    }
}
