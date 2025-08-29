import { BigDecimal } from "@/types/BigDecimal";
import "./components.css";
import suffixNumbers from "@/utils/suffixNumbers";

function Price(props: { value: BigDecimal | null; isLoading?: boolean }) {
  return (
    <span
      className="data-[loading=true]:loading ml-1"
      data-loading={props.isLoading}
    >
      {props.value?.toFixed(2) || "..."}
    </span>
  );
}

function Apy(props: {
  value: BigDecimal | number | null;
  isLoading?: boolean;
}) {
  const s = props.value?.toFixed?.(2) as string | undefined;
  const display = s ? (parseFloat(s) > 999.99 ? "999.99" : s) : "...";

  return (
    <span
      className="data-[loading=true]:loading text-sm font-semibold max-md:font-medium"
      data-loading={props.isLoading}
    >
      {display /* {props.value?.toFixed(2) || "..."}% */}%
    </span>
  );
}

function Tvl(props: { tvl: BigDecimal | null; isLoading?: boolean }) {
  return (
    <span
      className="data-[loading=true]:loading text-sm font-semibold max-md:font-medium"
      data-loading={props.isLoading}
    >
      {props.tvl ? `$ ${suffixNumbers(props.tvl, 0, 2, false, false)}` : "..."}
    </span>
  );
}

const Components = {
  Price,
  Apy,
  Tvl,
};

export default Components;
