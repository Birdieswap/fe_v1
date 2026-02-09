import { BigDecimal } from "@/types/BigDecimal";
import { IToken } from "@/const/contracts/types/tokenTypes";
import suffixNumbers from "@/utils/suffixNumbers";
import { useEffect, useState } from "react";

export default function BalanceDisplay({
  balance,
  token,
}: {
  balance: BigDecimal;
  token?: IToken;
}) {
  const displayDecimals = token?.displayDecimals ?? token?.decimals ?? 18;

  const [isSmall, setIsSmall] = useState(false);

  useEffect(() => {
    const checkWidth = () => setIsSmall(window.innerWidth < 440);
    checkWidth(); // 초기 실행
    window.addEventListener("resize", checkWidth);
    return () => window.removeEventListener("resize", checkWidth);
  }, []);

  return (
    <span className="flex flex-row gap-1.5 text-default-800 dark:text-default-300">
      <span className="font-semibold max-[375px]:text-[11px] text-default-900 dark:text-default-200">
        {isSmall ? "BAL" : "Balance"}
      </span>
      {suffixNumbers(
        balance,
        isSmall ? 999 : 100_000,
        isSmall ? 2 : displayDecimals,
        true,
        true,
      )}
    </span>
  );
}
