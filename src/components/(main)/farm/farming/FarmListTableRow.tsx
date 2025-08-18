import {
  Dispatch,
  Fragment,
  SetStateAction,
  useCallback,
  useMemo,
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
}: {
  item: Farm;
  balance?: BigDecimal;
  setSelectedRow: Dispatch<SetStateAction<string | null>>;
  selectedRow: string | null;
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
