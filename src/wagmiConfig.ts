import { createConfig } from 'wagmi'
import { mainnet, sepolia, base } from 'wagmi/chains'
import { http } from 'viem'

const INFURA_PROJECT_ID = process.env.NEXT_PUBLIC_INFURA_PROJECT_ID;
// createConfig에 직접 chains 배열과 transports 객체를 넘깁니다.
export const config = createConfig({
  chains: [mainnet, sepolia, base],
  transports: {
    [mainnet.id]: http(`https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`),
    [sepolia.id]: http(`https://sepolia.infura.io/v3/${INFURA_PROJECT_ID}`),
    [base.id]: http(`https://base-mainnet.infura.io/v3/${INFURA_PROJECT_ID}`),
  }
});

