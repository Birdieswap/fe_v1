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
    "img-src 'self' data: https:",
    `script-src 'self' 'nonce-${nonce}' https:`,
    "style-src 'self' 'unsafe-inline' https:",
    "font-src 'self' https:",
    "connect-src 'self' https:",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "form-action 'self'",
  ].join("; ");

  const res = NextResponse.next({ request: { headers: requestHeaders } });
  res.headers.set("Content-Security-Policy", csp);
  res.headers.set("x-csp-debug", `nonce:${nonce}`); // 확인 끝나면 삭제해도 됨
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  return res;
}

export const config = { matcher: ["/:path*"] };
