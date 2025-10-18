import { NextResponse, type NextRequest } from "next/server";

function createNonce(): string {
  return crypto.randomUUID().replace(/-/g, "");
}

export function middleware(req: NextRequest) {
  const IMG_DOMAINS: string[] = [
    // 예: 외부 이미지/CDN이 실제로 필요할 때만 추가
    // "images.unsplash.com",
    // "cdn.yourcdn.com",
  ];

  const CONNECT_DOMAINS: string[] = [
    // 예: API, 분석, RPC, WebSocket 등 실제 호출하는 대상만 추가
    // "api.yourdomain.com",
    // "analytics.vercel-insights.com",
    // "sepolia.infura.io",
  ];

  const nonce = createNonce();

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-csp-nonce", nonce);

  const cspParts: string[] = [
    "default-src 'self'",
    "base-uri 'self'",
    "block-all-mixed-content",
    "form-action 'self'",
    "frame-ancestors 'self'", // X-Frame-Options: SAMEORIGIN과 일치
    "object-src 'none'",
    `script-src 'self' 'nonce-${nonce}'`,
    `style-src 'self' 'nonce-${nonce}' https://fonts.googleapis.com`,
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: " + IMG_DOMAINS.join(" ") + ";",
    "connect-src 'self' " + CONNECT_DOMAINS.join(" ") + ";",
    // 필요시: "upgrade-insecure-requests"
  ];

  const csp = cspParts.join("; ");

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
