// middleware.ts
import { NextResponse, type NextRequest } from "next/server";

export const config = { matcher: ["/:path*"] };

export function middleware(req: NextRequest) {
  const isProd = process.env.NODE_ENV === "production";
  const isDemo = (process.env.NEXT_PUBLIC_DEMO_UNSAFE ?? "") === "1";
  const nonce = isProd ? crypto.randomUUID().replace(/-/g, "") : "dev-nonce";

  const res = NextResponse.next({
    request: { headers: new Headers(req.headers) },
  });

  // 🔥 DEMO/DEV: 보안 해제 (가장 확실)
  if (!isProd || isDemo) {
    res.headers.delete("Content-Security-Policy");
    res.headers.delete("Content-Security-Policy-Report-Only");
    // 또는 완전 해제가 부담되면 다음 한 줄로 충분히 풀립니다.
    // res.headers.set("Content-Security-Policy", "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; connect-src *; img-src * data: blob:; frame-src *; style-src * 'unsafe-inline'; script-src * 'unsafe-inline' 'unsafe-eval'");
    res.headers.delete("Strict-Transport-Security");
    res.headers.delete("X-Content-Type-Options");
    res.headers.delete("Referrer-Policy");
    res.headers.delete("X-Frame-Options");
    res.headers.delete("Permissions-Policy");
    res.headers.set("x-csp-debug", "disabled-for-demo");
    return res;
  }

  // ⛑ PROD (운영) — 기존 보안 유지 (필요시 아래를 당신 설정으로 교체)
  const scriptSrc = ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'"].join(
    " "
  );
  const csp = [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
    "object-src 'none'",
    `script-src ${scriptSrc}`,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    "style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "style-src-attr 'unsafe-inline'",
    "font-src 'self' https://fonts.gstatic.com data:",
    // 운영에 필요한 connect-src만 구체적으로 열어두세요
    `connect-src 'self' https: ws: wss:`,
    `img-src 'self' data: blob: https:`,
    `frame-src 'self' https:`,
    "upgrade-insecure-requests",
    "block-all-mixed-content",
  ].join("; ");

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
