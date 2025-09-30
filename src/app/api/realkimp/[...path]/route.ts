
import { NextResponse } from "next/server";

const UPSTREAM = "https://realkimp.com/birdieswap";
const strip = (s: string) => s.replace(/^\/+|\/+$/g, "");

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);

  // '/api/realkimp/' 이후의 경로 부분을 직접 추출
  const base = "/api/realkimp/";
  const idx = url.pathname.indexOf(base);
  const tail = idx >= 0 ? url.pathname.slice(idx + base.length) : "";
  const endpoint = strip(tail);

  // 1) 1차 요청
  const u1 = new URL(`${UPSTREAM}/${endpoint}`);
  u1.search = url.search;

  let r = await fetch(u1.toString(), {
    method: "GET",
    cache: "no-store",
    redirect: "manual",           // 클라이언트에 3xx를 그대로 내보내지 않음
    headers: { accept: "application/json" },
  });

  // 2) 3xx면 서버에서 직접 따라가기 (https 강제 + 슬래시 정규화)
  if (r.status >= 300 && r.status < 400) {
    const loc = r.headers.get("location");
    if (loc) {
      const u2 = new URL(loc, UPSTREAM);    // 상대 경로 대비
      if (u2.protocol === "http:") u2.protocol = "https:";
      u2.pathname = strip(u2.pathname);
      r = await fetch(u2.toString(), {
        method: "GET",
        cache: "no-store",
        redirect: "follow",
        headers: { accept: "application/json" },
      });
    }
  }

  // 스트림 그대로 전달 + 원본 status/콘텐츠 타입 유지
  return new NextResponse(r.body, {
    status: r.status,
    headers: { "content-type": r.headers.get("content-type") ?? "application/json" },
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
