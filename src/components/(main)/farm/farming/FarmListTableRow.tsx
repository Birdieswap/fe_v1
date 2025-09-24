import {
  Dispatch,
  Fragment,
  SetStateAction,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Farm } from "@/types/FarmListTableRowProps";
import { BigDecimal } from "@/types/BigDecimal";

import FarmDetail from "./FarmDetail";
import FarmListRowSummary from "./FarmListRowSummary";

export default function FarmListTableRow({
  item,
  balance,
  setSelectedRow,
  selectedRow,
  chainId,
  apy,
  tvl,
  price,
}: {
  item: Farm;
  balance?: BigDecimal;
  setSelectedRow: Dispatch<SetStateAction<string | null>>;
  selectedRow: string | null;
  chainId: number;
  apy: BigDecimal;
  tvl: BigDecimal | null;
  price: BigDecimal | null;
}) {
  const isActive = useMemo(
    () => selectedRow === item.wip_stakeToken.fullName,
    [selectedRow, item.wip_stakeToken.fullName]
  );
  const onClick = useCallback(() => {
    if (isActive) setSelectedRow(null);
    else setSelectedRow(item.wip_stakeToken.fullName);
  }, [item.wip_stakeToken.fullName, setSelectedRow, isActive]);

  // console.log(
  //   "FarmListTableRow selectedRow",
  //   selectedRow,
  //   "fullname",
  //   item.wip_stakeToken.fullName
  // );

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

      <FarmDetail item={item} selectedRow={selectedRow} price={price} />
    </Fragment>
  );
}
