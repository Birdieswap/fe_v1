import { NextResponse, type NextRequest } from "next/server";

export const config = { matcher: ["/:path*"] };

export function middleware(req: NextRequest) {
  const isDev = process.env.NODE_ENV !== "production";
  const nonce = isDev ? "dev-nonce" : crypto.randomUUID().replace(/-/g, "");

  const CONNECT_DOMAINS: string[] = [
    // 자기 자신
    "'self'",
    // dev 전용
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
  ];

  const IMG_DOMAINS: string[] = [
    "images.ctfassets.net",
    "assets.coingecko.com",
    "ipfs.io",
    "cdn.rainbowkit.com",
    "raw.githubusercontent.com",
  ];

  // ─────────────────────────────────────────────────────────────
  // 스크립트: dev는 eval/inline 허용, prod는 nonce 기반
  // ─────────────────────────────────────────────────────────────
  const scriptSrc = isDev
    ? ["'self'", "'unsafe-eval'", "'unsafe-inline'"].join(" ")
    : ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'"].join(" ");

  // ─────────────────────────────────────────────────────────────
  // 스타일: elem/attr 분리
  //   - attr: 지갑 모달 등에서 style 속성 사용 → unsafe-inline 허용 (현실적 해결책)
  //   - elem: Next/RainbowKit이 만드는 <style> 태그는 nonce가 없으므로
  //           prod에서도 unsafe-inline 허용(대신 'self'로 출처 제한)
  //      * nonce를 모든 <style>에 주입할 수 있다면 elem을 'nonce'로 바꿔도 됨
  // ─────────────────────────────────────────────────────────────
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

    // 기존 style-src는 제거하고 elem/attr로 분리
    `style-src-elem ${styleSrcElem}`,
    `style-src-attr ${styleSrcAttr}`,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,

    // 글꼴/이미지
    "font-src 'self' https://fonts.gstatic.com data:",
    // 지갑 QR / 캔버스 등에서 blob: 이미지가 나올 수 있어 blob: 허용
    `img-src 'self' data: blob: https: ${IMG_DOMAINS.join(" ")}`,

    // 지갑/WalletConnect가 iframe을 띄울 수 있어 frame-src 추가
    "frame-src 'self' https://*.walletconnect.com https://verify.walletconnect.com https://*.coinbase.com",

    // HMR / 소켓 / RPC 등
    `connect-src 'self' ws: wss: https: ${CONNECT_DOMAINS.join(" ")}`,
  ];

  const csp = cspParts.join("; ");

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-csp-nonce", nonce);

  const res = NextResponse.next({ request: { headers: requestHeaders } });
  res.headers.set("Content-Security-Policy", csp);
  if (isDev) res.headers.set("x-csp-debug", `nonce:${nonce}`);

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
