import { Button, cn, Spinner } from "@heroui/react";

import { Farm } from "@/types/FarmListTableRowProps";

import { SectionHeader } from "../common/SectionHeader";

import VaultInfo from "./earningsPanel/VaultInfo";
import RewardInfoRow from "./earningsPanel/RewardInfoRow";
import { useState, useMemo, use, useContext } from "react";
import { useChainId } from "wagmi";
import { AssetsContext } from "@/app/AssetsContextProvider";
import { aprDataState, AprVault } from "@/app/AssetsContextProvider";
import Icons from "@/assets/icons/icons";

type Period = "1d" | "7d" | "30d";
type PeriodKey = "apr_1d" | "apr_7d" | "apr_30d";

type AprEntry = {
  chain_id: string;
  contract_address: string;
  name: string;
  vaults: AprVault[];
  extra_rewards?: AprVault[];
};

export type VaultRowItem = {
  kind: "vault" | "reward";
  name: string; // reward는 "Reward - xxx" 로 렌더용 이름
  rawName: string; // 원래 이름
  apy: number; // 10^16으로 나눈 값(%) — 우측 라벨에 사용
  aprSource: AprVault; // 1d/7d/30d 원본 값들
};

function ButtonSelector(props: {
  selected: Period;
  value: Period;
  setTab: (value: Period) => void;
  name: string;
}) {
  return (
    <Button
      className={cn(
        "group p-0 flex max-h-max min-h-min min-w-min max-w-max flex-row",
        "data-[hover=true]:bg-transparent data-[hover=true]:opacity-70"
      )}
      data-selected={props.value === props.selected}
      radius="none"
      variant="light"
      onPress={() => props.setTab(props.value)}
    >
      <h2
        className={cn(
          "text-[12px] font-semibold leading-[17px]",
          "dark:group-data-[selected=false]:text-default-200"
        )}
      >
        {props.name}
      </h2>
    </Button>
  );
}

export default function EarningsPanel({ item }: { item: Farm }) {
  const [tab, setTab] = useState<Period>("1d");
  const chainId = useChainId();
  const { aprDataState } = useContext(AssetsContext);
  const aprList: AprEntry[] = aprDataState?.apr ?? [];

  const periodKey: PeriodKey = useMemo(() => {
    if (tab === "1d") return "apr_1d";
    if (tab === "7d") return "apr_7d";
    return "apr_30d";
  }, [tab]);

  console.log("EarningsPanel", item.details.rewards);

  const stakeAddr = item?.wip_stakeToken?.addresses?.[chainId];

  const stakeAddrLower = (stakeAddr ?? "").toLowerCase();
  const chainIdStr = String(chainId);

  // APR 엔트리 매칭
  const matched = useMemo(
    () =>
      aprList.find(
        (e) =>
          e.chain_id === chainIdStr &&
          (e.contract_address ?? "").toLowerCase() === stakeAddrLower
      ),
    [aprList, chainIdStr, stakeAddr]
  );

  const toRowItem = (src: AprVault, kind: "vault" | "reward"): VaultRowItem => {
    const raw = src?.[periodKey];
    const aprNum = raw ? Number(raw) : 0;
    const pct = aprNum / 1e16; // ← 요구사항: 10^16으로 나눔
    return {
      kind,
      name: kind === "reward" ? `Reward - ${src.name}` : src.name,
      rawName: src.name,
      apy: pct,
      aprSource: src,
    };
  };

  // Vaults 영역에 vaults → extra_rewards 순서로 하나의 리스트로 합치기
  const combinedRows: VaultRowItem[] = useMemo(() => {
    const vaultRows = (matched?.vaults ?? []).map((v) => toRowItem(v, "vault"));
    const rewardRows = (matched?.extra_rewards ?? []).map((r) =>
      toRowItem(r, "reward")
    );
    return [...vaultRows, ...rewardRows];
  }, [matched, periodKey]);

  // 모달로 넘길 item 확정: 클릭된 행 + 전체 컨텍스트
  const [modalItem, setModalItem] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = (rowItem: VaultRowItem) => {
    // 모달 payload: 선택된 행 + 전체 목록 + 현재 기간키 + 컨텍스트
    const allAprArray = [
      ...(matched?.vaults ?? []).map((v) => ({ kind: "vault" as const, ...v })),
      ...(matched?.extra_rewards ?? []).map((r) => ({
        kind: "reward" as const,
        ...r,
      })),
    ];

    const payload = {
      selected: rowItem, // 현재 클릭한 행(이게 그대로 VaultInfoModal의 item으로 전달)
      periodKey, // 현재 선택된 기간키
      chainId,
      contractAddress: stakeAddrLower,
      poolName: matched?.name ?? (item as any)?.name ?? "",
      allAprArray, // vaults + extra_rewards(원본 apr_1d/7d/30d 값 들어있음)
    };

    setModalItem(payload);
    setIsModalOpen(true);
  };

  return (
    <div className="mt-5 flex grow basis-0 flex-col">
      <div className="flex flex-row justify-between items-center">
        <SectionHeader>Vaults</SectionHeader>

        <div className="flex justify-end gap-3 pr-4">
          <ButtonSelector name="1d" selected={tab} setTab={setTab} value="1d" />
          <ButtonSelector name="7d" selected={tab} setTab={setTab} value="7d" />
          <ButtonSelector
            name="30d"
            selected={tab}
            setTab={setTab}
            value="30d"
          />
        </div>
      </div>
      <div className="mb-6 mt-[14px] flex grow basis-0 flex-col gap-4 rounded-2xl bg-background p-4 text-sm">
        {combinedRows.length > 0 ? (
          combinedRows.map((row, i) => (
            <VaultInfo
              key={i}
              item={row}
              periodKey={periodKey}
              onOpenModal={handleOpenModal} // 여기서 넘긴 item이 그대로 Modal에 전달될 준비 완료
            />
          ))
        ) : (
          <p className="text-default-500">
            <div className="flex gap-4 justify-center">
              <Spinner color="default" />
            </div>
          </p>
        )}
      </div>
      <SectionHeader>Extra Rewards</SectionHeader>
      {item.details.rewards.length === 0 ? (
        <div className="mt-[14px] flex grow flex-col items-center justify-center gap-4 rounded-2xl bg-background p-4">
          <Icons.WalletEmptyReward className="fill-light_mid_mint_2 dark:fill-dark_empty_state" />
          <span className="text-[12px] leading-[17px] text-default-700 max-sm:dark:text-default-600 text-center pb-2">
            <p>There are no extra rewards for this pool at the moment.</p>
            <p>
              But you are still enjoying the double growth rate of Birdieswap!{" "}
            </p>
          </span>
        </div>
      ) : (
        <div className="mt-[14px] flex grow basis-0 flex-col gap-4 rounded-2xl bg-background p-4 text-sm">
          {item.details.rewards.map((v) => {
            const amount = 0; // TODO calculate the balance
            const price = 0; // TODO calculate the price
            // const amount = v.amount.toFixed(v.token.balance?.decimals || 0);
            const dollarAmount = (amount * price).toFixed(2);
            const stakeAt = v.token.symbol;
            const stakeAtSrc = v.token.iconSrc;

            return (
              <RewardInfoRow
                key={stakeAt}
                amount={amount.toFixed(
                  v.token.displayDecimals ?? v.token.decimals ?? 3
                )}
                dollarAmount={dollarAmount}
                rewardToken={stakeAt}
                rewardTokenSrc={stakeAtSrc}
              />
            );
          })}

          <div className="flex grow flex-row items-center gap-2 text-foreground">
            <p className="grow text-sm">Claim all rewards into your wallet.</p>
            <Button
              className="btn-mint h-[43px] w-40 rounded-2xl text-base font-semibold"
              size="sm"
            >
              Claim
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
