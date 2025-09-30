// /app/api/realkimp/[...path]/route.ts
import { NextResponse } from "next/server";

const UPSTREAM = "https://realkimp.com/birdieswap";
const strip = (s: string) => s.replace(/^\/+|\/+$/g, "");
export const dynamic = "force-dynamic";

function buildUpstreamUrl(req: Request) {
  const url = new URL(req.url);
  const base = "/api/realkimp/";
  const idx = url.pathname.indexOf(base);
  const tail = idx >= 0 ? url.pathname.slice(idx + base.length) : "";
  const endpoint = strip(tail);
  const u = new URL(`${UPSTREAM}/${endpoint}`);
  u.search = url.search;
  return u;
}

// 공통: 요청 헤더 구성 (쿠키/UA/리퍼러 등 전달)
function buildUpstreamHeaders(req: Request, extra?: Record<string, string>) {
  const h = new Headers();
  h.set("accept", "application/json");
  const ct = req.headers.get("content-type");
  if (ct) h.set("content-type", ct);
  const cookie = req.headers.get("cookie");
  if (cookie) h.set("cookie", cookie);                 // ★ 쿠키 전달
  const ua = req.headers.get("user-agent");
  if (ua) h.set("user-agent", ua);
  const referer = req.headers.get("referer");
  if (referer) h.set("referer", referer);
  if (extra) for (const [k, v] of Object.entries(extra)) h.set(k, v);
  return h;
}

// 공통: 응답 헤더 구성 (set-cookie 포함 전달)
function buildClientHeaders(upstream: Response, fallbackCT = "application/json") {
  const out = new Headers();
  out.set("content-type", upstream.headers.get("content-type") ?? fallbackCT);
  // ★ 여러 개의 set-cookie 헤더를 그대로 전달
  upstream.headers.forEach((v, k) => {
    if (k.toLowerCase() === "set-cookie") {
      out.append("set-cookie", v);
    }
  });
  return out;
}

export async function GET(req: Request) {
  const u1 = buildUpstreamUrl(req);

  let r = await fetch(u1.toString(), {
    method: "GET",
    cache: "no-store",
    redirect: "manual",
    headers: buildUpstreamHeaders(req),
  });

  if (r.status >= 300 && r.status < 400) {
    const loc = r.headers.get("location");
    if (loc) {
      const u2 = new URL(loc, UPSTREAM);
      if (u2.protocol === "http:") u2.protocol = "https:";
      u2.pathname = strip(u2.pathname);
      r = await fetch(u2.toString(), {
        method: "GET",
        cache: "no-store",
        redirect: "follow",
        headers: buildUpstreamHeaders(req),
      });
    }
  }

  return new NextResponse(r.body, {
    status: r.status,
    headers: buildClientHeaders(r),
  });
}

export async function POST(req: Request) {
  console.log("[proxy] HIT POST", new Date().toISOString());
  const u1 = buildUpstreamUrl(req);
  const bodyText = await req.text();

  // 1차: 리다이렉트 수동 처리(POST→GET 변형 방지)
  let r = await fetch(u1.toString(), {
    method: "POST",
    cache: "no-store",
    redirect: "manual",
    headers: buildUpstreamHeaders(req),
    body: bodyText,
  });

  if (r.status >= 300 && r.status < 400) {
    const loc = r.headers.get("location");
    if (loc) {
      const u2 = new URL(loc, UPSTREAM);
      if (u2.protocol === "http:") u2.protocol = "https:";
      u2.pathname = strip(u2.pathname);
      // 2차: 같은 POST + 같은 바디로 재요청
      r = await fetch(u2.toString(), {
        method: "POST",
        cache: "no-store",
        redirect: "follow",
        headers: buildUpstreamHeaders(req),
        body: bodyText,
      });
    }
  }

  console.log("[proxy] POST upstream:", u1.toString());
  console.log("[proxy] req cookie:", req.headers.get("cookie") || "(none)");
  console.log("[proxy] body length:", bodyText.length);
  console.log("[proxy] upstream status:", r.status);
  console.log("[proxy] upstream set-cookie:", r.headers.get("set-cookie"));


  return new NextResponse(r.body, {
    status: r.status,
    headers: buildClientHeaders(r),
  });
}
