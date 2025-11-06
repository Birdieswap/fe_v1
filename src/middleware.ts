import { NextResponse, type NextRequest } from "next/server";

export const config = { matcher: ["/:path*"] };

export function middleware(req: NextRequest) {
  const isDev = process.env.NODE_ENV !== "production";
  const nonce = isDev ? "dev-nonce" : crypto.randomUUID().replace(/-/g, "");

  // ─────────────────────────────────────────────────────────────
  // COLS API 허용 도메인 추가 (★ 여기에 추가)
  // ─────────────────────────────────────────────────────────────
  const COLS_DOMAINS: string[] = [
    "https://birdieswap-dev.vercel.app/", // 예시: 실제 COLS API 도메인으로 교체
    "https://realkimp.com",
    "https://realkimp.io",
  ];

  const CONNECT_DOMAINS: string[] = [
    "'self'",
    ...(isDev ? ["http://localhost:3000"] : []),

    // RPC & L2
    "https://*.infura.io",
    "https://*.g.alchemy.com",
    "https://sepolia.drpc.org",
    "https://mainnet.base.org",
    "https://arb1.arbitrum.io",

    // 외부 API
    "https://api.coingecko.com",
    "https://cdn.rainbowkit.com",
    "https://raw.githubusercontent.com",

    // 지갑 관련
    "https://*.walletconnect.com",
    "https://pulse.walletconnect.org",
    "https://api.web3modal.org",
    "https://cca-lite.coinbase.com",

    // 프로젝트 API
    "https://realkimp.com",
    "https://realkimp.io",

    // ✅ COLS 관련 API 도메인 추가
    ...COLS_DOMAINS,
  ];

  const IMG_DOMAINS: string[] = [
    "images.ctfassets.net",
    "assets.coingecko.com",
    "ipfs.io",
    "cdn.rainbowkit.com",
    "raw.githubusercontent.com",
  ];

  // ─────────────────────────────────────────────────────────────
  // CSP 세부 정의
  // ─────────────────────────────────────────────────────────────
  const scriptSrc = isDev
    ? ["'self'", "'unsafe-eval'", "'unsafe-inline'"].join(" ")
    : ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'"].join(" ");

  const styleSrcElem = [
    "'self'",
    "'unsafe-inline'",
    "https://fonts.googleapis.com",
  ].join(" ");
  const styleSrcAttr = "'unsafe-inline'";

  const cspParts: string[] = [
    "default-src 'self'",
    "base-uri 'self'",
    "block-all-mixed-content",
    "upgrade-insecure-requests",
    "form-action 'self'",
    "frame-ancestors 'self'",
    "object-src 'none'",
    `script-src ${scriptSrc}`,
    `style-src-elem ${styleSrcElem}`,
    `style-src-attr ${styleSrcAttr}`,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    "font-src 'self' https://fonts.gstatic.com data:",
    `img-src 'self' data: blob: https: ${IMG_DOMAINS.join(" ")}`,
    "frame-src 'self' https://*.walletconnect.com https://verify.walletconnect.com https://*.coinbase.com",

    // ✅ 여기서 COLS 도메인이 허용되도록 추가됨
    `connect-src 'self' ws: wss: https: ${CONNECT_DOMAINS.join(" ")}`,
  ];

  const csp = cspParts.join("; ");

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-csp-nonce", nonce);

  const res = NextResponse.next({ request: { headers: requestHeaders } });
  res.headers.set("Content-Security-Policy", csp);
  if (isDev) res.headers.set("x-csp-debug", `nonce:${nonce}`);

  // ─────────────────────────────────────────────────────────────
  // 나머지 보안 헤더 (기존 유지)
  // ─────────────────────────────────────────────────────────────
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
