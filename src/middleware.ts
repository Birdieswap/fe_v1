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
    /\.(svg|png|jpg|jpeg|webp|gif|ico|css|js|map|woff|woff2|ttf|otf|eot)$/i.test(
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

function applyCorsHeaders(res: NextResponse, req: NextRequest, pathname: string) {
  res.headers.delete("Access-Control-Allow-Origin");
  res.headers.delete("Access-Control-Allow-Methods");
  res.headers.delete("Access-Control-Allow-Headers");
  res.headers.delete("Access-Control-Allow-Credentials");

  if (!pathname.startsWith("/api/")) return;

  const origin = req.headers.get("origin") ?? "";
  if (origin && CORS_ALLOW_ORIGINS.has(origin)) {
    res.headers.set("Access-Control-Allow-Origin", origin);
    appendVaryHeader(res, "Origin");
    res.headers.set("Access-Control-Allow-Credentials", "true");
  }
  res.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
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
  const isDocument = isDocumentLikePath(pathname);

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
  if (isDocument) {
    // 1단계: 차단 없는 관측 모드(CSP Report-Only)
    res.headers.set(
      "Content-Security-Policy-Report-Only",
      [
        "default-src 'self' https: data: blob:",
        "base-uri 'self'",
        "object-src 'none'",
        "frame-ancestors 'none'",
        "script-src 'self' 'unsafe-eval' 'wasm-unsafe-eval' https:",
        "style-src 'self' 'unsafe-inline' https:",
        "img-src 'self' data: blob: https:",
        "font-src 'self' data: https:",
        "connect-src 'self' https: wss:",
        "frame-src 'self' https:",
        "worker-src 'self' blob:",
        "form-action 'self' https:",
      ].join("; "),
    );
  } else {
    res.headers.delete("Content-Security-Policy-Report-Only");
  }

  res.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload",
  );
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  if (isDocument) {
    res.headers.set("X-Frame-Options", "SAMEORIGIN");
  } else {
    res.headers.delete("X-Frame-Options");
  }
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (isDocument) {
    res.headers.set("Cross-Origin-Resource-Policy", "same-origin");
  } else if (isStaticAssetPath(pathname)) {
    // 정적 자산은 외부 임베딩 가능성을 남기기 위해 완화
    res.headers.set("Cross-Origin-Resource-Policy", "cross-origin");
  } else {
    res.headers.delete("Cross-Origin-Resource-Policy");
  }
  if (isDocument) {
    // 지갑 팝업 호환성을 위해 same-origin-allow-popups 사용
    res.headers.set("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  } else {
    res.headers.delete("Cross-Origin-Opener-Policy");
  }
  res.headers.delete("Cross-Origin-Embedder-Policy");
  res.headers.set("x-csp-debug", isDocument ? "report-only-phase-1" : "no-document-csp");

  return res;
}

export function middleware(req: NextRequest) {
  // host는 dev에서 "www.birdieswap.local:3000" 형태라 포트 제거 필요
  const rawHost = (req.headers.get("host") ?? "").toLowerCase();
  const host = rawHost.split(":")[0]; // ✅ 포트 제거
  const pathname = req.nextUrl.pathname;

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
    /\.(svg|png|jpg|jpeg|webp|gif|ico|css|js|map)$/.test(pathname);

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
