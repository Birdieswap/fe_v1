// middleware.ts
import { NextResponse, type NextRequest } from 'next/server'

// btoa를 이용해 16바이트 랜덤값을 base64로 변환 (Edge Runtime 호환)
function createNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary) // base64 문자열
}

export function middleware(req: NextRequest) {
  const nonce = createNonce()

  // ❗ 요청 헤더에 nonce를 주입해야 App Router에서 headers()로 읽을 수 있음
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-csp-nonce', nonce)

  // 최소 안전 CSP (script는 nonce 방식 / style은 초기엔 unsafe-inline 유지)
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
  // HSTS/Permissions-Policy 등은 next.config.mjs에서 공통 적용(중복 피하기)

  return res
}

// (선택) 특정 경로 제외/포함하고 싶으면 matcher 사용 가능
// export const config = { matcher: '/:path*' }
