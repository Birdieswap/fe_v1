// /utils/wallet/consentApi.ts
import type {
  CheckResponse,
  InitiateResponseWire,
  VerifyRequest,
  VerifyResponse,
} from "@/types/consent";

const BASE = "/api/realkimp/Consent";

export async function apiCheck(address: string): Promise<CheckResponse> {
  const url = `${BASE}/Check/?address=${encodeURIComponent(address)}`;
  const res = await fetch(url, { method: "GET" });
  return (await res.json()) as CheckResponse;
}

export async function apiInitiate(params: {
  address: string;
  chainId: number;
  type?: string; // default: "initialConsent"
}): Promise<InitiateResponseWire> {
  const url = `${BASE}/Initiate/?address=${encodeURIComponent(
    params.address
  )}&chainId=${params.chainId}&type=${encodeURIComponent(
    params.type ?? "initialConsent"
  )}`;
  const res = await fetch(url, { method: "GET" });
  return (await res.json()) as InitiateResponseWire;
}

export async function apiVerify(body: VerifyRequest): Promise<VerifyResponse> {
  // body 객체를 URL-encoded string으로 변환
  console.log("[apiVerify] raw body object:", body);
  const params = new URLSearchParams();

  

  for (const [k, v] of Object.entries(body)) {
    // 객체/배열이면 JSON 문자열로 감싸서 전송
    if (typeof v === "object") {
      params.append(k, JSON.stringify(v));
    } else {
      params.append(k, String(v));
    }
  }
  // 직렬화된 최종 문자열 로그
  console.log("[apiVerify] encoded body:", params.toString());

  const res = await fetch(`${BASE}/Verify/index.php`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Verify upstream ${res.status}: ${text || "no body"}`);
  }
  return (await res.json()) as VerifyResponse;
}
