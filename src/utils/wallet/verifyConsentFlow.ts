import { apiCheck, apiInitiate, apiVerify } from "@/utils/wallet/consentApi";
import { computePolicyHash, saveLocalProof } from "@/utils/wallet/consentLocal";
import {
  hashTypedData,
  verifyTypedData,
  type TypedData,
  type TypedDataDomain,
} from "viem";
import { signTypedData } from "wagmi/actions";
import { getPublicClient } from "@wagmi/core";
import type {
  RuntimeEIP712Types,
  NormalizedConsentMessage,
  NormalizedEIP712Payload,
  VerifyRequest,
  CheckResponse,
} from "@/types/consent";
import { openRiskConsentModal } from "@/components/modals/RiskConsentModalHost";

const DEBUG = process.env.NEXT_PUBLIC_DEBUG === "1";

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

async function verifyTypedDataWithClient(params: {
  config: any;
  chainId: number;
  address: `0x${string}`;
  domain: TypedDataDomain;
  types: TypedData;
  primaryType: string;
  message: Record<string, unknown>;
  signature: `0x${string}`;
}) {
  try {
    const publicClient = getPublicClient(params.config, {
      chainId: params.chainId,
    });
    if (publicClient?.verifyTypedData) {
      return await publicClient.verifyTypedData({
        address: params.address,
        domain: params.domain,
        types: params.types,
        primaryType: params.primaryType,
        message: params.message,
        signature: params.signature,
      });
    }
  } catch (err) {
    if (DEBUG) console.error("[consent] public verifyTypedData error", err);
  }

  return verifyTypedData({
    address: params.address,
    domain: params.domain,
    types: params.types,
    primaryType: params.primaryType,
    message: params.message,
    signature: params.signature,
  });
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

    // ★ 현재 provider 상태 로그 (코인베이스인지 확인용)
    try {
      const anyWin = typeof window !== "undefined" ? (window as any) : {};
      const eth = anyWin.ethereum || anyWin.coinbaseWalletExtension;
      if (DEBUG) {
        console.debug("[consent] provider flags", {
          hasEthereum: !!anyWin.ethereum,
          isMetaMask: eth?.isMetaMask,
          isCoinbaseWallet: eth?.isCoinbaseWallet,
          isWalletConnect: eth?.isWalletConnect,
        });
      }
    } catch (e) {
      if (DEBUG) console.debug("[consent] provider inspect error", e);
    }

    // 1) 서버 동의 상태 조회 (silent/interactive 공통)
    let resp: CheckResponse | null = null;
    try {
      if (DEBUG) console.debug("[consent] apiCheck start", { address });
      resp = await apiCheck(address);
    } catch (e) {
      if (DEBUG)
        console.error("[consent] apiCheck error (proceed interactively)", e);
    }
    if (aborted()) return "cancelled";

    if (resp?.response && resp?.result && resp?.userConsent) {
      if (DEBUG) console.debug("[consent] already-consented (server)");
      return "already-consented";
    }

    // silent 모드면 모달 없이 종료
    if (mode === "silent") {
      if (DEBUG) console.debug("[consent] silent mode → cancel");
      return "cancelled";
    }
    if (aborted()) return "cancelled";

    // 2) 모달 열고 initiate → sign → verify
    await new Promise((r) => setTimeout(r, 10));
    await new Promise((r) =>
      requestAnimationFrame(() => requestAnimationFrame(r))
    );

    // ★ 추가: 모달 오픈 시점 로그
    if (DEBUG) console.debug("[consent] opening RiskConsentModal");

    let confirmed: boolean;
    try {
      confirmed = await openRiskConsentModal({
        onConfirm: async () => {
          if (aborted()) throw new Error("aborted");

          try {
            // (a) initiate
            if (DEBUG) console.debug("[consent] initiate...");
            const init = await apiInitiate({
              address,
              chainId,
              type: "initialConsent",
            });
            // ★ 추가: initiate 응답 전체 로그
            if (DEBUG) console.debug("[consent] initiate resp", init);

            if (!init?.response || !init?.result) {
              if (DEBUG)
                console.error("[consent] initiate_failed payload", init);
              throw new Error("initiate_failed");
            }
            if (DEBUG)
              console.debug("[consent] initiate ok", { digest: init.digest });
            if (aborted()) throw new Error("aborted");

            // (b) payload 정규화
            const wire = init.EIP712Payload;
            // ★ 추가: 서버가 내려준 EIP712 원본 payload를 그대로 찍기
            if (DEBUG)
              console.debug(
                "[consent] EIP712Payload (wire)",
                JSON.stringify(wire)
              );

            const types = toRuntimeTypes((wire as any).types);

            // ★ 변경: domain을 서버에서 내려준 값을 그대로 쓰되, chainId만 bigint로 맞추기
            const domainWire = (wire as any).domain ?? {};
            const domain: TypedDataDomain = {
              ...(domainWire as TypedDataDomain),
              chainId: toBigIntChainId(domainWire.chainId ?? chainId),
            };

            const { messageNorm, nonceRaw } = extractMessageAndNonceRaw(
              (wire as any).message
            );

            // ★ 추가: domain / types / messageNorm / nonceRaw 디버그 출력
            if (DEBUG) {
              console.debug("[consent] domain (final)", domain);
              console.debug("[consent] types (runtime)", types);
              console.debug("[consent] messageNorm", messageNorm);
              console.debug("[consent] nonceRaw", nonceRaw);
            }

            if (aborted()) throw new Error("aborted");

            // (c) 서명
            if (DEBUG)
              console.debug("[consent] signing eip712", {
                address,
                chainId,
                domain,
                primaryType: "Consent",
              });

            let signature: `0x${string}`;
            try {
              signature = await signTypedData(config, {
                account: address as `0x${string}`,
                domain: domain as TypedDataDomain,
                types: types as unknown as TypedData,
                primaryType: "Consent",
                message: messageNorm as unknown as Record<string, unknown>,
              });
            } catch (signErr) {
              // ★ 추가: 서명 실패 시 에러 그대로 로그 (Coinbase 문제면 여기서 볼 확률 높음)
              if (DEBUG)
                console.error("[consent] signTypedData error", signErr);
              throw signErr;
            }

            if (DEBUG)
              console.debug("[consent] signed", {
                sigPrefix: signature.slice(0, 10),
                len: signature.length,
              });

            if (aborted()) throw new Error("aborted");

            // (d) 로컬 검증
            let ok = false;
            try {
              ok = await verifyTypedDataWithClient({
                config,
                chainId,
                address,
                domain: domain as TypedDataDomain,
                types: types as unknown as TypedData,
                primaryType: "Consent",
                message: messageNorm as unknown as Record<string, unknown>,
                signature,
              });
            } catch (verifyErr) {
              // ★ 추가: verifyTypedData 에러 로그
              if (DEBUG)
                console.error(
                  "[consent] verifyTypedData threw error",
                  verifyErr
                );
              throw verifyErr;
            }

            if (!ok) {
              // ★ 추가: verify false일 때 상세 정보 찍기
              if (DEBUG)
                console.error("[consent] client_verify_failed", {
                  address,
                  domain,
                  types,
                  message: messageNorm,
                });
              throw new Error("client_verify_failed");
            }
            if (DEBUG) console.debug("[consent] client_verify_ok");

            if (aborted()) throw new Error("aborted");

            // (e) digest 비교(선택)
            const recomputed = hashTypedData({
              domain: domain as TypedDataDomain,
              types: types as unknown as TypedData,
              primaryType: "Consent",
              message: messageNorm as unknown as Record<string, unknown>,
            });

            // ★ 추가: digest 비교 결과 로그
            if (DEBUG)
              console.debug("[consent] digest compare", {
                recomputed,
                serverDigest: init.digest,
                eq: recomputed === init.digest,
              });

            if (recomputed !== init.digest && DEBUG) {
              console.warn("[consent] digest mismatch", {
                recomputed,
                serverDigest: init.digest,
              });
            }
            if (aborted()) throw new Error("aborted");

            // (f) 서버 verify
            if (DEBUG) console.debug("[consent] calling apiVerify");
            const body: VerifyRequest = {
              address,
              chainId,
              nonce: nonceRaw,
              type: (messageNorm as any).type,
              version: (messageNorm as any).version,
              signature,
              digest: init.digest,
            };

            // ★ 추가: 서버로 보내는 verify body 찍기
            if (DEBUG) console.debug("[consent] apiVerify body", body);

            const v = await apiVerify(body);

            // ★ 추가: 서버 verify 응답 로그
            if (DEBUG) console.debug("[consent] apiVerify resp", v);

            if (!v?.response || !v?.result) {
              if (DEBUG) console.error("[consent] server_verify_failed", v);
              throw new Error(v?.message || "server_verify_failed");
            }
            if (DEBUG) console.debug("[consent] server_verify_ok");

            if (aborted()) throw new Error("aborted");

            // (g) 로컬 proof 저장
            const policyHash = await computePolicyHash(
              (messageNorm as any).statement,
              (messageNorm as any).version
            );

            // ★ 여기 추가: NormalizedEIP712Payload용 domain 별도 생성
            const normalizedDomain: NormalizedEIP712Payload["domain"] = {
              ...(domain as any),
              name: domain.name ?? "", // string으로 강제
              version: domain.version ?? "", // string으로 강제
            };

            const normalizedPayload: NormalizedEIP712Payload = {
              types,
              domain: normalizedDomain, // ★ 여기서 domain 대신 normalizedDomain 사용
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

            if (DEBUG) console.debug("[consent] local proof saved");
          } catch (err) {
            // ★ 추가: onConfirm 내부에서 어떤 에러로 빠졌는지 최종 로그
            if (DEBUG) console.error("[consent] onConfirm error", err);
            throw err;
          }
        },
      });
    } catch (modalErr) {
      // ★ 추가: 모달/콜백 자체에서 에러났을 때 로그
      if (DEBUG)
        console.error("[consent] openRiskConsentModal error", modalErr);
      throw modalErr;
    }

    if (!confirmed) {
      if (DEBUG) console.debug("[consent] modal closed/cancelled");
      return "cancelled";
    }

    if (DEBUG) console.debug("[consent] verified-now");
    return "verified-now";
  } catch (err) {
    if ((err as Error)?.message === "aborted") {
      // ★ 추가: aborted 케이스도 로그
      if (DEBUG) console.debug("[verifyConsentFlow] aborted");
      return "cancelled";
    }
    if (DEBUG) console.error("[verifyConsentFlow] failed", err);
    return "failed";
  }
}
