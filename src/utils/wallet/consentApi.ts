import type {
  CheckResponse,
  InitiateResponseWire,
  VerifyRequest,
  VerifyResponse,
} from "@/types/consent";

const BASE_GET_DEFAULT = "/api/realkimp/Consent";
// ✅ prod에서 env로 업스트림 고정하지 말고, 우선 프록시를 쓰자
const BASE_GET = (
  process.env.NEXT_PUBLIC_CONSENT_GET_BASE ?? BASE_GET_DEFAULT
).replace(/\/$/, "");

console.debug("[consentApi] BASE_GET =", BASE_GET);
// POST는 업스트림 직접 호출
const BASE_POST = "https://realkimp.com/birdieswap/Consent";

function absGet(path: string) {
  if (path.startsWith("http")) return path;
  return BASE_GET + path; // path는 /Check, /Initiate 등 슬래시 포함 기준
}

async function parseJsonSafe<T>(res: Response): Promise<T> {
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`BAD_JSON ${res.status} ${text.slice(0, 300)}`);
  }
}

export async function apiCheck(address: string): Promise<CheckResponse> {
  const url = new URL(
    absGet(`/Check/`),
    typeof window !== "undefined" ? window.location.origin : "http://localhost"
  );
  url.searchParams.set("address", address);
  url.searchParams.set("_ts", Date.now().toString()); // 캐시 버스터

  const res = await fetch(url.toString(), {
    method: "GET",
    credentials: "include", // 세션/쿠키 필요한 경우
    cache: "no-store", // Vercel/브라우저 캐시 회피
    headers: {
      Accept: "application/json",
    },
  }).catch((e) => {
    console.error("[consentApi] check network error", e);
    throw e;
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(
      "[consentApi] check failed",
      res.status,
      res.statusText,
      body.slice(0, 300)
    );
    throw new Error(`CHECK_${res.status}`);
  }
  return parseJsonSafe<CheckResponse>(res);
}

export async function apiInitiate(params: {
  address: string;
  chainId: number;
  type?: string; // default: "initialConsent"
}): Promise<InitiateResponseWire> {
  const url = new URL(
    absGet(`/Initiate/`),
    typeof window !== "undefined" ? window.location.origin : "http://localhost"
  );
  url.searchParams.set("address", params.address);
  url.searchParams.set("chainId", String(params.chainId));
  url.searchParams.set("type", params.type ?? "initialConsent");
  url.searchParams.set("_ts", Date.now().toString()); // 캐시 버스터

  const res = await fetch(url.toString(), {
    method: "GET",
    credentials: "include",
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  }).catch((e) => {
    console.error("[consentApi] initiate network error", e);
    throw e;
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(
      "[consentApi] initiate failed",
      res.status,
      res.statusText,
      body.slice(0, 300)
    );
    throw new Error(`INIT_${res.status}`);
  }
  return parseJsonSafe<InitiateResponseWire>(res);
}

export async function apiVerify(body: VerifyRequest): Promise<VerifyResponse> {
  console.log("[apiVerify] raw body object:", body);

  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(body)) {
    if (typeof v === "object") params.append(k, JSON.stringify(v));
    else params.append(k, String(v));
  }
  const encoded = params.toString();
  console.log("[apiVerify] encoded body:", encoded.slice(0, 500));

  const url = `${BASE_POST}/Verify/index.php`;
  const res = await fetch(url, {
    method: "POST",
    credentials: "include", // cf_clearance 등 쿠키 필요
    cache: "no-store", // 캐시 회피
    mode: "cors",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: encoded,
  }).catch((e) => {
    console.error("[consentApi] verify network error", e);
    throw e;
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error(
      "[consentApi] verify failed",
      res.status,
      res.statusText,
      text.slice(0, 500)
    );
    throw new Error(`VERIFY_${res.status}: ${text || "no body"}`);
  }
  return parseJsonSafe<VerifyResponse>(res);
}
