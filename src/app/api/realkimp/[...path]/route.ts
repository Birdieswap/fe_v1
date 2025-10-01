
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

// function buildUpstreamHeaders(req: Request) {
//   const h = new Headers();

//   const copy = (name: string) => {
//     const v = req.headers.get(name);
//     if (v) h.set(name, v);
//   };

//   // 기본
//   h.set("accept", req.headers.get("accept") ?? "application/json, */*;q=0.1");
//   copy("accept-language");
//   copy("content-type");
//   copy("authorization");
//   copy("cookie");
//   copy("user-agent");
//   copy("referer");

//   // 프록시 정보
//   copy("x-forwarded-for");
//   h.set("x-forwarded-host", req.headers.get("x-forwarded-host") ?? (req.headers.get("host") ?? ""));
//   copy("x-forwarded-proto");
//   // 필요시: copy("x-real-ip");

//   // origin은 일부 백엔드의 CORS 로직을 괜히 태울 수 있어 기본 미전달
//   return h;
// }

// // 응답에서 모든 Set-Cookie 수집
// function collectSetCookies(resp: Response): string[] {
//   const out: string[] = [];
//   resp.headers.forEach((v, k) => {
//     if (k.toLowerCase() === "set-cookie") out.push(v);
//   });
//   return out;
// }

// // Set-Cookie(여러 개) → Cookie 헤더로 병합
// function mergeCookies(existingCookie: string | null | undefined, newSetCookies: string[]): string {
//   const jar: Record<string, string> = {};
//   const add = (pair: string) => {
//     const i = pair.indexOf("=");
//     if (i <= 0) return;
//     const k = pair.slice(0, i).trim();
//     const v = pair.slice(i + 1).split(";")[0].trim();
//     if (k) jar[k] = v;
//   };
//   if (existingCookie) {
//     existingCookie.split(";").forEach(s => {
//       const t = s.trim();
//       if (t) add(t);
//     });
//   }
//   for (const sc of newSetCookies) {
//     const j = sc.indexOf(";");
//     add((j > 0 ? sc.slice(0, j) : sc).trim());
//   }
//   return Object.entries(jar).map(([k, v]) => `${k}=${v}`).join("; ");
// }

// // 3xx를 수동으로 최대 3회 추적(메서드/바디 유지 + Set-Cookie→Cookie 전파)
// async function followRedirectsPreservingMethod(
//   first: Response,
//   req: Request,
//   method: "POST",
//   body: BodyInit | null,
//   maxHops = 3
// ) {
//   let r = first;
//   let hops = 0;
//   let carryCookie = req.headers.get("cookie") || undefined;

//   while (r.status >= 300 && r.status < 400 && hops < maxHops) {
//     const loc = r.headers.get("location");
//     if (!loc) break;

//     // 1) set-cookie → cookie 전파
//     const setCookies = collectSetCookies(r);
//     if (setCookies.length) carryCookie = mergeCookies(carryCookie, setCookies);

//     // 2) 다음 hop URL
//     const u = new URL(loc, UPSTREAM);
//     if (u.protocol === "http:") u.protocol = "https:";
//     // 뒤 슬래시는 건드리지 않음
//     if (!u.pathname.startsWith("/")) u.pathname = `/${u.pathname}`;

//     // 3) 헤더 구성 + 쿠키 주입
//     const headers = buildUpstreamHeaders(req);
//     if (carryCookie) headers.set("cookie", carryCookie);

//     // 4) 다음 요청(항상 같은 POST/바디로)
//     r = await fetch(u.toString(), {
//       method,
//       cache: "no-store",
//       redirect: "manual",
//       headers,
//       body,
//     });

//     hops++;
//   }
//   return r;
// }

// // 프리플라이트(브라우저가 POST 전에 OPTIONS 보낼 때)
// export async function OPTIONS(req: Request) {
//   const headers = new Headers({
//     "access-control-allow-origin": req.headers.get("origin") || "*",
//     "access-control-allow-methods": "GET,POST,OPTIONS",
//     "access-control-allow-headers":
//       req.headers.get("access-control-request-headers") || "content-type,authorization",
//     "access-control-allow-credentials": "true",
//     "access-control-max-age": "600",
//   });
//   return new NextResponse(null, { status: 204, headers });
// }

// // POST 프록시 (GET은 유지)
// export async function POST(req: Request) {
//   // 경로 구성(기존 GET 로직과 동일 규칙)
//   const url = new URL(req.url);
//   const base = "/api/realkimp/";
//   const idx = url.pathname.indexOf(base);
//   const tail = idx >= 0 ? url.pathname.slice(idx + base.length) : "";
//   const endpoint = strip(tail);
//   const u1 = new URL(`${UPSTREAM}/${endpoint}`);
//   u1.search = url.search;

//   // 본문: 어떤 타입이든 안전하게 전달
//   const ab = await req.arrayBuffer();
//   const bodyBuf: BodyInit | null = ab.byteLength ? new Uint8Array(ab) : null;

//   // 1차 요청: 리다이렉트 수동
//   let r = await fetch(u1.toString(), {
//     method: "POST",
//     cache: "no-store",
//     redirect: "manual",
//     headers: buildUpstreamHeaders(req),
//     body: bodyBuf,
//   });

//   // 리다이렉트 체인 수동 추적 (쿠키 전파 + POST 유지)
//   r = await followRedirectsPreservingMethod(r, req, "POST", bodyBuf);

//   // 에러면 본문 일부를 그대로 전달(클라가 JSON 파싱 강요 안 받도록)
//   if (!r.ok) {
//     const text = await r.text().catch(() => "");
//     console.error("[proxy] POST upstream not ok:", r.status, text.slice(0, 500));
//     return new NextResponse(text || "upstream error", {
//       status: r.status,
//       headers: { "content-type": r.headers.get("content-type") ?? "text/plain" },
//     });
//   }

//   // 성공: 원본 스트림/상태/콘텐츠 타입 유지
//   // (Set-Cookie 등은 fetch가 단일화할 수 있어 원본을 그대로 append 못할 때가 있지만,
//   //  최소 content-type은 유지)
//   const outHeaders = new Headers();
//   outHeaders.set("content-type", r.headers.get("content-type") ?? "application/json");
//   // 가능하면 set-cookie도 전달(단일 헤더로 올 수 있음)
//   r.headers.forEach((v, k) => {
//     if (k.toLowerCase() === "set-cookie") outHeaders.append("set-cookie", v);
//   });

//   return new NextResponse(r.body, {
//     status: r.status,
//     headers: outHeaders,
//   });
// }
