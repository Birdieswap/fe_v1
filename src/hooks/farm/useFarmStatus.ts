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

  return { apy, tvl, price };
}

/*   const { qty, refetchQty } = useFarmPrice(farm);
  const { tvl, refetchTVL } = useFarmTVL(farm, assetValues);

  const [price, setPrice] = useState<BigDecimal | null>(null);


  const didFetchRef = useRef(false);
  

    const refetchAll = useCallback(async () => {
    await refetchAssets();
    const [freshQty, freshTVL] = await Promise.all([refetchQty(), refetchTVL()]);
    // 강제 로그로 확인
     console.log("[useFarmStatus] refetchAll:", {
      freshQty: freshQty?.toString(),
      freshTVL: freshTVL?.toString()
    });
    // 상태 할당으로 리렌더링 유도
   if (freshQty && freshTVL && !freshQty.isZero()) {
      setPrice(new BigDecimal(freshTVL.div(freshQty).toString()));
    } else {
      setPrice(null);
    }
  }, [refetchAssets, refetchQty, refetchTVL]);

  useEffect(() => {
    if (qty && tvl && !qty.isZero()) {
      const calculatedPrice = tvl.div(qty);
      setPrice(new BigDecimal(calculatedPrice.toString()));
    } else {
      setPrice(null);
    }
  }, [qty, tvl]);
  
  console.log("[useFarmStatus] qty:", qty?.toString(), "tvl:", tvl?.toString(), "price:", price?.toString());

  useEffect(() => {
    console.log("[useFarmStatus] chainId or farm changed, reset fetch flag and price");
    didFetchRef.current = false;
    setPrice(null);
  }, [chainId, farm]);

  useEffect(() => {
    if (!didFetchRef.current) {
      console.log("[useFarmStatus] first fetchAll call");
      refetchAll();
      didFetchRef.current = true;
    }
  }, [refetchAll]);

  return { apy, tvl, price, refetchAll};
} */