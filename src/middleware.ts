// middleware.ts
import { NextResponse, type NextRequest } from "next/server";

export const config = { matcher: ["/:path*"] };

// ✅ 환경별 host 목록 (포트는 아래에서 제거해서 비교)
const LANDING_HOSTS = new Set([
  // prod
  "www.birdieswap.com",
  "birdieswap.com",
  // vercel preview/alias (원하는 경우만)
  "birdieswap-landing.vercel.app",
  // local
  "www.birdieswap.local",
]);

const APP_HOSTS = new Set([
  // prod
  "app.birdieswap.com",
  // vercel preview/alias (원하는 경우만)
  "birdieswap-dev.vercel.app",
  // local
  "app.birdieswap.local",
]);

// ✅ landing에서 app으로 보내고 싶은 path들(선택)
const APP_PATHS = new Set(["/swap", "/farm", "/docs", "/faq", "/pay"]);

// ✅ app 도메인 베이스 URL (landing에서 app으로 redirect할 때 사용)
const APP_ORIGIN =
  process.env.NEXT_PUBLIC_APP_URL || "https://app.birdieswap.com";
const LANDING_ORIGIN = process.env.NEXT_PUBLIC_LANDING_URL || "";

const CORS_ALLOW_ORIGINS = new Set(
  uniq([
    safeOrigin(APP_ORIGIN),
    safeOrigin(LANDING_ORIGIN),
    "https://app.birdieswap.com",
    "https://www.birdieswap.com",
    "https://birdieswap.com",
    "https://birdieswap-dev.vercel.app",
    "https://birdieswap-landing.vercel.app",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ]),
);
const PERMISSIONS_POLICY_APP =
  "camera=(self), microphone=(), geolocation=(), accelerometer=(), gyroscope=(), magnetometer=(), payment=(), usb=(), serial=(), display-capture=(), midi=()";
const PERMISSIONS_POLICY_LANDING =
  "camera=(), microphone=(), geolocation=(), accelerometer=(), gyroscope=(), magnetometer=(), payment=(), usb=(), serial=(), display-capture=(), midi=()";
const CSP_IMG_APP = ["'self'", "data:", "blob:", "https://coin-images.coingecko.com"];
const CSP_IMG_LANDING = ["'self'", "data:", "blob:"];
const CSP_CONNECT_APP = uniq([
  "'self'",
  "https://api.birdieswap.com",
  "https://api.coingecko.com",
  "https://pro-api.coingecko.com",
  "https://mainnet.infura.io",
  "https://sepolia.infura.io",
  "https://base-mainnet.infura.io",
  "https://mainnet.base.org",
  "https://sepolia.drpc.org",
  "https://sepolia-rpc.giwa.io",
  "https://sepolia-rpc-flashblocks.giwa.io",
  "https://arb1.arbitrum.io",
  "https://polygon-rpc.com",
  "https://rpc.scroll.io",
  "wss://wss-rpc.scroll.io",
  "https://relay.walletconnect.com",
  "wss://relay.walletconnect.com",
  "https://rpc.walletconnect.com",
  safeOrigin(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL_ALCHEMY),
  safeOrigin(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL_INFURA),
  safeOrigin(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL_CHAINSTACK),
  safeOrigin(process.env.NEXT_PUBLIC_BASE_RPC_URL_ALCHEMY),
  safeOrigin(process.env.NEXT_PUBLIC_BASE_RPC_URL_INFURA),
  safeOrigin(process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL_ALCHEMY),
  safeOrigin(process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL_INFURA),
  safeOrigin(process.env.NEXT_PUBLIC_OPTIMISM_RPC_URL_ALCHEMY),
  safeOrigin(process.env.NEXT_PUBLIC_OPTIMISM_RPC_URL_INFURA),
  safeOrigin(process.env.NEXT_PUBLIC_BSC_RPC_URL_ALCHEMY),
  safeOrigin(process.env.NEXT_PUBLIC_BSC_RPC_URL_INFURA),
  safeOrigin(process.env.NEXT_PUBLIC_POLYGON_RPC_URL_ALCHEMY),
  safeOrigin(process.env.NEXT_PUBLIC_POLYGON_RPC_URL_INFURA),
  safeOrigin(process.env.NEXT_PUBLIC_SCROLL_RPC_URL_ALCHEMY),
  safeOrigin(process.env.NEXT_PUBLIC_SCROLL_RPC_URL_INFURA),
  safeOrigin(process.env.NEXT_PUBLIC_GIWA_SEPOLIA_RPC_URL),
]);
const CSP_CONNECT_LANDING = uniq([
  "'self'",
  "https://www.birdieswap.com",
  "https://app.birdieswap.com",
  "https://birdieswap-dev.vercel.app",
  "https://birdieswap-landing.vercel.app",
  "https://script.google.com",
]);

function safeOrigin(url?: string) {
  if (!url) return "";
  try {
    return new URL(url).origin;
  } catch {
    return "";
  }
}

function uniq(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function appendVaryHeader(res: NextResponse, token: string) {
  const current = res.headers.get("Vary");
  if (!current) {
    res.headers.set("Vary", token);
    return;
  }
  const parts = current
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
  if (!parts.includes(token)) parts.push(token);
  res.headers.set("Vary", parts.join(", "));
}

function isStaticAssetPath(pathname: string) {
  return (
    pathname.startsWith("/_next/static") ||
    pathname === "/manifest.json" ||
    /\.(svg|png|jpg|jpeg|webp|gif|ico|css|js|map|wasm|woff|woff2|ttf|otf|eot)$/i.test(
      pathname,
    )
  );
}

function isDocumentLikePath(pathname: string) {
  if (pathname.startsWith("/api/")) return false;
  if (isStaticAssetPath(pathname)) return false;
  if (
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml"
  ) {
    return false;
  }
  return true;
}

function isCspPolicyPath(pathname: string) {
  return isDocumentLikePath(pathname);
}

function requestHost(req: NextRequest) {
  const rawHost = (req.headers.get("host") ?? "").toLowerCase();
  return rawHost.split(":")[0];
}

function applyCorsHeaders(res: NextResponse, req: NextRequest, pathname: string) {
  res.headers.delete("Access-Control-Allow-Origin");
  res.headers.delete("Access-Control-Allow-Methods");
  res.headers.delete("Access-Control-Allow-Headers");
  res.headers.delete("Access-Control-Allow-Credentials");
  res.headers.delete("Access-Control-Max-Age");

  if (!pathname.startsWith("/api/")) return;

  const origin = req.headers.get("origin") ?? "";
  if (origin && CORS_ALLOW_ORIGINS.has(origin)) {
    res.headers.set("Access-Control-Allow-Origin", origin);
    appendVaryHeader(res, "Origin");
    appendVaryHeader(res, "Access-Control-Request-Method");
    appendVaryHeader(res, "Access-Control-Request-Headers");
    res.headers.set("Access-Control-Allow-Credentials", "true");
    res.headers.set(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    );
    res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.headers.set("Access-Control-Max-Age", "600");
  }
}

function applyStaticAssetCors(res: NextResponse, req: NextRequest, pathname: string) {
  if (pathname.startsWith("/api/")) return;
  if (!isStaticAssetPath(pathname)) return;

  // 정적 자산의 과도한 '*' CORS를 제거하고 허용 origin만 반영
  res.headers.delete("Access-Control-Allow-Origin");
  res.headers.delete("Access-Control-Allow-Methods");
  res.headers.delete("Access-Control-Allow-Headers");
  res.headers.delete("Access-Control-Allow-Credentials");
  res.headers.delete("Access-Control-Max-Age");

  const origin = req.headers.get("origin") ?? "";
  if (origin && CORS_ALLOW_ORIGINS.has(origin)) {
    res.headers.set("Access-Control-Allow-Origin", origin);
    appendVaryHeader(res, "Origin");
  }
}

function applySecurityHeaders(
  res: NextResponse,
  req: NextRequest,
  pathname: string,
  isProd: boolean,
  isDemo: boolean,
  nonce: string,
) {
  applyCorsHeaders(res, req, pathname);
  applyStaticAssetCors(res, req, pathname);
  const isDocument = isDocumentLikePath(pathname);
  const isCspPath = isCspPolicyPath(pathname);
  const host = requestHost(req);
  const isLandingHost = LANDING_HOSTS.has(host);
  const isAppHost = APP_HOSTS.has(host);
  // app: 호환성 우선 (inline 일부 허용), directive 누락 없이 명시
  const enforceCspAppDocument = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    `script-src 'self' 'nonce-${nonce}' 'wasm-unsafe-eval'`,
    `script-src-elem 'self' 'nonce-${nonce}'`,
    "script-src-attr 'none'",
    `style-src 'self' 'nonce-${nonce}'`,
    `style-src-elem 'self' 'nonce-${nonce}'`,
    "style-src-attr 'unsafe-inline'",
    `img-src ${CSP_IMG_APP.join(" ")}`,
    "font-src 'self' data:",
    `connect-src ${CSP_CONNECT_APP.join(" ")}`,
    "child-src 'self'",
    "frame-src 'self'",
    "manifest-src 'self'",
    "media-src 'self' data: blob:",
    "worker-src 'self' blob:",
    "form-action 'self'",
    "upgrade-insecure-requests",
    "block-all-mixed-content",
  ].join("; ");
  // landing: app보다 더 엄격하게 운영
  const enforceCspLandingDocument = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    `script-src 'self' 'nonce-${nonce}'`,
    `script-src-elem 'self' 'nonce-${nonce}'`,
    "script-src-attr 'none'",
    `style-src 'self' 'nonce-${nonce}'`,
    `style-src-elem 'self' 'nonce-${nonce}'`,
    "style-src-attr 'none'",
    `img-src ${CSP_IMG_LANDING.join(" ")}`,
    "font-src 'self' data:",
    `connect-src ${CSP_CONNECT_LANDING.join(" ")}`,
    "child-src 'none'",
    "frame-src 'none'",
    "manifest-src 'self'",
    "media-src 'self' data: blob:",
    "worker-src 'self' blob:",
    "form-action 'self'",
    "upgrade-insecure-requests",
    "block-all-mixed-content",
  ].join("; ");

  if (!isProd || isDemo) {
    res.headers.delete("Content-Security-Policy");
    res.headers.delete("Content-Security-Policy-Report-Only");
    res.headers.delete("Strict-Transport-Security");
    res.headers.delete("X-Content-Type-Options");
    res.headers.delete("Referrer-Policy");
    res.headers.delete("X-Frame-Options");
    res.headers.delete("Permissions-Policy");
    res.headers.delete("Cross-Origin-Resource-Policy");
    res.headers.delete("Cross-Origin-Opener-Policy");
    res.headers.delete("Cross-Origin-Embedder-Policy");
    res.headers.set("x-csp-debug", "disabled-for-demo");
    return res;
  }

  res.headers.delete("Content-Security-Policy");
  if (isCspPath) {
    res.headers.set(
      "Content-Security-Policy",
      isLandingHost ? enforceCspLandingDocument : enforceCspAppDocument,
    );
    res.headers.delete("Content-Security-Policy-Report-Only");
  } else {
    res.headers.delete("Content-Security-Policy-Report-Only");
    if (pathname.startsWith("/api/")) {
      // API 응답은 렌더링 목적이 아니므로 최소 CSP로 명시 차단
      res.headers.set(
        "Content-Security-Policy",
        "default-src 'none'; base-uri 'none'; frame-ancestors 'none'; object-src 'none'; form-action 'none'",
      );
    } else if (pathname === "/manifest.json") {
      res.headers.set(
        "Content-Security-Policy",
        "default-src 'none'; base-uri 'none'; frame-ancestors 'none'; object-src 'none'; manifest-src 'self'",
      );
    } else if (pathname === "/robots.txt" || pathname === "/sitemap.xml") {
      // 텍스트 리소스도 최소 CSP를 넣어 스캐너의 "header not set"을 줄인다.
      res.headers.set(
        "Content-Security-Policy",
        "default-src 'none'; base-uri 'none'; frame-ancestors 'none'; object-src 'none'",
      );
    }
  }

  res.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload",
  );
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Download-Options", "noopen");
  res.headers.set("X-DNS-Prefetch-Control", "off");
  res.headers.set("X-Permitted-Cross-Domain-Policies", "none");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  if (isCspPath) res.headers.set("X-Frame-Options", "SAMEORIGIN");
  else res.headers.set("X-Frame-Options", "DENY");
  if (isDocument) {
    res.headers.set("Origin-Agent-Cluster", "?1");
  } else {
    res.headers.delete("Origin-Agent-Cluster");
  }
  res.headers.set(
    "Permissions-Policy",
    isLandingHost ? PERMISSIONS_POLICY_LANDING : PERMISSIONS_POLICY_APP,
  );
  if (isDocument) {
    res.headers.set("Cross-Origin-Resource-Policy", "same-origin");
  } else if (pathname === "/manifest.json") {
    res.headers.set("Cross-Origin-Resource-Policy", "same-origin");
  } else if (isStaticAssetPath(pathname)) {
    // 정적 자산은 동일 사이트(app/landing) 범위만 공유
    res.headers.set("Cross-Origin-Resource-Policy", "same-site");
  } else if (pathname.startsWith("/api/")) {
    res.headers.set("Cross-Origin-Resource-Policy", "same-origin");
  } else {
    res.headers.delete("Cross-Origin-Resource-Policy");
  }
  if (isDocument) {
    // landing은 stronger isolation, app은 지갑 팝업 호환 유지
    res.headers.set(
      "Cross-Origin-Opener-Policy",
      isLandingHost ? "same-origin" : "same-origin-allow-popups",
    );
  } else if (pathname === "/manifest.json") {
    res.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  } else {
    res.headers.delete("Cross-Origin-Opener-Policy");
  }
  if (isDocument && isLandingHost) {
    // landing은 app 대비 외부 의존이 적어 credentialless 적용이 비교적 안전
    res.headers.set("Cross-Origin-Embedder-Policy", "credentialless");
    res.headers.delete("Cross-Origin-Embedder-Policy-Report-Only");
  } else if (pathname === "/manifest.json") {
    res.headers.set("Cross-Origin-Embedder-Policy", "credentialless");
    res.headers.delete("Cross-Origin-Embedder-Policy-Report-Only");
  } else {
    res.headers.delete("Cross-Origin-Embedder-Policy");
    if (isDocument) {
      // app은 호환성 검증을 위해 관측 모드로만 먼저 적용
      res.headers.set("Cross-Origin-Embedder-Policy-Report-Only", "credentialless");
      if (!isLandingHost) {
        // app은 지갑 팝업 호환을 유지하면서도 stronger COOP 목표를 관측
        res.headers.set("Cross-Origin-Opener-Policy-Report-Only", "same-origin");
      } else {
        res.headers.delete("Cross-Origin-Opener-Policy-Report-Only");
      }
    } else {
      res.headers.delete("Cross-Origin-Embedder-Policy-Report-Only");
      res.headers.delete("Cross-Origin-Opener-Policy-Report-Only");
    }
  }
  if (pathname.startsWith("/api/birdieswap/")) {
    // 지갑/트랜잭션 민감 API는 공유 캐시를 피한다.
    res.headers.set("Cache-Control", "private, no-store, max-age=0");
    res.headers.set("Pragma", "no-cache");
    res.headers.set("Expires", "0");
  } else if (isDocument && isAppHost) {
    // app 문서는 개인 상태(지갑/포인트/트랜잭션)와 결합되므로 보수적으로 캐시 금지
    res.headers.set("Cache-Control", "private, no-store, max-age=0");
    res.headers.set("Pragma", "no-cache");
    res.headers.set("Expires", "0");
  }
  res.headers.set(
    "x-csp-debug",
    isCspPath ? "enforce-relaxed-and-report-phase-3" : "no-document-csp",
  );

  return res;
}

export function middleware(req: NextRequest) {
  // host는 dev에서 "www.birdieswap.local:3000" 형태라 포트 제거 필요
  const rawHost = (req.headers.get("host") ?? "").toLowerCase();
  const host = rawHost.split(":")[0]; // ✅ 포트 제거
  const pathname = req.nextUrl.pathname;
  const secFetchSite = (req.headers.get("sec-fetch-site") || "").toLowerCase();
  const origin = req.headers.get("origin") || "";

  const isProd = process.env.NODE_ENV === "production";
  const isDemo = (process.env.NEXT_PUBLIC_DEMO_UNSAFE ?? "") === "1";
  const isDevLike = !isProd || isDemo;

  const isPassthroughPath =
    pathname.startsWith("/apr") ||
    pathname === "/apr_data.json" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    /\.(svg|png|jpg|jpeg|webp|gif|ico|css|js|map|wasm)$/.test(pathname);

  // 민감 프록시 API는 cross-site 요청을 선제 차단한다.
  // same-origin/same-site/none(주소창 직접 접근) 또는 헤더 미존재만 허용.
  if (
    pathname.startsWith("/api/birdieswap/") &&
    req.method !== "OPTIONS" &&
    secFetchSite === "cross-site"
  ) {
    return new NextResponse(
      JSON.stringify({ ok: false, error: "blocked_by_fetch_metadata" }),
      {
        status: 403,
        headers: {
          "content-type": "application/json; charset=utf-8",
          "cache-control": "no-store, max-age=0",
          pragma: "no-cache",
          "x-content-type-options": "nosniff",
        },
      },
    );
  }

  // Origin이 존재하는 민감 API 요청은 allowlist origin만 허용.
  if (
    pathname.startsWith("/api/birdieswap/") &&
    req.method !== "OPTIONS" &&
    origin &&
    !CORS_ALLOW_ORIGINS.has(origin)
  ) {
    return new NextResponse(
      JSON.stringify({ ok: false, error: "blocked_by_origin_policy" }),
      {
        status: 403,
        headers: {
          "content-type": "application/json; charset=utf-8",
          "cache-control": "no-store, max-age=0",
          pragma: "no-cache",
          "x-content-type-options": "nosniff",
        },
      },
    );
  }

  // CORS preflight는 여기서 즉시 응답해 정책을 일관 적용
  if (pathname.startsWith("/api/") && req.method === "OPTIONS") {
    const preflight = new NextResponse(null, { status: 204 });
    applyCorsHeaders(preflight, req, pathname);
    return preflight;
  }

  // dev에서는 HMR/asset/api 요청에는 절대 개입하지 않고,
  // landing/app 도메인 라우팅만 유지한다.
  if (isDevLike) {
    if (isPassthroughPath) {
      return NextResponse.next();
    }

    if (LANDING_HOSTS.has(host)) {
      if (APP_PATHS.has(pathname)) {
        return NextResponse.redirect(`${APP_ORIGIN}${pathname}`);
      }
      const url = req.nextUrl.clone();
      url.pathname = "/landing";
      return NextResponse.rewrite(url);
    }

    return NextResponse.next();
  }

  const nonce = isProd ? crypto.randomUUID().replace(/-/g, "") : "dev-nonce";

  const reqHeaders = new Headers(req.headers);
  reqHeaders.set("x-csp-nonce", nonce);
  reqHeaders.set("x-nonce", nonce);

  // next/api/static 등은 rewrite는 건드리지 않기 (헤더는 공통 적용)
  if (isPassthroughPath) {
    const passthrough = NextResponse.next({ request: { headers: reqHeaders } });
    return applySecurityHeaders(
      passthrough,
      req,
      pathname,
      isProd,
      isDemo,
      nonce,
    );
  }

  // ✅ 1) 라우팅 응답 결정 (next or rewrite/redirect)
  let res: NextResponse;

  if (LANDING_HOSTS.has(host)) {
    // landing 호스트에서 app 관련 경로로 직접 들어오면 app으로 보내기(선택)
    if (APP_PATHS.has(pathname)) {
      const redirectRes = NextResponse.redirect(`${APP_ORIGIN}${pathname}`);
      return applySecurityHeaders(
        redirectRes,
        req,
        pathname,
        isProd,
        isDemo,
        nonce,
      );
    }

    // landing 호스트는 항상 landing 페이지로 rewrite (주소창 유지)
    // ⚠️ (landing) route group 이름으로는 rewrite 못함 → 실제 경로 /landing 필요
    const url = req.nextUrl.clone();
    url.pathname = "/landing"; // ✅ src/app/**landing**/page.tsx가 있어야 함
    res = NextResponse.rewrite(url, { request: { headers: reqHeaders } });
  } else if (APP_HOSTS.has(host)) {
    // app 호스트는 기존 라우트 그대로
    res = NextResponse.next({ request: { headers: reqHeaders } });
  } else {
    // 기타 호스트(로컬에서 그냥 localhost:3000로 접속한 경우 등)는 app로 취급
    res = NextResponse.next({ request: { headers: reqHeaders } });
  }

  return applySecurityHeaders(res, req, pathname, isProd, isDemo, nonce);
}
