export const ACCESS_TOKEN_EXPIRY = '15m'
export const REFRESH_TOKEN_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000     // 30 days
export const FRONTEND_URL = process.env['FRONTEND_URL'] ?? 'http://localhost:4200'

export const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: false, // true in production (requires HTTPS)
  sameSite: 'lax' as const,
  path: '/api/auth',
  maxAge: REFRESH_TOKEN_EXPIRY_MS / 1000,
}