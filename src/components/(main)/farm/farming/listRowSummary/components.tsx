import { BigDecimal } from "@/types/BigDecimal";
import "./components.css";
import suffixNumbers from "@/utils/suffixNumbers";
import { LoadingPulse } from "../FarmListRowSummary";

function Price(props: { value: BigDecimal | null; isLoading?: boolean }) {
  const isEmpty = props.value == null;
  if (props.isLoading || isEmpty) {
    return <LoadingPulse w="w-10" className="ml-1" />;
  }

  return (
    <span
      className="data-[loading=true]:loading ml-1"
      data-loading={props.isLoading}
    >
      {props.value?.toFixed(2)}
    </span>
  );
}

function Apy(props: {
  value: BigDecimal | number | null;
  isLoading?: boolean;
}) {
  // const s = props.value?.toFixed?.(2) as string | undefined;
  // const display = s ? (parseFloat(s) > 999.99 ? "999.99" : s) : "...";

  const num = (() => {
    const v = props.value as any;
    if (v == null) return NaN;
    if (typeof v === "number") return v;
    // BigDecimal 대응: toFixed or toPrecisionString 우선 사용
    if (typeof v?.toFixed === "function") return parseFloat(v.toFixed(2));
    if (typeof v?.toPrecisionString === "function")
      return parseFloat(v.toPrecisionString()); // 소수점 문자열을 숫자로
    if (typeof v?.toString === "function") return parseFloat(v.toString());
    return NaN;
  })();

  const isEmpty = Number.isNaN(num);
  if (props.isLoading || isEmpty) {
    return <LoadingPulse w="w-12" />;
  }

  return (
    <span
      className="data-[loading=true]:loading text-sm font-semibold max-md:font-medium"
      data-loading={props.isLoading}
    >
      {`${num} %`}
    </span>
  );
}

function Tvl(props: { tvl: BigDecimal | null; isLoading?: boolean }) {
  const isEmpty = props.tvl == null;
  if (props.isLoading || isEmpty) {
    return <LoadingPulse w="w-16" />;
  }

  return (
    <span
      className="data-[loading=true]:loading text-sm font-semibold max-md:font-medium"
      data-loading={props.isLoading}
    >
      {`$ ${suffixNumbers(props.tvl!, 0, 2, false, false)}`}
    </span>
  );
}

const Components = {
  Price,
  Apy,
  Tvl,
};

export default Components;
