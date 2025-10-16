
import { NextResponse, type NextRequest } from 'next/server'

function createNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  let s = ''; for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i])
  return btoa(s)
}

export function middleware(req: NextRequest) {
  const nonce = createNonce()

  // 요청 헤더에 nonce 전달 (layout.tsx에서 headers()로 읽음)
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

// ✅ 모든 경로에 명시적으로 적용 (정적 자원 제외 기본동작보다 확실)
export const config = {
  matcher: ['/:path*'],
}
