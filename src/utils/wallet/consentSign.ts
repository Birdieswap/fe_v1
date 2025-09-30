import { signTypedData, getAccount, getChainId } from "wagmi/actions";
import { domain as domainFactory, types, toEip712Message, type ConsentMessageInput} from "@/shared/typedData";
import type { Config } from "wagmi";

export async function ensureConsent(config: Config): Promise<boolean> {
  const { address, status } = getAccount(config);
  if (!address || status !== "connected") return false;

  // 1) 서버 상태 조회
  const s = await fetch(`/api/consent/status?address=${address}`).then(r => r.json());
  if (s?.ok && s.hasConsent) {
    cacheLocal(address, s.version, s.issuedAt);
    return true;
  }

  // 2) 모달 열고, 확인 시 실제 서명 진행(모달은 밖에서 열어줌)
  const ok = await signConsent(config, address);
  return ok;
}

export async function signConsent(config: Config, address: `0x${string}`) {
  const prep = await fetch(`/api/consent/prepare?address=${address}`).then(r => r.json());
  if (!prep?.ok) return false;

  const chainId = await getChainId(config);
  const input: ConsentMessageInput = {
    statement: prep.statement,
    address,
    nonce: prep.nonce,
    chainId,               // number
    issuedAt: prep.issuedAt,
    expiration: prep.expiration ?? 0,
  };

  const eipMsg = toEip712Message(input); // bigint 변환

  const signature = await signTypedData(config, {
    account: address,
    primaryType: "Consent",
    domain: domainFactory(chainId), // domain은 number 사용
    types,
    message: eipMsg,                // ← 여기엔 bigint 타입!
  });

  // 서버에는 JSON으로 보낼 수 있도록 number 버전 전송
  const res = await fetch("/api/consent/verify", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chainId, message: input, signature }),
  }).then(r => r.json());

  return !!res?.ok;
}

function cacheLocal(address: string, version: string, issuedAt: number) {
  try {
    localStorage.setItem(
      `birdie:consent:v${version}:${address.toLowerCase()}`,
      JSON.stringify({ issuedAt })
    );
  } catch {}
}
