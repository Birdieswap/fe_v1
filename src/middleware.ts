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

export function middleware(req: NextRequest) {
  // host는 dev에서 "www.birdieswap.local:3000" 형태라 포트 제거 필요
  const rawHost = (req.headers.get("host") ?? "").toLowerCase();
  const host = rawHost.split(":")[0]; // ✅ 포트 제거
  const pathname = req.nextUrl.pathname;

  const isProd = process.env.NODE_ENV === "production";
  const isDemo = (process.env.NEXT_PUBLIC_DEMO_UNSAFE ?? "") === "1";
  const nonce = isProd ? crypto.randomUUID().replace(/-/g, "") : "dev-nonce";

  // next/api/static 등은 건드리지 않기 (불필요한 rewrite 방지)
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    /\.(svg|png|jpg|jpeg|webp|gif|ico|css|js|map)$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  const reqHeaders = new Headers(req.headers);

  // ✅ 1) 라우팅 응답 결정 (next or rewrite/redirect)
  let res: NextResponse;

  if (LANDING_HOSTS.has(host)) {
    // landing 호스트에서 app 관련 경로로 직접 들어오면 app으로 보내기(선택)
    if (APP_PATHS.has(pathname)) {
      return NextResponse.redirect(`${APP_ORIGIN}${pathname}`);
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

  // 🔥 DEMO/DEV: 보안 해제 (네 기존 로직 유지)
  if (!isProd || isDemo) {
    res.headers.delete("Content-Security-Policy");
    res.headers.delete("Content-Security-Policy-Report-Only");
    res.headers.delete("Strict-Transport-Security");
    res.headers.delete("X-Content-Type-Options");
    res.headers.delete("Referrer-Policy");
    res.headers.delete("X-Frame-Options");
    res.headers.delete("Permissions-Policy");
    res.headers.set("x-csp-debug", "disabled-for-demo");
    return res;
  }

  // ⛑ PROD CSP (네 기존 로직 유지)
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
