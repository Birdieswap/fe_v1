import { NextResponse, type NextRequest } from 'next/server'

function createNonce(): string {
  const b = crypto.getRandomValues(new Uint8Array(16))
  let s = ''; for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i])
  return btoa(s)
}

export function middleware(req: NextRequest) {
  const nonce = createNonce()

  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-csp-nonce', nonce)

  const csp = [
    "default-src 'self'",
    "base-uri 'self'",
    "img-src 'self' data: https:",
    `script-src 'self' 'nonce-${nonce}' https:`, 
    "style-src 'self' 'unsafe-inline' https:",
    "font-src 'self' https:",
    "connect-src 'self' https:",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "form-action 'self'",
  ].join('; ')

  const res = NextResponse.next({ request: { headers: requestHeaders } })
  res.headers.set('Content-Security-Policy', csp)
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  return res
}

export const config = { matcher: ['/:path*'] }
