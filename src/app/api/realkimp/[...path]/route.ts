import { NextResponse } from "next/server";

const UPSTREAM = "https://realkimp.com/birdieswap";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ensureLeadingSlash = (s: string) => (s.startsWith("/") ? s : `/${s}`);

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

function copyHeaderIfPresent(dst: Headers, src: Headers, name: string) {
  const v = src.get(name);
  if (v) dst.set(name, v);
}

// 업스트림으로 넘길 요청 헤더 (필요한 것만 전달)
function buildUpstreamHeaders(req: Request, extra?: Record<string, string>) {
  const h = new Headers();

  // Accept/Content-Type
  copyHeaderIfPresent(h, req.headers, "accept");
  copyHeaderIfPresent(h, req.headers, "content-type");

  // Auth / Cookies
  copyHeaderIfPresent(h, req.headers, "authorization");
  copyHeaderIfPresent(h, req.headers, "cookie");

  // UA/Referer
  copyHeaderIfPresent(h, req.headers, "user-agent");
  copyHeaderIfPresent(h, req.headers, "referer");

  // X-Forwarded-* (Host/Proto/For)
  copyHeaderIfPresent(h, req.headers, "x-forwarded-for");
  h.set("x-forwarded-host", req.headers.get("x-forwarded-host") ?? (req.headers.get("host") ?? ""));
  copyHeaderIfPresent(h, req.headers, "x-forwarded-proto");

  // ❌ origin은 웬만하면 넘기지 않음(업스트림 CORS 트리거 방지)
  // 필요 시: h.set("origin", new URL(UPSTREAM).origin);

  if (extra) for (const [k, v] of Object.entries(extra)) h.set(k, v);
  return h;
}

// 클라이언트로 보낼 응답 헤더 (화이트리스트 패스스루)
function buildClientHeaders(upstream: Response, fallbackCT = "application/json") {
  const out = new Headers();

  // content-type 우선 설정
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
    "location", // 201/204에서 쓸 수 있음
    // CORS 관련 (프런트에서 직접 호출하는 경우)
    "access-control-allow-origin",
    "access-control-allow-credentials",
    "access-control-expose-headers",
  ];
  for (const k of pass) {
    const v = upstream.headers.get(k);
    if (v) out.set(k, v);
  }

  return out;
}

async function asUpstreamBody(req: Request): Promise<BodyInit | null> {
  // JSON/텍스트/폼/바이너리 모두 안전하게 전달
  const ab = await req.arrayBuffer();
  return ab.byteLength ? Buffer.from(ab) : null;
}

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

// 3xx를 수동으로 최대 3회까지 따라가며, 메서드/바디를 유지
async function followRedirectsPreservingMethod(
  first: Response,
  req: Request,
  method: "GET" | "POST",
  body: BodyInit | null,
  maxHops = 3
) {
  let r = first;
  let hops = 0;
  while (r.status >= 300 && r.status < 400 && hops < maxHops) {
    const loc = r.headers.get("location");
    if (!loc) break;
    const u = new URL(loc, UPSTREAM);
    if (u.protocol === "http:") u.protocol = "https:";
    u.pathname = ensureLeadingSlash(u.pathname.replace(/^\/+/, "")); // 앞쪽만 정리

    r = await fetch(u.toString(), {
      method,
      cache: "no-store",
      redirect: "manual", // 계속 수동
      headers: buildUpstreamHeaders(req),
      body: method === "POST" ? body : null,
    });
    hops++;
  }
  return r;
}

export async function GET(req: Request) {
  const u1 = buildUpstreamUrl(req);

  let r = await fetch(u1.toString(), {
    method: "GET",
    cache: "no-store",
    redirect: "manual",
    headers: buildUpstreamHeaders(req),
  });

  r = await followRedirectsPreservingMethod(r, req, "GET", null);

  const early = await dumpIfNotOk(r, "GET");
  if (early) return early;

  return new NextResponse(r.body, {
    status: r.status,
    headers: buildClientHeaders(r),
  });
}

export async function POST(req: Request) {
  console.log("[proxy] HIT POST", new Date().toISOString());
  const u1 = buildUpstreamUrl(req);
  const bodyBuf = await asUpstreamBody(req); // ✅ 바이너리/폼 등 안전

  let r = await fetch(u1.toString(), {
    method: "POST",
    cache: "no-store",
    redirect: "manual",
    headers: buildUpstreamHeaders(req),
    body: bodyBuf,
  });

  r = await followRedirectsPreservingMethod(r, req, "POST", bodyBuf);

  console.log("[proxy] POST upstream:", u1.toString());
  console.log("[proxy] req cookie:", req.headers.get("cookie") || "(none)");
  console.log("[proxy] body length:", bodyBuf ? (bodyBuf as Buffer).length : 0);
  console.log("[proxy] upstream status:", r.status);
  console.log("[proxy] upstream set-cookie:", r.headers.get("set-cookie"));

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
