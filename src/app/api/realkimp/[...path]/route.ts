// app/api/realkimp/[...path]/route.ts (예시 경로)
// 또는 app/api/realkimp/route.ts (프로젝트 구조에 맞게)

import { NextResponse } from "next/server";

const UPSTREAM = "https://realkimp.com/birdieswap";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ensureLeadingSlash = (s: string) => (s.startsWith("/") ? s : `/${s}`);

/** 요청 URL → 업스트림 URL로 변환 */
function buildUpstreamUrl(req: Request) {
  const url = new URL(req.url);
  const base = "/api/realkimp/";
  const idx = url.pathname.indexOf(base);
  const tail = idx >= 0 ? url.pathname.slice(idx + base.length) : "";
  const endpoint = ensureLeadingSlash(tail.replace(/^\/+/, "")); // 앞쪽만 정리
  const u = new URL(`${UPSTREAM}${endpoint}`);
  u.search = url.search;
  return u;
}

/** 선택 헤더 복사 헬퍼 */
function copyHeaderIfPresent(dst: Headers, src: Headers, name: string) {
  const v = src.get(name);
  if (v) dst.set(name, v);
}

/** 업스트림으로 넘길 요청 헤더 구성 */
function buildUpstreamHeaders(req: Request, extra?: Record<string, string>) {
  const h = new Headers();

  // Accept/Language
  h.set("accept", req.headers.get("accept") ?? "application/json, */*;q=0.1");
  copyHeaderIfPresent(h, req.headers, "accept-language");

  // Content-Type
  copyHeaderIfPresent(h, req.headers, "content-type");

  // Auth / Cookies
  copyHeaderIfPresent(h, req.headers, "authorization");
  copyHeaderIfPresent(h, req.headers, "cookie");

  // UA/Referer
  copyHeaderIfPresent(h, req.headers, "user-agent");
  copyHeaderIfPresent(h, req.headers, "referer");

  // X-Forwarded-*
  copyHeaderIfPresent(h, req.headers, "x-forwarded-for");
  h.set("x-forwarded-host", req.headers.get("x-forwarded-host") ?? (req.headers.get("host") ?? ""));
  copyHeaderIfPresent(h, req.headers, "x-forwarded-proto");
  // 일부 백엔드는 x-real-ip를 사용
  copyHeaderIfPresent(h, req.headers, "x-real-ip");

  // origin은 기본적으로 넘기지 않음(CORS 오동작 예방)
  // 필요 시: h.set("origin", new URL(UPSTREAM).origin);

  if (extra) for (const [k, v] of Object.entries(extra)) h.set(k, v);
  return h;
}

/** 클라이언트로 보낼 응답 헤더 구성 (화이트리스트 패스스루) */
function buildClientHeaders(upstream: Response, fallbackCT = "application/json") {
  const out = new Headers();

  // content-type 우선
  out.set("content-type", upstream.headers.get("content-type") ?? fallbackCT);

  // 여러 set-cookie를 그대로 전달
  upstream.headers.forEach((v, k) => {
    if (k.toLowerCase() === "set-cookie") out.append("set-cookie", v);
  });

  // 추가로 유용한 헤더들 전달
  const pass = [
    "cache-control",
    "content-disposition",
    "content-language",
    "etag",
    "last-modified",
    "vary",
    "location", // 201/204 등
    // CORS 관련(업스트림이 내려주면 그대로 패스)
    "access-control-allow-origin",
    "access-control-allow-credentials",
    "access-control-expose-headers",
    "access-control-allow-methods",
    "access-control-allow-headers",
    "access-control-max-age",
  ];
  for (const k of pass) {
    const v = upstream.headers.get(k);
    if (v) out.set(k, v);
  }

  return out;
}

/** Request 본문을 업스트림에 안전하게 전달 (JSON/폼/바이너리 모두) */
async function asUpstreamBody(req: Request): Promise<BodyInit | null> {
  const ab = await req.arrayBuffer();
  if (!ab.byteLength) return null;
  return new Uint8Array(ab); // Buffer 대신 Uint8Array로 안전
}

/** 업스트림 오류 시 본문 일부를 로깅하고 그대로 전달 */
async function dumpIfNotOk(r: Response, label: string) {
  if (!r.ok) {
    const text = await r.text().catch(() => "");
    console.error(`[proxy] ${label} upstream not ok:`, r.status, text.slice(0, 500));
    return new NextResponse(text || "upstream error", {
      status: r.status,
      headers: { "content-type": r.headers.get("content-type") ?? "text/plain" },
    });
  }
  return null;
}

/** 응답에서 Set-Cookie 모두 수집 */
function collectSetCookies(resp: Response): string[] {
  const cookies: string[] = [];
  resp.headers.forEach((v, k) => {
    if (k.toLowerCase() === "set-cookie") {
      cookies.push(v);
    }
  });
  return cookies;
}

/** 기존 Cookie 헤더와 새 Set-Cookie들을 병합 → Cookie 헤더 문자열 생성 */
function mergeCookies(existingCookieHeader: string | null | undefined, newSetCookies: string[]): string {
  const jar: Record<string, string> = {};
  const addCookie = (pair: string) => {
    const idx = pair.indexOf("=");
    if (idx > 0) {
      const k = pair.slice(0, idx).trim();
      const rest = pair.slice(idx + 1);
      const v = rest.split(";")[0].trim();
      if (k) jar[k] = v;
    }
  };

  if (existingCookieHeader) {
    existingCookieHeader.split(";").forEach(s => {
      const p = s.trim();
      if (!p) return;
      addCookie(p);
    });
  }
  for (const sc of newSetCookies) {
    const firstSemicolon = sc.indexOf(";");
    const first = firstSemicolon > 0 ? sc.slice(0, firstSemicolon) : sc;
    addCookie(first.trim());
  }

  return Object.entries(jar).map(([k, v]) => `${k}=${v}`).join("; ");
}

/** 3xx 수동 추적: 메서드/바디 유지 + Set-Cookie → 다음 요청 Cookie 전파 */
async function followRedirectsPreservingMethod(
  first: Response,
  req: Request,
  method: "GET" | "POST",
  body: BodyInit | null,
  maxHops = 3
) {
  let r = first;
  let hops = 0;
  let carryCookie = req.headers.get("cookie") || undefined;

  while (r.status >= 300 && r.status < 400 && hops < maxHops) {
    const loc = r.headers.get("location");
    if (!loc) break;

    // 1) Set-Cookie 수집 → 다음 요청 Cookie에 병합
    const setCookies = collectSetCookies(r);
    if (setCookies.length) {
      carryCookie = mergeCookies(carryCookie, setCookies);
    }

    // 2) 다음 URL
    const u = new URL(loc, UPSTREAM);
    if (u.protocol === "http:") u.protocol = "https:";
    if (!u.pathname.startsWith("/")) u.pathname = `/${u.pathname}`; // 뒤 슬래시는 건드리지 않음

    // 3) 헤더 구성 + 쿠키 주입
    const headers = buildUpstreamHeaders(req);
    if (carryCookie) headers.set("cookie", carryCookie);

    // 4) 다음 hop
    r = await fetch(u.toString(), {
      method,
      cache: "no-store",
      redirect: "manual",
      headers,
      body: method === "POST" ? body : null,
    });

    hops++;
  }
  return r;
}

/** 디버깅 편의용: 헤더 로그 */
function logHeaders(prefix: string, h: Headers) {
  const all: Record<string, string> = {};
  h.forEach((v, k) => { all[k] = v; });
  console.log(prefix, JSON.stringify(all, null, 2));
}

/** CORS 프리플라이트 */
export async function OPTIONS(req: Request) {
  const headers = new Headers({
    "access-control-allow-origin": req.headers.get("origin") || "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": req.headers.get("access-control-request-headers") || "content-type,authorization",
    "access-control-allow-credentials": "true",
    "access-control-max-age": "600",
  });
  return new NextResponse(null, { status: 204, headers });
}

/** GET 프록시 */
export async function GET(req: Request) {
  const u1 = buildUpstreamUrl(req);

  let r = await fetch(u1.toString(), {
    method: "GET",
    cache: "no-store",
    redirect: "manual",
    headers: buildUpstreamHeaders(req),
  });

  // 리다이렉트 수동 추적(메서드 유지)
  r = await followRedirectsPreservingMethod(r, req, "GET", null);

  const early = await dumpIfNotOk(r, "GET");
  if (early) return early;

  return new NextResponse(r.body, {
    status: r.status,
    headers: buildClientHeaders(r),
  });
}

/** POST 프록시 */
export async function POST(req: Request) {
  const u1 = buildUpstreamUrl(req);
  const bodyBuf = await asUpstreamBody(req); // 바이너리/폼/JSON 모두 안전

  console.log("[proxy] POST →", u1.toString());
  logHeaders("[proxy] req headers", req.headers);

  // 1차 요청
  let r = await fetch(u1.toString(), {
    method: "POST",
    cache: "no-store",
    redirect: "manual",
    headers: buildUpstreamHeaders(req),
    body: bodyBuf,
  });

  console.log("[proxy] hop0 status", r.status);
  logHeaders("[proxy] hop0 resp headers", r.headers);

  // 리다이렉트 수동 추적(메서드/바디 유지 + 쿠키 전파)
  r = await followRedirectsPreservingMethod(r, req, "POST", bodyBuf);

  console.log("[proxy] final status", r.status);
  logHeaders("[proxy] final resp headers", r.headers);

  const early = await dumpIfNotOk(r, "POST");
  if (early) return early;

  return new NextResponse(r.body, {
    status: r.status,
    headers: buildClientHeaders(r),
  });
}



// import { NextResponse } from "next/server";

// const UPSTREAM = "https://realkimp.com/birdieswap";
// const strip = (s: string) => s.replace(/^\/+|\/+$/g, "");
// export const dynamic = "force-dynamic";
// export const runtime = "nodejs";

// function buildUpstreamUrl(req: Request) {
//   const url = new URL(req.url);
//   const base = "/api/realkimp/";
//   const idx = url.pathname.indexOf(base);
//   const tail = idx >= 0 ? url.pathname.slice(idx + base.length) : "";
//   const endpoint = strip(tail);

//   const u = new URL(`${UPSTREAM}/${endpoint}`);
//   u.search = url.search;
//   return u;
// }

// // 공통: 요청 헤더 구성 (쿠키/UA/리퍼러 등 전달)
// function buildUpstreamHeaders(req: Request, extra?: Record<string, string>) {
//   const h = new Headers();
//   h.set("accept", "application/json");

//   // 원 요청 헤더들 반영
//   const ct = req.headers.get("content-type");
//   if (ct) h.set("content-type", ct);

//   const cookie = req.headers.get("cookie");
//   if (cookie) h.set("cookie", cookie);

//   const ua = req.headers.get("user-agent");
//   if (ua) h.set("user-agent", ua);

//   const referer = req.headers.get("referer");
//   if (referer) h.set("referer", referer);

//   // ★ upstream이 도메인/클라이언트 판단 시 쓰는 헤더들 추가
//   const origin = req.headers.get("origin");
//   if (origin) h.set("origin", origin);

//   const xff = req.headers.get("x-forwarded-for");
//   if (xff) h.set("x-forwarded-for", xff);

//   const xfhost = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
//   if (xfhost) h.set("x-forwarded-host", xfhost);

//   const xfproto = req.headers.get("x-forwarded-proto");
//   if (xfproto) h.set("x-forwarded-proto", xfproto);

//   if (extra) for (const [k, v] of Object.entries(extra)) h.set(k, v);
//   return h;
// }

// // 공통: 응답 헤더 구성 (set-cookie 포함 전달)
// function buildClientHeaders(upstream: Response, fallbackCT = "application/json") {
//   const out = new Headers();
//   out.set("content-type", upstream.headers.get("content-type") ?? fallbackCT);
//   // ★ 여러 개의 set-cookie 헤더를 그대로 전달
//   upstream.headers.forEach((v, k) => {
//     if (k.toLowerCase() === "set-cookie") {
//       out.append("set-cookie", v);
//     }
//   });
//   return out;
// }

// async function dumpIfNotOk(r: Response, label: string) {
//   if (!r.ok) {
//     const text = await r.text().catch(() => "");
//     console.error(`[proxy] ${label} upstream not ok:`, r.status, text.slice(0, 500));
//     // 에러 페이지가 HTML이면 그대로 전달해 주면 클라가 JSON 파싱을 시도하지 않게 됨
//     return new NextResponse(text || "upstream error", {
//       status: r.status,
//       headers: { "content-type": r.headers.get("content-type") ?? "text/plain" },
//     });
//   }
//   return null;
// }

// export async function GET(req: Request) {
//   const u1 = buildUpstreamUrl(req);

//   let r = await fetch(u1.toString(), {
//     method: "GET",
//     cache: "no-store",
//     redirect: "manual",
//     headers: buildUpstreamHeaders(req),
//   });

//   if (r.status >= 300 && r.status < 400) {
//     const loc = r.headers.get("location");
//     if (loc) {
//       const u2 = new URL(loc, UPSTREAM);
//       if (u2.protocol === "http:") u2.protocol = "https:";
//       u2.pathname = strip(u2.pathname);
//       r = await fetch(u2.toString(), {
//         method: "GET",
//         cache: "no-store",
//         redirect: "follow",
//         headers: buildUpstreamHeaders(req),
//       });
//     }
//   }

//   const early = await dumpIfNotOk(r, "GET");
//   if (early) return early;

//   return new NextResponse(r.body, {
//     status: r.status,
//     headers: buildClientHeaders(r),
//   });
// }

// export async function POST(req: Request) {
//   console.log("[proxy] HIT POST", new Date().toISOString());
//   const u1 = buildUpstreamUrl(req);
//   const bodyText = await req.text();

//   // 1차: 리다이렉트 수동 처리(POST→GET 변형 방지)
//   let r = await fetch(u1.toString(), {
//     method: "POST",
//     cache: "no-store",
//     redirect: "manual",
//     headers: buildUpstreamHeaders(req),
//     body: bodyText,
//   });

//   if (r.status >= 300 && r.status < 400) {
//     const loc = r.headers.get("location");
//     if (loc) {
//       const u2 = new URL(loc, UPSTREAM);
//       if (u2.protocol === "http:") u2.protocol = "https:";
//       u2.pathname = strip(u2.pathname);
//       // 2차: 같은 POST + 같은 바디로 재요청
//       r = await fetch(u2.toString(), {
//         method: "POST",
//         cache: "no-store",
//         redirect: "follow",
//         headers: buildUpstreamHeaders(req),
//         body: bodyText,
//       });
//     }
//   }

//   console.log("[proxy] POST upstream:", u1.toString());
//   console.log("[proxy] req cookie:", req.headers.get("cookie") || "(none)");
//   console.log("[proxy] body length:", bodyText.length);
//   console.log("[proxy] upstream status:", r.status);
//   console.log("[proxy] upstream set-cookie:", r.headers.get("set-cookie"));

//   const early = await dumpIfNotOk(r, "POST");
//   if (early) return early;

//   return new NextResponse(r.body, {
//     status: r.status,
//     headers: buildClientHeaders(r),
//   });
// }
