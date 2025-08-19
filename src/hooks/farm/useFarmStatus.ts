import { useContext, useState, useEffect, useCallback, useRef, use } from "react";
import { IBirdieLPFarm, IBirdieSingleFarm } from "@/const/contracts/types/tokenTypes";
import { BigDecimal } from "@/types/BigDecimal";
import { AssetsContext } from "@/app/AssetsContextProvider";
// import useFarmTVL from "./useFarmTVL";
// import useFarmPrice from "./useFarmPrice";
// import { WalletContext } from "@/app/WalletContextProvider";
import useFarmCalc from "./useFarmCalc";
export default function useFarmStatus(farm: IBirdieSingleFarm | IBirdieLPFarm) {
  const { assetValues} = useContext(AssetsContext);

  const apy = BigDecimal.ZERO();

  const [tvl, setTvl] = useState<BigDecimal | null>(null);
  const [totalSupply, setTotalSupply] = useState<BigDecimal | null>(null);
  const [price, setPrice] = useState<BigDecimal | null>(null);

  useFarmCalc({ farm, assetValues, setTvl, setTotalSupply, setPrice });
  console.log("useFarmStatus", farm, { apy, tvl, totalSupply, price });  
  return { apy, tvl, price };
}
