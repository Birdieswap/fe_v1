
import type {
  CheckResponse,
  InitiateResponseWire,
  VerifyRequest,
  VerifyResponse,
} from "@/types/consent";

const BASE_GET = "/api/realkimp/Consent";

// POST는 업스트림 직접 호출
const BASE_POST = "https://realkimp.com/birdieswap/Consent";

export async function apiCheck(address: string): Promise<CheckResponse> {
  const url = `${BASE_GET}/Check/?address=${encodeURIComponent(address)}`;
  const res = await fetch(url, { method: "GET" });
  return (await res.json()) as CheckResponse;
}

export async function apiInitiate(params: {
  address: string;
  chainId: number;
  type?: string; // default: "initialConsent"
}): Promise<InitiateResponseWire> {
  const url = `${BASE_GET}/Initiate/?address=${encodeURIComponent(
    params.address
  )}&chainId=${params.chainId}&type=${encodeURIComponent(
    params.type ?? "initialConsent"
  )}`;
  const res = await fetch(url, { method: "GET" });
  return (await res.json()) as InitiateResponseWire;
}

export async function apiVerify(body: VerifyRequest): Promise<VerifyResponse> {
  console.log("[apiVerify] raw body object:", body);
  const params = new URLSearchParams();

  for (const [k, v] of Object.entries(body)) {
    if (typeof v === "object") {
      params.append(k, JSON.stringify(v));
    } else {
      params.append(k, String(v));
    }
  }

  console.log("[apiVerify] encoded body:", params.toString());

  const res = await fetch(`${BASE_POST}/Verify/index.php`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: params.toString(),
    credentials: "include", // cf_clearance 쿠키 필요
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Verify upstream ${res.status}: ${text || "no body"}`);
  }
  return (await res.json()) as VerifyResponse;
}
