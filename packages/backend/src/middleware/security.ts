import { MiddlewareHandler } from 'hono';

/**
 * Security headers middleware for production
 * Adds security-related HTTP headers to responses
 */
export const securityHeaders: MiddlewareHandler = async (c, next) => {
  await next();

  // Apply stricter headers in production
  if (process.env.NODE_ENV === 'production') {
    // HSTS - Tell browsers to only use HTTPS for 1 year
    c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

    // Prevent MIME type sniffing
    c.header('X-Content-Type-Options', 'nosniff');

    // Prevent clickjacking
    c.header('X-Frame-Options', 'DENY');

    // XSS protection (legacy but still useful)
    c.header('X-XSS-Protection', '1; mode=block');

    // Control referrer information
    c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  }

  // Permissions policy - restrict browser features
  // Allow notifications only from same origin
  c.header(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), notifications=(self)'
  );

  // Content Security Policy (basic)
  // In production, you should customize this based on your needs
  if (process.env.NODE_ENV === 'production') {
    c.header(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none';"
    );
  }
};
