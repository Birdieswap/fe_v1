// /utils/wallet/consentLocal.ts
import { hashTypedData, verifyTypedData } from "viem";
import type { NormalizedEIP712Payload } from "@/types/consent";
import { consentTypes } from "@/utils/wallet/consentSchema";

// 로컬 저장 키
const KEY = "birdieswap_consent_proofs_v1";

// 로컬 프루프 스키마
export type LocalConsentProof = {
  address: `0x${string}`;
  chainId: number;
  version: string;            // e.g., "20250929"
  policyHash: `0x${string}`;  // statement+version 해시
  payload: NormalizedEIP712Payload; // ★ 정규화된 payload (domain.chainId: bigint)
  digest: `0x${string}`;      // 서버 제공 digest
  signature: `0x${string}`;   // 사용자가 방금 만든 서명
  createdAt: number;          // ms epoch
  offlineUntil: number;       // ms epoch (예: createdAt + 10분)
};

// 간단한 문자열 해시 — 정책 버전/문구 바인딩용
async function keccakHex(input: string): Promise<`0x${string}`> {
  const enc = new TextEncoder().encode(input);
  // 브라우저 내장 SHA-256으로 충분(정책 변경 추적 목적)
  const buf = await crypto.subtle.digest("SHA-256", enc);
  const hex = Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `0x${hex}` as `0x${string}`;
}

function loadAll(): LocalConsentProof[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as LocalConsentProof[]) : [];
  } catch {
    return [];
  }
}
function saveAll(list: LocalConsentProof[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {}
}

export async function saveLocalProof(p: LocalConsentProof) {
  const all = loadAll();
  // 동일 address+version+policyHash 최신으로 교체
  const next = all.filter(
    (x) =>
      !(
        x.address.toLowerCase() === p.address.toLowerCase() &&
        x.version === p.version &&
        x.policyHash === p.policyHash
      )
  );
  next.push(p);
  saveAll(next);
}

export async function computePolicyHash(statement: string, version: string) {
  return keccakHex(`v=${version}::${statement}`);
}

export async function findValidLocalProof(params: {
  address: `0x${string}`;
  chainId: number;     // 저장된 number와 비교
  statement: string;
  version: string;
}): Promise<LocalConsentProof | null> {
  const all = loadAll();
  const policyHash = await computePolicyHash(params.statement, params.version);
  const now = Date.now();
  const cand = all.find(
    (x) =>
      x.address.toLowerCase() === params.address.toLowerCase() &&
      x.chainId === params.chainId &&
      x.version === params.version &&
      x.policyHash === policyHash &&
      x.offlineUntil > now
  );
  if (!cand) return null;

  // 1) 로컬 digest 재계산 (로컬 고정 types + 정규 도메인)
const localDigest = hashTypedData({
  domain: cand.payload.domain,   // chainId: bigint
  types: consentTypes,
  primaryType: "Consent",
  message: cand.payload.message, // nonce: bigint
});

const ok = await verifyTypedData({
  address: cand.address,
  domain: cand.payload.domain,
  types: consentTypes,
  primaryType: "Consent",
  message: cand.payload.message,
  signature: cand.signature,
});

  return ok ? cand : null;
}
