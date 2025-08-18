import { IContractBase, IToken } from "@/const/contracts/types/tokenTypes";
import { BigDecimal } from "@/types/BigDecimal";

export default function getInsolvencyAmount(props: {
  contract?: IContractBase;
  token?: IToken;
  chainId: number;
}) {
  // TEMP LOGIC. IMPLEMENT LATER
  if (props.token?.symbol.includes("USD")) {
    return new BigDecimal(1_000_000_000_000, props.token?.decimals ?? 18);
  } else return new BigDecimal(5_000_000_000, props.token?.decimals ?? 18);
}
