import { ReadContractParameters, Abi, PublicClient } from "viem";
import { readContract } from "viem/actions";

import { BigDecimal } from "@/types/BigDecimal";
import {
  IBirdieLPFarm,
  IBirdieSingleFarm,
} from "@/const/contracts/types/tokenTypes";

import getTokenAddress from "../assets/getTokenAddress";
import { ADDRESS } from "@/const/contracts/contractAddresses";
import {
  getFromContracts,
  ZERO_ADDRESS,
  toLower,
} from "@/utils/farm/getAddressHelpers";
import stakingProviders from "@/const/contracts/tokens/stakingProviders";
import { isRateLimitError } from "@/utils/error/serializeError";

function isNativeLike(addr: string) {
  const low = addr.toLowerCase();
  return (
    low === ZERO_ADDRESS.toLowerCase() ||
    low === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee" // 일부 SDK 네이티브 표기
  );
}

function mapNativeToWeth(
  address: `0x${string}`,
  chainId: number
): `0x${string}` {
  if (!isNativeLike(address)) return address; // Native 가 아니면 그대로
  const weth = getFromContracts(ADDRESS.WETH, chainId);
  return (weth ?? address) as `0x${string}`;
}

export default async function totalDualUnderlyingTokens(
  client: PublicClient,
  farm: IBirdieSingleFarm | IBirdieLPFarm
) {
  const chainId = client.chain?.id;
  if (!chainId) return null;

  const routerAddress = stakingProviders.BIRDIESWAP_Router.addresses[chainId];

  if (!chainId) return null;
  const farmAddress = getTokenAddress({
    token: farm,
    chainId,
  });

  // const providerAddress = getProviderAddress({
  //   provider : farm.provider,
  //   chainId,
  // });

  if (!farmAddress || !routerAddress) return null;

  // console.log("totalDualUnderlyingTokens!!!!!!", farm, farmAddress, providerAddress)
  const args: ReadContractParameters<
    Abi, //(typeof farm)["abi"],
    "totalDualUnderlyingTokens",
    [`0x${string}`]
  > = {
    address: routerAddress as `0x${string}`,
    abi: stakingProviders.BIRDIESWAP_Router.abi as Abi,
    functionName: "totalDualUnderlyingTokens",
    args: [farmAddress],
  };

  let lastError: unknown;
  let data:
    | [string, string, bigint, bigint]
    | null = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      data = (await readContract(client, args)) as [
        string,
        string,
        bigint,
        bigint,
      ];
      break;
    } catch (error) {
      lastError = error;
      if (!isRateLimitError(error) || attempt === 2) {
        if (process.env.NODE_ENV !== "production") {
          console.warn("[totalDualUnderlyingTokens] read failed", {
            chainId,
            farmAddress,
            routerAddress,
            error,
          });
        }
        return null;
      }
      const waitMs = 250 * (attempt + 1);
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }

  if (!data) {
    if (lastError && process.env.NODE_ENV !== "production") {
      console.warn("[totalDualUnderlyingTokens] read failed", {
        chainId,
        farmAddress,
        routerAddress,
        error: lastError,
      });
    }
    return null;
  }

  const [UnderlyingTokenA, UnderlyingTokenB, amountTokenA, amountTokenB] = data;

  const token0 = (farm as IBirdieLPFarm).swap?.input?.[0]?.input;
  const token1 = (farm as IBirdieLPFarm).swap?.input?.[1]?.input;
  if (!token0 || !token1) return null; // LP 가드

  const WETH_ADDRESS = getFromContracts(ADDRESS.WETH, chainId);

  const token0AddrRaw = getTokenAddress({ token: token0, chainId });
  const token1AddrRaw = getTokenAddress({ token: token1, chainId });

  const token0Addr = toLower(
    token0?.symbol === "ETH" ? WETH_ADDRESS : token0AddrRaw
  );
  const token1Addr = toLower(
    token1?.symbol === "ETH" ? WETH_ADDRESS : token1AddrRaw
  );

  const UnderlyingToken0 = toLower(
    mapNativeToWeth(UnderlyingTokenA as `0x${string}`, chainId)
  );
  const UnderlyingToken1 = toLower(
    mapNativeToWeth(UnderlyingTokenB as `0x${string}`, chainId)
  );

  // console.log("totalDualUnderlyingTokens WETH Address", WETH_ADDRESS,"Underlying",UnderlyingToken0,UnderlyingToken1,"tokenAddrRaw",token0AddrRaw,token1AddrRaw,"tokenAddr주소매칭소문자",token0Addr,token1Addr)

  if (UnderlyingToken0 && token0Addr && UnderlyingToken0 === token0Addr) {
    const poolBalance0 = new BigDecimal(amountTokenA, token0.decimals);
    const token0Address = UnderlyingTokenA as `0x${string}`;
    const poolBalance1 = new BigDecimal(amountTokenB, token1.decimals);
    const token1Address = UnderlyingTokenB as `0x${string}`;
    // console.log("totalDualUnderlyingTokens data!!!!!!!11111",farm, data,token0Address, poolBalance0, token1Address, poolBalance1)
    return [token0Address, poolBalance0, token1Address, poolBalance1];
  }

  if (UnderlyingToken0 && token1Addr && UnderlyingToken0 === token1Addr) {
    const poolBalance0 = new BigDecimal(amountTokenB, token0.decimals);
    const token0Address = UnderlyingTokenB as `0x${string}`;
    const poolBalance1 = new BigDecimal(amountTokenA, token1.decimals);
    const token1Address = UnderlyingTokenA as `0x${string}`;
    // console.log("totalDualUnderlyingTokens data!!!!!!!22222",farm, data,token0Address, poolBalance0, token1Address, poolBalance1)
    return [token0Address, poolBalance0, token1Address, poolBalance1];
  }
}
