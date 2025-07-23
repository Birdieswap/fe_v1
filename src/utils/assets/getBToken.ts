import singleVaults from "@/const/contracts/tokens/singleVaults";
import { EProvider, ICurrency } from "@/const/contracts/types/tokenTypes";

const vaults = Object.values(singleVaults);

export default function getBToken(props: {
  token: ICurrency;
  chainId: number;
  provider?: EProvider;
}) {
  return vaults.find((v) => {
    if (props.provider) {
      return (
        v.input.addresses[props.chainId] ===
          props.token.addresses[props.chainId] &&
        v.provider.provider === props.provider
      );
    } else
      return (
        v.input.addresses[props.chainId] ===
        props.token.addresses[props.chainId]
      );
  });
}
