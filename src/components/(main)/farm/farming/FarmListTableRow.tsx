import {
  Dispatch,
  Fragment,
  SetStateAction,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";

import { Farm } from "@/types/FarmListTableRowProps";
import { BigDecimal } from "@/types/BigDecimal";
import useFarmStatus from "@/hooks/farm/useFarmStatus";

import FarmDetail from "./FarmDetail";
import FarmListRowSummary from "./FarmListRowSummary";

export default function FarmListTableRow({
  item,
  balance,
  setSelectedRow,
  selectedRow,
  onUpdate,
  chainId,
}: {
  item: Farm;
  balance?: BigDecimal;
  setSelectedRow: Dispatch<SetStateAction<string | null>>;
  selectedRow: string | null;
   onUpdate?: (address: string, status: { apy: BigDecimal; tvl: BigDecimal | null; MyBalance: BigDecimal | null }) => void;
  chainId: number;
}) {
  const isActive = useMemo(
    () => selectedRow === item.wip_stakeToken.fullName,
    [selectedRow, item.wip_stakeToken.fullName],
  );
  const onClick = useCallback(() => {
    if (isActive) setSelectedRow(null);
    else setSelectedRow(item.wip_stakeToken.fullName);
  }, [item.wip_stakeToken.fullName, setSelectedRow, isActive]);
  const { apy, tvl, price} = useFarmStatus(item.wip_stakeToken);
  const MyBalance = balance && price ? balance.mul(price) : null;

  // 이전 상태 저장용 useRef
  const prevStatus = useRef<{ apy?: string; tvl?: string; MyBalance?: string }>({});

    // 부모로 계산 상태를 올려보냄
  useEffect(() => {
    const apyStr = apy?.toString() ?? "";
    const tvlStr = tvl?.toString() ?? "";
    const myBalanceStr = MyBalance?.toString() ?? "";

    if (
      onUpdate &&
      item.wip_stakeToken.addresses &&
      (
        prevStatus.current.apy !== apyStr ||
        prevStatus.current.tvl !== tvlStr ||
        prevStatus.current.MyBalance !== myBalanceStr
      )
    ) {
      onUpdate(item.wip_stakeToken.addresses[chainId], { apy, tvl, MyBalance });
      prevStatus.current = { apy: apyStr, tvl: tvlStr, MyBalance: myBalanceStr };
    }
  }, [apy, tvl, MyBalance, onUpdate, item.wip_stakeToken.addresses, chainId]);

  return (
    <Fragment key={item.wip_stakeToken.fullName}>
      <FarmListRowSummary
        apy={apy}
        balance={balance}
        isActive={isActive}
        item={item}
        tvl={tvl}
        price={price}
        onClick={onClick}
      />
      <FarmDetail item={item} selectedRow={selectedRow} />
    </Fragment>
  );
}
