// /types/consent.ts

export type ConsentPrimaryType = "Consent";

export type RuntimeEIP712Types = Record<string, { name: string; type: string }[]>;

export type ConsentTypes = {
  EIP712Domain: { name: string; type: string }[];
  Consent: { name: string; type: string }[];
};

/** 서버 JSON(Wire)에서 오는 메시지: nonce가 number */
export type WireConsentMessage = {
  type: "initialConsent" | string;
  version: string;
  statement: string;
  address: `0x${string}`;
  issuedAt: string;
  expireAt: string;
  nonce: number;              // ← Wire는 number
};

/** viem에 넘길 정규 메시지: nonce가 bigint */
export type NormalizedConsentMessage = {
  statement: string;
  type: string;
  version: string;
  address: `0x${string}`;
  issuedAt: string;     // 서버가 string으로 내려줌
  expireAt: string;     // 서버가 string으로 내려줌
  nonce: bigint;        // 클라에서 BigInt로 정규화
};

export type WireDomain = {
  name: string;
  version: string;
  chainId: number | string;
};

export type WireEIP712Payload = {
  types: ConsentTypes;
  domain: WireDomain;
  primaryType: ConsentPrimaryType;
  message: WireConsentMessage | { Consent: WireConsentMessage };
};

export type InitiateResponseWire = {
  response: boolean;
  result: boolean;
  EIP712Payload: {
    types: RuntimeEIP712Types;
    domain: { name: string; version: string; chainId: number | string };
    primaryType: "Consent";
    message:
      | NormalizedConsentMessage
      | { Consent: Omit<NormalizedConsentMessage, "nonce"> & { nonce: number | string } };
  };
  digest: `0x${string}`;
};

export type CheckResponse =
  | { response: true; result: true; userConsent: any }
  | { response: true; result: false; message?: string }
  | { response: false; result: false; message: string };

export type VerifyRequest = {
  nonce: number | string; // ← 서버 원본 타입 그대로 허용
  type: string;
  version: string;
  chainId: number;        // Initiate 때 보낸 chainId 그대로
  address: `0x${string}`; // Initiate 때 보낸 address 그대로
  signature: `0x${string}`;
  digest: `0x${string}`;

  /** 서버가 digest 재계산할 수 있게 그대로 echo (optional) */
  EIP712Payload?: {
    types: RuntimeEIP712Types;
    domain: {
      name: string;
      version: string;
      chainId: number | string; // 👈 여기만 number | string 으로 완화
    };
    primaryType: "Consent";
    message: any;
  };
};


export type VerifyResponse = {
  response: boolean;
  result: boolean;
  message?: string;
};

export type NormalizedDomain = {
  name: string;
  version: string;
  chainId: bigint;                     // viem 요구
};

export type NormalizedEIP712Payload = {
  types: RuntimeEIP712Types;       // ★ 여기! 고정 타입 대신 런타임 타입으로
  domain: NormalizedDomain;
  primaryType: "Consent";
  message: NormalizedConsentMessage;
};
