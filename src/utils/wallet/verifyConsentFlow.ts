
import { apiCheck, apiInitiate, apiVerify } from "@/utils/wallet/consentApi";
import { computePolicyHash, saveLocalProof } from "@/utils/wallet/consentLocal";
import {
  hashTypedData,
  verifyTypedData,
  type TypedData,
  type TypedDataDomain,
} from "viem";
import { signTypedData } from "wagmi/actions";
import type {
  RuntimeEIP712Types,
  NormalizedConsentMessage,
  NormalizedEIP712Payload,
  VerifyRequest,
} from "@/types/consent";
import { openRiskConsentModal } from "@/components/modals/RiskConsentModalHost";

export type VerifyConsentMode = "interactive" | "silent";

export type VerifyConsentParams = {
  config: any;                 // wagmi useConfig() 결과
  address: `0x${string}`;
  chainId: number;
  mode?: VerifyConsentMode;    // 기본 "interactive"
  abortSignal?: () => boolean; // 🔸 언제든 true면 조기 중단
};

function toRuntimeTypes(wireTypes: any): RuntimeEIP712Types {
  const mapArr = (a: any[] | readonly any[]) =>
    Array.from(a ?? []).map((f: any) => ({
      name: String(f.name),
      type: String(f.type),
    }));
  return {
    EIP712Domain: mapArr(wireTypes?.EIP712Domain),
    Consent: mapArr(wireTypes?.Consent),
  };
}

function toBigIntChainId(v: string | number | bigint): bigint {
  if (typeof v === "bigint") return v;
  if (typeof v === "number") return BigInt(v);
  return BigInt(v);
}

function extractMessageAndNonceRaw(
  wireMessage:
    | NormalizedConsentMessage
    | { Consent: Omit<NormalizedConsentMessage, "nonce"> & { nonce: string | number } }
): { messageNorm: NormalizedConsentMessage; nonceRaw: string | number } {
  if (typeof (wireMessage as any)?.Consent !== "undefined") {
    const inner = (wireMessage as any).Consent as Omit<NormalizedConsentMessage, "nonce"> & {
      nonce: string | number;
    };
    return { messageNorm: { ...inner, nonce: BigInt(inner.nonce) }, nonceRaw: inner.nonce };
  }
  const m = wireMessage as NormalizedConsentMessage;
  const nonceAny: any = (m as any).nonce;
  return {
    messageNorm: { ...m, nonce: typeof nonceAny === "bigint" ? nonceAny : BigInt(nonceAny) },
    nonceRaw: typeof nonceAny === "bigint" ? nonceAny.toString() : nonceAny,
  };
}

export async function verifyConsentFlow(params: VerifyConsentParams): Promise<boolean> {
  const {
    config,
    address,
    chainId,
    mode = "interactive",
    abortSignal,
  } = params;

  const aborted = () => (typeof abortSignal === "function" ? abortSignal() : false);

  try {
    // 조기 중단 체크 (시작)
    if (aborted()) return false;

    // 1) 서버 동의 상태 조회 (silent/interactive 공통)
    const resp = await apiCheck(address);
    if (aborted()) return false;

    if (resp?.response && resp?.result && resp?.userConsent) {
      // 이미 동의 있음 → 끝
      return true;
    }

    // silent 모드면 여기서 바로 종료 (모달 미표시)
    if (mode === "silent") return false;

    // interactive: 모달 열기 직전에도 한 번 더 체크
    if (aborted()) return false;

    const confirmed = await openRiskConsentModal({
      onConfirm: async () => {
        // onConfirm 들어와서도 한 번 체크
        if (aborted()) throw new Error("aborted");

        // 2) initiate
        const init = await apiInitiate({ address, chainId, type: "initialConsent" });
        if (!init?.response || !init?.result) throw new Error("initiate_failed");
        if (aborted()) throw new Error("aborted");

        const wire = init.EIP712Payload;
        const types = toRuntimeTypes((wire as any).types);
        const domain = {
          name: String((wire as any).domain?.name ?? ""),
          version: String((wire as any).domain?.version ?? ""),
          chainId: toBigIntChainId((wire as any).domain?.chainId),
        };
        const { messageNorm, nonceRaw } = extractMessageAndNonceRaw((wire as any).message);

        if (aborted()) throw new Error("aborted");

        // 3) 서명
        const signature = await signTypedData(config, {
          domain: domain as TypedDataDomain,
          types: types as unknown as TypedData,
          primaryType: "Consent",
          message: messageNorm as unknown as Record<string, unknown>,
        });

        // 4) 로컬 검증
        const ok = await verifyTypedData({
          address,
          domain: domain as TypedDataDomain,
          types: types as unknown as TypedData,
          primaryType: "Consent",
          message: messageNorm as unknown as Record<string, unknown>,
          signature,
        });
        if (!ok) throw new Error("client_verify_failed");

        if (aborted()) throw new Error("aborted");

        // (선택) digest 비교
        const recomputed = hashTypedData({
          domain: domain as TypedDataDomain,
          types: types as unknown as TypedData,
          primaryType: "Consent",
          message: messageNorm as unknown as Record<string, unknown>,
        });
        if (recomputed !== init.digest) {
          console.warn("[verifyConsentFlow] digest mismatch", { recomputed, server: init.digest });
        }

        if (aborted()) throw new Error("aborted");

        // 5) 서버 verify
        const body: VerifyRequest = {
          address,
          chainId,
          nonce: nonceRaw, // 원본 타입 echo
          type: (messageNorm as any).type,
          version: (messageNorm as any).version,
          signature,
          digest: init.digest,
        };
        const v = await apiVerify(body);
        if (!v?.response || !v?.result) {
          throw new Error(v?.message || "server_verify_failed");
        }

        if (aborted()) throw new Error("aborted");

        // 6) 로컬 proof 저장
        const policyHash = await computePolicyHash(
          (messageNorm as any).statement,
          (messageNorm as any).version
        );

        const normalizedPayload: NormalizedEIP712Payload = {
          types,
          domain,
          primaryType: "Consent",
          message: messageNorm,
        };

        await saveLocalProof({
          address: address.toLowerCase() as `0x${string}`,
          chainId,
          version: (messageNorm as any).version,
          policyHash,
          payload: normalizedPayload,
          digest: init.digest,
          signature,
          createdAt: Date.now(),
          offlineUntil: Date.now() + 10 * 60 * 1000,
        });
      },
    });

    // 모달 닫힘(취소) → false
    return confirmed === true;
  } catch (err) {
    if ((err as Error)?.message === "aborted") {
      // 프리엠션으로 중단된 케이스
      return false;
    }
    console.error("[verifyConsentFlow] failed", err);
    return false;
  }
}