import { BigDecimal } from "@/types/BigDecimal";
import { IToken } from "@/const/contracts/types/tokenTypes";
import suffixNumbers from "@/utils/suffixNumbers";

export default function BalanceDisplay({
  balance,
  token,
}: {
  balance: BigDecimal;
  token?: IToken;
}) {
  const displayDecimals = token?.displayDecimals ?? token?.decimals ?? 18;

  return (
    <span className="flex flex-row gap-2.5">
      <span className="font-semibold">Balance </span>
      {suffixNumbers(balance, 100_000, displayDecimals, true, true)}
    </span>
  );
}
