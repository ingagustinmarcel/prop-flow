/**
 * Security headers middleware for API endpoints
 * Adds common security headers to protect against various attacks
 */
export function applySecurityHeaders(response) {
    // Prevent MIME type sniffing
    response.setHeader('X-Content-Type-Options', 'nosniff');

    // Prevent clickjacking
    response.setHeader('X-Frame-Options', 'DENY');

    // Enable XSS protection (legacy browsers)
    response.setHeader('X-XSS-Protection', '1; mode=block');

    // Control referrer information
    response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Restrict browser features
    response.setHeader(
        'Permissions-Policy',
        'camera=(), microphone=(), geolocation=(), interest-cohort=()'
    );

    // Prevent caching of sensitive data (can be overridden per endpoint)
    response.setHeader('Cache-Control', 'no-store, max-age=0');

    return response;
}

/**
 * Apply CORS headers with strict origin checking
 * @param {Object} request - Vercel request object
 * @param {Object} response - Vercel response object
 * @param {Array<string>} allowedOrigins - List of allowed origins
 */
export function applyCorsHeaders(request, response, allowedOrigins) {
    const origin = request.headers.origin;

    if (allowedOrigins.includes(origin)) {
        response.setHeader('Access-Control-Allow-Origin', origin);
        response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        response.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
    }

    return response;
}
