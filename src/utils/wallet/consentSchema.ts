// /utils/wallet/consentSchema.ts
import type { TypedData } from "viem";

/** 고정 EIP-712 types (리터럴 상수) */
export const consentTypes = {
  EIP712Domain: [
    { name: "name", type: "string" },
    { name: "version", type: "string" },
    { name: "chainId", type: "uint256" }, // viem: bigint
  ],
  Consent: [
    {name:"statement",type:"string"},
    {name:"type",type:"string"},
    {name:"version",type:"string"},
    {name:"address",type:"address"},
    {name:"issuedAt",type:"string"},
    {name:"expireAt",type:"string"},
    {name:"nonce",type:"uint256"}
],
} as const satisfies TypedData;
