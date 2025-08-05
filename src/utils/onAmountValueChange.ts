import { IToken } from "@/const/contracts/types/tokenTypes";
import { BigDecimal } from "@/types/BigDecimal";

export function onAmountValueChange(
  v: string,
  token: IToken,
  setAmountStr: (v: string) => void,
  setAmountBD?: (v: BigDecimal) => void,
) {
  console.log("onAmountValueChange", v, token);
  // Test if v is a number using regex
  const regexTest = /^[0-9]*\.?[0-9]*$/.test(v);

  if (regexTest) {
    let newValue = v;

    if (v.includes(".")) {
      const parts = v.split(".");

      if (parts[1].length > (token.decimals ?? 18)) {
        newValue = parts[0] + "." + parts[1].slice(0, token.decimals ?? 18);
      }
    }
    if (newValue.startsWith(".")) {
      newValue = "0" + newValue;
    }


    
    try {
      const parsedValue = new BigDecimal(newValue);

      if (parsedValue.gt(1e18)) return;
      
      setAmountBD?.(parsedValue);
    } catch (e: unknown) {
      console.error("Error parsing value:", e);
      setAmountBD?.(BigDecimal.ZERO());
    }

    setAmountStr(newValue);
  }
}
