import { createConfig } from "wagmi";
import { mainnet, sepolia, base } from "wagmi/chains";
import { http } from "viem";
import { giwaSepolia } from "@/const/networks";

const INFURA_PROJECT_ID = process.env.NEXT_PUBLIC_INFURA_PROJECT_ID;
// createConfig에 직접 chains 배열과 transports 객체를 넘깁니다.
export const config = createConfig({
  chains: [mainnet, sepolia, giwaSepolia, base],
  transports: {
    [mainnet.id]: http(`https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`),
    [sepolia.id]: http(`https://sepolia.infura.io/v3/${INFURA_PROJECT_ID}`),
    [giwaSepolia.id]: http("https://sepolia-rpc.giwa.io"),
    [base.id]: http(`https://base-mainnet.infura.io/v3/${INFURA_PROJECT_ID}`),
  },
});
