import { NextResponse, type NextRequest } from "next/server";

// 모든 경로에 적용 (원래값 유지)
export const config = { matcher: ["/:path*"] };

export function middleware(req: NextRequest) {
  const isDev = process.env.NODE_ENV !== "production";
  const nonce = "dev-nonce"; // dev에서도 혹시 쓰는 곳 있으면 호환용

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-csp-nonce", nonce);

  const res = NextResponse.next({ request: { headers: requestHeaders } });

  if (isDev) {
    // ─────────────────────────────────────────────────────────────
    // ✅ 테스트(개발) 환경: 모든 보안 헤더 완전히 제거
    //    - CSP 미설정
    //    - Report-Only도 미설정
    //    - HSTS, X-Frame-Options, X-Content-Type-Options 등 미설정
    // ─────────────────────────────────────────────────────────────
    res.headers.delete("Content-Security-Policy");
    res.headers.delete("Content-Security-Policy-Report-Only");
    res.headers.delete("Strict-Transport-Security");
    res.headers.delete("X-Content-Type-Options");
    res.headers.delete("Referrer-Policy");
    res.headers.delete("X-Frame-Options");
    res.headers.delete("Permissions-Policy");
    res.headers.set("x-csp-debug", "disabled-in-dev");
    return res;
  }

  // ─────────────────────────────────────────────────────────────
  // ⛑ 운영 환경: 기존 보안 헤더 유지 (필요 시 아래 블록을 당신의 기존 값으로 교체)
  // ─────────────────────────────────────────────────────────────
  const scriptSrc = [
    "'self'",
    `'nonce-${crypto.randomUUID().replace(/-/g, "")}'`,
    "'strict-dynamic'",
  ].join(" ");
  const cspParts: string[] = [
    "default-src 'self'",
    "base-uri 'self'",
    "block-all-mixed-content",
    "upgrade-insecure-requests",
    "form-action 'self'",
    "frame-ancestors 'self'",
    "object-src 'none'",
    `script-src ${scriptSrc}`,
    `style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    `style-src-attr 'unsafe-inline'`,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    "font-src 'self' https://fonts.gstatic.com data:",
    // 필요 시 img-src/connect-src 등 추가
  ];
  const csp = cspParts.join("; ");

  res.headers.set("Content-Security-Policy", csp);
  res.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload"
  );
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("X-Frame-Options", "SAMEORIGIN");
  res.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  return res;
}
