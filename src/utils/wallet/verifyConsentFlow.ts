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

export type VerifyConsentResult =
  | "already-consented" // 서버에 이미 동의 기록 있음
  | "verified-now" // 이번에 모달 열고 서명 & verify 성공
  | "cancelled" // 모달에서 닫기/거부
  | "failed"; // 네트워크/서버 오류 등

export type VerifyConsentParams = {
  config: any; // wagmi useConfig() 결과
  address: `0x${string}`;
  chainId: number;
  mode?: VerifyConsentMode; // 기본 "interactive"
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
    | {
        Consent: Omit<NormalizedConsentMessage, "nonce"> & {
          nonce: string | number;
        };
      }
): { messageNorm: NormalizedConsentMessage; nonceRaw: string | number } {
  if (typeof (wireMessage as any)?.Consent !== "undefined") {
    const inner = (wireMessage as any).Consent as Omit<
      NormalizedConsentMessage,
      "nonce"
    > & {
      nonce: string | number;
    };
    return {
      messageNorm: { ...inner, nonce: BigInt(inner.nonce) },
      nonceRaw: inner.nonce,
    };
  }
  const m = wireMessage as NormalizedConsentMessage;
  const nonceAny: any = (m as any).nonce;
  return {
    messageNorm: {
      ...m,
      nonce: typeof nonceAny === "bigint" ? nonceAny : BigInt(nonceAny),
    },
    nonceRaw: typeof nonceAny === "bigint" ? nonceAny.toString() : nonceAny,
  };
}

export async function verifyConsentFlow(
  params: VerifyConsentParams
): Promise<VerifyConsentResult> {
  const {
    config,
    address,
    chainId,
    mode = "interactive",
    abortSignal,
  } = params;

  const aborted = () =>
    typeof abortSignal === "function" ? abortSignal() : false;

  try {
    if (aborted()) return "cancelled";

    // 1) 서버 동의 상태 조회 (silent/interactive 공통)
    const resp = await apiCheck(address);
    if (aborted()) return "cancelled";

    if (resp?.response && resp?.result && resp?.userConsent) {
      return "already-consented";
    }

    // silent 모드면 모달 없이 여기서 종료
    if (mode === "silent") return "cancelled";

    if (aborted()) return "cancelled";

    // 2) 모달 열고 onConfirm에서 initiate → sign → verify 수행
    await new Promise((r) => setTimeout(r, 10));
    await new Promise((r) =>
      requestAnimationFrame(() => requestAnimationFrame(r))
    );

    const confirmed = await openRiskConsentModal({
      onConfirm: async () => {
        if (aborted()) throw new Error("aborted");

        // (a) initiate
        const init = await apiInitiate({
          address,
          chainId,
          type: "initialConsent",
        });
        if (!init?.response || !init?.result)
          throw new Error("initiate_failed");
        if (aborted()) throw new Error("aborted");

        // (b) payload 정규화
        const wire = init.EIP712Payload;
        const types = toRuntimeTypes((wire as any).types);
        const domain = {
          name: String((wire as any).domain?.name ?? ""),
          version: String((wire as any).domain?.version ?? ""),
          chainId: toBigIntChainId((wire as any).domain?.chainId),
        };
        const { messageNorm, nonceRaw } = extractMessageAndNonceRaw(
          (wire as any).message
        );

        if (aborted()) throw new Error("aborted");

        // (c) 서명
        console.debug("[consent] signing eip712", {
          address,
          chainId,
          domain,
          primaryType: "Consent",
        });
        const signature = await signTypedData(config, {
          account: address as `0x${string}`,
          domain: domain as TypedDataDomain,
          types: types as unknown as TypedData,
          primaryType: "Consent",
          message: messageNorm as unknown as Record<string, unknown>,
        });

        console.debug("[consent] signed", { len: signature?.length });

        // (d) 로컬 검증
        const ok = await verifyTypedData({
          address,
          domain: domain as TypedDataDomain,
          types: types as unknown as TypedData,
          primaryType: "Consent",
          message: messageNorm as unknown as Record<string, unknown>,
          signature,
        });
        if (!ok) {
          console.error("[consent] client_verify_failed");
          throw new Error("client_verify_failed");
        }

        if (aborted()) throw new Error("aborted");

        // (e) (선택) digest 비교
        const recomputed = hashTypedData({
          domain: domain as TypedDataDomain,
          types: types as unknown as TypedData,
          primaryType: "Consent",
          message: messageNorm as unknown as Record<string, unknown>,
        });
        if (recomputed !== init.digest) {
          console.warn("[verifyConsentFlow] digest mismatch", {
            recomputed,
            serverDigest: init.digest,
          });
        }

        if (aborted()) throw new Error("aborted");

        // (f) 서버 verify (nonce는 원본 타입 echo)
        console.debug("[consent] calling apiVerify");
        const body: VerifyRequest = {
          address,
          chainId,
          nonce: nonceRaw,
          type: (messageNorm as any).type,
          version: (messageNorm as any).version,
          signature,
          digest: init.digest,
        };
        const v = await apiVerify(body);
        if (!v?.response || !v?.result) {
          console.error("[consent] server_verify_failed", v);
          throw new Error(v?.message || "server_verify_failed");
        }
        console.debug("[consent] server_verify_ok");

        if (aborted()) throw new Error("aborted");

        // (g) 로컬 proof 저장 (선택)
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

    // 모달 닫힘/거부
    if (!confirmed) return "cancelled";

    // 여기까지 왔으면 이번에 서명 완료
    return "verified-now";
  } catch (err) {
    if ((err as Error)?.message === "aborted") return "cancelled";
    console.error("[verifyConsentFlow] failed", err);
    return "failed";
  }
}
