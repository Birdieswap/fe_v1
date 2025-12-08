import { motion } from "framer-motion";

import { FarmPair } from "@/types/FarmListTableRowProps";
import {
  UsePairStartPanelReturn,
  usePairStartPanel,
} from "@/hooks/usePairStartPanel";
import { Filler, PanelContainer } from "@/components/atoms/FarmPanel";
import { defaultTransition } from "@/const/presenceTransition";

import { ExecuteButtons } from "../../common/ExecuteButtons";

import PairStartAmountInput from "./pairStart/PairStartAmountInput";
import PairStartSummary from "./pairStart/PairStartSummary";
import { BigDecimal } from "@/types/BigDecimal";
import { useContext } from "react";
import { AssetsContext } from "@/app/AssetsContextProvider";
import { useChainId } from "wagmi";

export function PairStartPanel({
  item,
  price,
  totalBalance,
}: {
  item: FarmPair;
  price: BigDecimal | null;
  totalBalance?: BigDecimal;
}) {
  // 기존 훅: 지난 패치에서 ETH/WETH 파생값을 반환하도록 확장됨
  const chainId = useChainId();
  const poolAddress = item.wip_stakeToken.swap.addresses[chainId];
  const tokenId = BigInt(item.wip_stakeToken.swap.tokenId?.[chainId] ?? 0);

  const state: UsePairStartPanelReturn = usePairStartPanel(
    item,
    tokenId,
    poolAddress
  );
  const { assetValues } = useContext(AssetsContext);

  const activeIndex: 0 | 1 = state.isActive[0] ? 0 : 1;

  const resolvePairIndex = (s: any): number | undefined => {
    const candidates = [
      s?.pairSliderIndex,
      s?.modeIndex,
      s?.selectedIndex,
      s?.tabIndex,
      s?.pairModeIndex,
    ];
    const hit = candidates.find((v) => typeof v === "number");
    return hit as number | undefined;
  };
  const pairIndex = resolvePairIndex(state);
  const showSummary = pairIndex === 0 || pairIndex === 2;

  // ─────────────────────────────────────────────
  // ✅ 입금 제한 관련 계산
  const LIMIT_DEPOSIT_MODE_ON =
    process.env.NEXT_PUBLIC_LIMIT_DEPOSIT_MODE?.toLowerCase() === "on";

  const DEPOSIT_LIMIT_USD = new BigDecimal("1010"); // $1,000

  // ✅ 이미 예치된 USD (기존 로직 유지: totalBalance * price)
  const existingUsd =
    price && totalBalance ? totalBalance.mul(price) : BigDecimal.ZERO();

  // ✅ 토큰별 Chainlink 가격으로 입력금액 USD 계산 (배열로 분리)
  const tokenUsdValues = state.tokenStatuses.map((tokenStatus) => {
    const amt = tokenStatus.amount ?? BigDecimal.ZERO();
    if (amt.lte(0)) return BigDecimal.ZERO();

    const token = tokenStatus.input;
    const symbol = token?.symbol;
    if (!symbol) return BigDecimal.ZERO();

    const priceEntry = assetValues?.chainLinkPriceMap?.get(
      `LINK:${symbol}_USD`
    );
    const tokenPriceUsd =
      (priceEntry?.price as BigDecimal | undefined) ?? BigDecimal.ZERO();

    return amt.mul(tokenPriceUsd);
  });

  // 총 입력 USD
  const inputUsd = tokenUsdValues.reduce(
    (acc, v) => acc.add(v),
    BigDecimal.ZERO()
  );

  const nextTotalUsd = existingUsd.add(inputUsd);

  // console.log(
  //   "pairStartPanel deposit check",
  //   {
  //     existingUsd: existingUsd.toString(),
  //     inputUsd: inputUsd.toString(),
  //     nextTotalUsd: nextTotalUsd.toString(),
  //   },
  //   state
  // );

  const isOverDepositLimit =
    LIMIT_DEPOSIT_MODE_ON && nextTotalUsd.gt(DEPOSIT_LIMIT_USD);

  // 🔹 전체 기준 잔여 USD (기 투입만 보고)
  const rawMaxNewUsd = DEPOSIT_LIMIT_USD.sub(existingUsd);
  const maxNewUsd = rawMaxNewUsd.gt(0) ? rawMaxNewUsd : BigDecimal.ZERO();

  // ─────────────────────────────────────────────
  // ✅ 가격/밸런스 공통 정리

  const ts0 = state.tokenStatuses[0];
  const ts1 = state.tokenStatuses[1];

  // 풀 내 비율 계산용 (underlying)
  const poolBalance0 = state?.poolBalance0 ?? BigDecimal.ZERO();
  const poolBalance1 = state?.poolBalance1 ?? BigDecimal.ZERO();

  // 지갑 잔고 (USD 기준 normal max 계산용)
  const walletBal0 = ts0?.balance ?? BigDecimal.ZERO();
  const walletBal1 = ts1?.balance ?? BigDecimal.ZERO();

  const token0 = ts0?.input;
  const token1 = ts1?.input;

  const symbol0 = token0?.symbol;
  const symbol1 = token1?.symbol;

  const priceEntry0 = symbol0
    ? assetValues?.chainLinkPriceMap?.get(`LINK:${symbol0}_USD`)
    : null;
  const priceEntry1 = symbol1
    ? assetValues?.chainLinkPriceMap?.get(`LINK:${symbol1}_USD`)
    : null;

  const priceUsd0 = priceEntry0?.price
    ? new BigDecimal(priceEntry0.price.toString())
    : BigDecimal.ZERO();
  const priceUsd1 = priceEntry1?.price
    ? new BigDecimal(priceEntry1.price.toString())
    : BigDecimal.ZERO();

  // ─────────────────────────────────────────────
  // ✅ 1. 일반 모드용 normalMaxAmount (두 토큰 중 달러 환산 balance 작은 쪽 기준)

  const walletUsd0 =
    priceUsd0.gt(0) && walletBal0.gt(0)
      ? walletBal0.mul(priceUsd0)
      : BigDecimal.ZERO();
  const walletUsd1 =
    priceUsd1.gt(0) && walletBal1.gt(0)
      ? walletBal1.mul(priceUsd1)
      : BigDecimal.ZERO();

  // 둘 중 더 작은 USD
  const minWalletUsd = walletUsd0.gt(walletUsd1) ? walletUsd1 : walletUsd0;

  const normalMaxAmount0 =
    priceUsd0.gt(0) && minWalletUsd.gt(0)
      ? minWalletUsd.div(priceUsd0)
      : BigDecimal.ZERO();
  const normalMaxAmount1 =
    priceUsd1.gt(0) && minWalletUsd.gt(0)
      ? minWalletUsd.div(priceUsd1)
      : BigDecimal.ZERO();

  // ─────────────────────────────────────────────
  // ✅ 2. limit on 모드용 maxToken0 / maxToken1 (잔여 한도 기반)

  const value0 = poolBalance0.mul(priceUsd0);
  const value1 = poolBalance1.mul(priceUsd1);
  const totalValue = value0.add(value1);

  let maxToken0 = BigDecimal.ZERO();
  let maxToken1 = BigDecimal.ZERO();

  if (totalValue.gt(0)) {
    if (priceUsd0.gt(0)) {
      const ratio0 = value0.div(totalValue); // 0~1
      const usdForToken0 = maxNewUsd.mul(ratio0).mul(new BigDecimal("0.998")); // 99.8% 안전 버퍼
      if (usdForToken0.gt(0)) {
        maxToken0 = usdForToken0.div(priceUsd0);
      }
    }

    if (priceUsd1.gt(0)) {
      const ratio1 = value1.div(totalValue);
      const usdForToken1 = maxNewUsd.mul(ratio1).mul(new BigDecimal("0.998"));
      if (usdForToken1.gt(0)) {
        maxToken1 = usdForToken1.div(priceUsd1);
      }
    }

    // console.log(
    //   "PairStartPanel priceUsd",
    //   value0.toString(),
    //   value1.toString(),
    //   totalValue.toString(),
    //   maxToken0.toString(),
    //   maxToken1.toString()
    // );
  } else {
    // 풀 비율 계산이 안 되는 경우: 잔여 USD를 각 토큰 가격으로 단순 환산
    if (priceUsd0.gt(0)) {
      maxToken0 = maxNewUsd.div(priceUsd0);
    }
    if (priceUsd1.gt(0)) {
      maxToken1 = maxNewUsd.div(priceUsd1);
    }
  }

  // 버튼 텍스트용 (token0 기준)
  const prettyMaxToken0 = maxToken0.gt(0)
    ? maxToken0.toFixed(
        token0?.decimals && token0.decimals < 6 ? token0.decimals : 6
      )
    : "0";

  let executeText: string;

  if (isOverDepositLimit && LIMIT_DEPOSIT_MODE_ON) {
    if (!symbol0 || maxNewUsd.lte(0) || priceUsd0.lte(0)) {
      // 아예 더 넣을 수 없는 경우 / 가격 없음
      executeText = "Deposit limit reached";
    } else {
      // ✅ 최종: token0 기준으로 안내
      executeText = `Enter an amount under ${prettyMaxToken0} ${symbol0}`;
    }
  } else {
    executeText = "Start Farming";
  }

  const showDepositLimitInfo = LIMIT_DEPOSIT_MODE_ON && isOverDepositLimit;

  // 실행 가능 여부: 기존 조건 + 입금 제한
  const isExecutable = state.isStartable && !isOverDepositLimit;
  // ─────────────────────────────────────────────
  // console.log("PairStartPanel render", item, poolAddress, tokenId);

  return (
    <PanelContainer layoutId="detail-pair">
      <motion.div
        layout={false}
        {...defaultTransition}
        className="flex w-full flex-col"
      >
        <PairStartAmountInput
          index={0}
          state={state}
          price={price}
          normalMaxAmount={normalMaxAmount0}
          limitMaxAmount={maxToken0}
          limitModeOn={LIMIT_DEPOSIT_MODE_ON}
        />
        <PairStartAmountInput
          index={1}
          state={state}
          price={price}
          normalMaxAmount={normalMaxAmount1}
          limitMaxAmount={maxToken1}
          limitModeOn={LIMIT_DEPOSIT_MODE_ON}
        />
        {showSummary && <PairStartSummary item={item} state={state} />}
      </motion.div>
      <Filler />
      <ExecuteButtons
        execute={state.startFarming}
        executeText={executeText}
        isConnected={state.isConnected}
        isExecutable={isExecutable}
        isPending={state.isPending}
        isWrongNetwork={state.isWrongNetwork}
        tokenStatuses={state.tokenStatuses}
        variant="MINT"
        showDepositLimitInfo={showDepositLimitInfo}
      />
    </PanelContainer>
  );
}
