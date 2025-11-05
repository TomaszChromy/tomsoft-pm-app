/**
 * Security headers configuration and middleware
 */

export interface SecurityHeadersConfig {
  contentSecurityPolicy?: string | boolean
  strictTransportSecurity?: string | boolean
  xFrameOptions?: string | boolean
  xContentTypeOptions?: boolean
  referrerPolicy?: string | boolean
  permissionsPolicy?: string | boolean
  crossOriginEmbedderPolicy?: string | boolean
  crossOriginOpenerPolicy?: string | boolean
  crossOriginResourcePolicy?: string | boolean
}

export const DEFAULT_SECURITY_HEADERS: SecurityHeadersConfig = {
  // Content Security Policy
  contentSecurityPolicy: [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Allow inline scripts for Next.js
    "style-src 'self' 'unsafe-inline'", // Allow inline styles
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https:",
    "media-src 'self'",
    "object-src 'none'",
    "child-src 'self'",
    "worker-src 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
    "manifest-src 'self'",
  ].join('; '),

  // HTTP Strict Transport Security
  strictTransportSecurity: 'max-age=31536000; includeSubDomains; preload',

  // X-Frame-Options
  xFrameOptions: 'DENY',

  // X-Content-Type-Options
  xContentTypeOptions: true,

  // Referrer Policy
  referrerPolicy: 'strict-origin-when-cross-origin',

  // Permissions Policy
  permissionsPolicy: [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'interest-cohort=()',
    'payment=()',
    'usb=()',
  ].join(', '),

  // Cross-Origin Embedder Policy
  crossOriginEmbedderPolicy: 'require-corp',

  // Cross-Origin Opener Policy
  crossOriginOpenerPolicy: 'same-origin',

  // Cross-Origin Resource Policy
  crossOriginResourcePolicy: 'same-origin',
}

export const DEVELOPMENT_SECURITY_HEADERS: SecurityHeadersConfig = {
  // More relaxed CSP for development
  contentSecurityPolicy: [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' localhost:* 127.0.0.1:*",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: localhost:* 127.0.0.1:*",
    "font-src 'self' data:",
    "connect-src 'self' https: ws: wss: localhost:* 127.0.0.1:*",
    "media-src 'self'",
    "object-src 'none'",
    "child-src 'self'",
    "worker-src 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
    "manifest-src 'self'",
  ].join('; '),

  strictTransportSecurity: false, // Disable HSTS in development
  xFrameOptions: 'SAMEORIGIN', // More relaxed for development
  xContentTypeOptions: true,
  referrerPolicy: 'strict-origin-when-cross-origin',
  permissionsPolicy: false, // Disable in development
  crossOriginEmbedderPolicy: false, // Disable in development
  crossOriginOpenerPolicy: false, // Disable in development
  crossOriginResourcePolicy: false, // Disable in development
}

/**
 * Apply security headers to a response
 */
export function applySecurityHeaders(
  response: Response,
  config: SecurityHeadersConfig = DEFAULT_SECURITY_HEADERS
): Response {
  const headers = new Headers(response.headers)

  // Content Security Policy
  if (config.contentSecurityPolicy) {
    if (typeof config.contentSecurityPolicy === 'string') {
      headers.set('Content-Security-Policy', config.contentSecurityPolicy)
    }
  }

  // HTTP Strict Transport Security
  if (config.strictTransportSecurity) {
    if (typeof config.strictTransportSecurity === 'string') {
      headers.set('Strict-Transport-Security', config.strictTransportSecurity)
    }
  }

  // X-Frame-Options
  if (config.xFrameOptions) {
    if (typeof config.xFrameOptions === 'string') {
      headers.set('X-Frame-Options', config.xFrameOptions)
    }
  }

  // X-Content-Type-Options
  if (config.xContentTypeOptions) {
    headers.set('X-Content-Type-Options', 'nosniff')
  }

  // Referrer Policy
  if (config.referrerPolicy) {
    if (typeof config.referrerPolicy === 'string') {
      headers.set('Referrer-Policy', config.referrerPolicy)
    }
  }

  // Permissions Policy
  if (config.permissionsPolicy) {
    if (typeof config.permissionsPolicy === 'string') {
      headers.set('Permissions-Policy', config.permissionsPolicy)
    }
  }

  // Cross-Origin Embedder Policy
  if (config.crossOriginEmbedderPolicy) {
    if (typeof config.crossOriginEmbedderPolicy === 'string') {
      headers.set('Cross-Origin-Embedder-Policy', config.crossOriginEmbedderPolicy)
    }
  }

  // Cross-Origin Opener Policy
  if (config.crossOriginOpenerPolicy) {
    if (typeof config.crossOriginOpenerPolicy === 'string') {
      headers.set('Cross-Origin-Opener-Policy', config.crossOriginOpenerPolicy)
    }
  }

  // Cross-Origin Resource Policy
  if (config.crossOriginResourcePolicy) {
    if (typeof config.crossOriginResourcePolicy === 'string') {
      headers.set('Cross-Origin-Resource-Policy', config.crossOriginResourcePolicy)
    }
  }

  // Additional security headers
  headers.set('X-DNS-Prefetch-Control', 'off')
  headers.set('X-Download-Options', 'noopen')
  headers.set('X-Permitted-Cross-Domain-Policies', 'none')

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

/**
 * Create security headers middleware
 */
export function createSecurityHeadersMiddleware(config?: SecurityHeadersConfig) {
  const isDevelopment = process.env.NODE_ENV === 'development'
  const defaultConfig = isDevelopment ? DEVELOPMENT_SECURITY_HEADERS : DEFAULT_SECURITY_HEADERS
  const finalConfig = { ...defaultConfig, ...config }

  return (response: Response): Response => {
    return applySecurityHeaders(response, finalConfig)
  }
}

/**
 * Security headers for API routes
 */
export function addApiSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers)

  // API-specific security headers
  headers.set('X-Content-Type-Options', 'nosniff')
  headers.set('X-Frame-Options', 'DENY')
  headers.set('X-DNS-Prefetch-Control', 'off')
  headers.set('Referrer-Policy', 'no-referrer')
  
  // CORS headers (adjust as needed)
  headers.set('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGINS || 'http://localhost:3002')
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  headers.set('Access-Control-Max-Age', '86400')

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

/**
 * Validate and sanitize CSP directives
 */
export function validateCSP(csp: string): boolean {
  // Basic CSP validation
  const validDirectives = [
    'default-src', 'script-src', 'style-src', 'img-src', 'font-src',
    'connect-src', 'media-src', 'object-src', 'child-src', 'worker-src',
    'frame-ancestors', 'form-action', 'base-uri', 'manifest-src',
    'plugin-types', 'sandbox', 'report-uri', 'report-to'
  ]

  const directives = csp.split(';').map(d => d.trim())
  
  for (const directive of directives) {
    if (!directive) continue
    
    const [name] = directive.split(' ')
    if (!validDirectives.includes(name)) {
      return false
    }
  }

  return true
}

/**
 * Generate nonce for CSP
 */
export function generateNonce(): string {
  const crypto = require('crypto')
  return crypto.randomBytes(16).toString('base64')
}

/**
 * Create CSP with nonce
 */
export function createCSPWithNonce(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https:",
    "media-src 'self'",
    "object-src 'none'",
    "child-src 'self'",
    "worker-src 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
    "manifest-src 'self'",
  ].join('; ')
}
