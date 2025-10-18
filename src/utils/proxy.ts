export function buildUpstreamHeaders(req: Request) {
  const h = new Headers();
  // 필수
  h.set("accept", req.headers.get("accept") ?? "application/json, */*;q=0.1");
  // 권한/세션
  const auth = req.headers.get("authorization");
  if (auth) h.set("authorization", auth);
  const cookie = req.headers.get("cookie");
  if (cookie) h.set("cookie", cookie);
  // 디버깅/분석에 유용
  const ua = req.headers.get("user-agent");
  if (ua) h.set("user-agent", ua);
  const al = req.headers.get("accept-language");
  if (al) h.set("accept-language", al);
  const ref = req.headers.get("referer");
  if (ref) h.set("referer", ref);
  // origin은 CORS를 태울 수 있어 기본 미전달(필요할 때만)
  return h;
}

export function pickProxyResponseHeaders(up: Response): Headers {
  const out = new Headers();
  // 중요한 것들만 선별 복사 (원하면 더 추가)
  for (const k of [
    "content-type",
    "content-encoding",
    "cache-control",
    "etag",
    "last-modified",
    "vary",
  ]) {
    const v = up.headers.get(k);
    if (v) out.set(k, v);
  }
  // Set-Cookie 다중 헤더 보존
  up.headers.forEach((v, k) => {
    if (k.toLowerCase() === "set-cookie") out.append("set-cookie", v);
  });
  return out;
}
