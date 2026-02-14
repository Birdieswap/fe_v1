"use client";

import { Input } from "@heroui/react";
import { useState } from "react";
import { usePublicClient } from "wagmi";

import tokens from "@/const/contracts/tokens/tokens";
import externalTokens from "@/const/contracts/tokens/externalTokens";
import { getSwapQuoteForProviders } from "@/utils/assets/getSwapQuote";
import { BigDecimal } from "@/types/BigDecimal";

export default function Page() {
  const client = usePublicClient();
  const token0 = externalTokens.WETH;
  const token1 = tokens.USDC;
  const [data0, setData0] = useState<string | null>(null);
  const [data1, setData1] = useState<string | null>(null);
  const [isLoading0, setIsLoading0] = useState<boolean>(false);
  const [isLoading1, setIsLoading1] = useState<boolean>(false);
  const [amount0, _setAmount0] = useState<string | null>(null);
  const [amount1, _setAmount1] = useState<string | null>(null);
  const setAmount0 = (v: string) => {
    if (!client) return;
    let bd: BigDecimal = BigDecimal.ZERO();

    try {
      bd = new BigDecimal(v, token0.decimals);
    } catch (e) {
      console.error("Invalid amount for token0:", e);

      return;
    }
    setIsLoading1(true);
    getSwapQuoteForProviders(client, token0, token1, "in", bd)
      .then((result) => {
        if (result) {
          setData0(JSON.stringify(result, undefined, 2));
        } else {
          setData0(null);
        }
      })
      .catch((e) => {
        console.error("Error fetching swap quote:", e);
        setData0(null);
      })
      .finally(() => {
        setIsLoading1(false);
      });
    _setAmount0(v);
  };
  const setAmount1 = (v: string) => {
    if (!client) return;
    let bd: BigDecimal = BigDecimal.ZERO();

    try {
      bd = new BigDecimal(v, token1.decimals);
    } catch (e) {
      console.error("Invalid amount for token1:", e);

      return;
    }
    setIsLoading0(true);
    getSwapQuoteForProviders(client, token0, token1, "out", bd)
      .then((result) => {
        if (result) {
          setData1(JSON.stringify(result, undefined, 2));
        } else {
          setData1(null);
        }
      })
      .catch((e) => {
        console.error("Error fetching swap quote:", e);
        setData1(null);
      })
      .finally(() => {
        setIsLoading0(false);
      });
    _setAmount1(v);
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <Input
        isDisabled={isLoading0}
        label="Amount 0"
        value={amount0 ?? undefined}
        onValueChange={setAmount0}
      />
      <Input
        isDisabled={isLoading1}
        label="Amount 1"
        value={amount1 ?? undefined}
        onValueChange={setAmount1}
      />

      <p>isLoading0 {isLoading0}</p>
      <p>isLoading1 {isLoading1}</p>
      {data0 ?? "No data"}
      {data1 ?? "No data"}
    </div>
  );
}
