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

  // 2) 표시 문자열: 숫자가 아니면 "...", 숫자면 상한 캡 + 소수 2자리
  const display = Number.isFinite(num)
    ? Math.min(num, 9999.99).toFixed(2)
    : "...";

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
