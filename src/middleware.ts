import { NextResponse, type NextRequest } from "next/server";

function createNonce(): string {
  return crypto.randomUUID().replace(/-/g, "");
}

export function middleware(req: NextRequest) {
  const nonce = createNonce();

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-csp-nonce", nonce);

  const csp = [
    "default-src 'self'",
    "base-uri 'self'",
    "block-all-mixed-content", // optional but useful
    "form-action 'self'",
    "frame-ancestors 'self'", // aligns with X-Frame-Options: SAMEORIGIN
    "object-src 'none'",
    "script-src 'self' 'nonce-" + nonce + "'", // allow inline scripts only via nonce
    `style-src 'self' 'nonce-${nonce}' https://fonts.googleapis.com`, // allow external styles from https
    "img-src 'self' data: https:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https:",
  ].join("; ");

  const res = NextResponse.next({ request: { headers: requestHeaders } });
  res.headers.set("Content-Security-Policy", csp);
  res.headers.set("x-csp-debug", `nonce:${nonce}`); // 확인 끝나면 삭제해도 됨
  //보안 헤더
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

export const config = { matcher: ["/:path*"] };
