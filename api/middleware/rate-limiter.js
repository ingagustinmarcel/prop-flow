// Simple in-memory rate limiter for Vercel serverless functions
// For production with multiple instances, consider using Redis or Vercel KV

const rateLimitStore = new Map();

// Clean up old entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, data] of rateLimitStore.entries()) {
        if (now - data.resetTime > 0) {
            rateLimitStore.delete(key);
        }
    }
}, 5 * 60 * 1000);

/**
 * Rate limiter middleware
 * @param {Object} options - Configuration options
 * @param {number} options.windowMs - Time window in milliseconds (default: 15 minutes)
 * @param {number} options.maxRequests - Maximum requests per window (default: 100)
 * @returns {Function} Middleware function
 */
export function createRateLimiter(options = {}) {
    const windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutes
    const maxRequests = options.maxRequests || 100;

    return function rateLimiter(request) {
        // Get client identifier (IP address or forwarded IP)
        const clientIp =
            request.headers['x-forwarded-for']?.split(',')[0].trim() ||
            request.headers['x-real-ip'] ||
            'unknown';

        const now = Date.now();
        const key = `${clientIp}`;

        // Get or create rate limit data for this client
        let rateLimitData = rateLimitStore.get(key);

        if (!rateLimitData || now > rateLimitData.resetTime) {
            // Create new window
            rateLimitData = {
                count: 0,
                resetTime: now + windowMs,
            };
            rateLimitStore.set(key, rateLimitData);
        }

        // Increment request count
        rateLimitData.count++;

        // Check if limit exceeded
        const isLimited = rateLimitData.count > maxRequests;
        const remaining = Math.max(0, maxRequests - rateLimitData.count);
        const resetTime = Math.ceil((rateLimitData.resetTime - now) / 1000);

        return {
            isLimited,
            remaining,
            resetTime,
            headers: {
                'X-RateLimit-Limit': maxRequests.toString(),
                'X-RateLimit-Remaining': remaining.toString(),
                'X-RateLimit-Reset': resetTime.toString(),
            },
        };
    };
}

/**
 * Send rate limit error response
 * @param {Object} response - Vercel response object
 * @param {Object} rateLimitResult - Result from rate limiter
 */
export function sendRateLimitError(response, rateLimitResult) {
    // Set rate limit headers
    Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
        response.setHeader(key, value);
    });

    response.setHeader('Retry-After', rateLimitResult.resetTime.toString());

    return response.status(429).json({
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Try again in ${rateLimitResult.resetTime} seconds.`,
        retryAfter: rateLimitResult.resetTime,
    });
}
