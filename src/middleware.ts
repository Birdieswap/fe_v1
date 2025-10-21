import { NextResponse, type NextRequest } from "next/server";

function createNonce(isDev: boolean): string {
  return isDev ? "dev-nonce" : crypto.randomUUID().replace(/-/g, "");
}

export const config = { matcher: ["/:path*"] };

export function middleware(req: NextRequest) {
  const isDev = process.env.NODE_ENV !== "production";
  const nonce = isDev ? "dev-nonce" : crypto.randomUUID().replace(/-/g, "");

  // 필요한 외부 연결들 (HTTP/WS) 을 이 리스트에 모아두세요.
  const CONNECT_DOMAINS: string[] = [
    // 기본 자기 자신 (항상 제일 앞)
    "'self'",
    "http://localhost:3000", // dev용
    "ws:", // HMR/지갑용 소켓 허용
    "wss:",

    // RPC & L2 체인들
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

    // 프로젝트 관련 API (커스텀)
    "https://realkimp.com",
    "https://realkimp.io",
    "https://api.web3modal.org",
    "https://cca-lite.coinbase.com",
  ];

  const IMG_DOMAINS: string[] = [
    "images.ctfassets.net",
    "assets.coingecko.com",
    "ipfs.io",
    "cdn.rainbowkit.com",
    "raw.githubusercontent.com",
  ];

  // 요청 헤더에 nonce 전달 (layout에서 읽어 next/script에 꽂아줌)
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-csp-nonce", nonce);

  // ─────────────────────────────────────────────────────────────
  // dev: HMR/React Refresh, 런타임 스타일 허용
  // prod: 엄격 (unsafe-* 제거, nonce 기반)
  // ─────────────────────────────────────────────────────────────
  // dev는 인라인 허용을 위해 nonce 뺀다
  const scriptSrc = isDev
    ? ["'self'", "'unsafe-eval'", "'unsafe-inline'"].join(" ")
    : ["'self'", `'nonce-${nonce}'`].join(" ");

  // style-src는 dev unsafe-inline, prod nonce
  const styleSrc = isDev
    ? ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"].join(" ")
    : ["'self'", `'nonce-${nonce}'`, "https://fonts.googleapis.com"].join(" ");

  const cspParts: string[] = [
    "default-src 'self'",
    "base-uri 'self'",
    "block-all-mixed-content",
    "form-action 'self'",
    "frame-ancestors 'self'",
    "object-src 'none'",
    `script-src ${scriptSrc}`,
    `style-src ${styleSrc}`,
    // style 속성 허용: dev에선 unsafe-inline, prod에선 속성 자체는 허용하되 값은 nonce/hash 기반이 아님
    isDev ? "style-src-attr 'self' 'unsafe-inline'" : "style-src-attr 'self'",
    // 필요하면 style 태그 전용도 분리:
    // isDev ? "style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com"
    //       : "style-src-elem 'self' 'nonce-" + nonce + "' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    `img-src 'self' data: ${IMG_DOMAINS.join(" ")}`,
    // websocket/HMR 등도 허용
    `connect-src 'self' ws: wss: ${CONNECT_DOMAINS.join(" ")}`,
    // "upgrade-insecure-requests", // 필요 시
  ];

  const csp = cspParts.join("; ");

  const res = NextResponse.next({ request: { headers: requestHeaders } });
  res.headers.set("Content-Security-Policy", csp);
  res.headers.set("x-csp-debug", `nonce:${nonce}`); // 개발 중 확인용(배포 전 제거 권장)

  // 기타 보안 헤더 (중복/충돌 주의: next.config.mjs와 한 곳에서만)
  res.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload"
  );
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("X-Frame-Options", "SAMEORIGIN"); // next.config에서 DENY로 또 넣지 않도록 한 곳만 유지
  res.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  return res;
}
