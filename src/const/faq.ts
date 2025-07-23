export enum FaqFilter {
  GENERAL = "GENERAL",
  SWAP = "SWAP",
  FARM = "FARM",
  CAGE = "CAGE",
  TROUBLESHOOTING = "TROUBLESHOOTING",
}

export const items = [
  {
    key: "what-is-birdie",
    topic: [FaqFilter.GENERAL],
    title: "What is Birdie?",
    content:
      "Birdie is a decentralized, non-custodial software platform that allows users to simultaneously earn trading fee rewards from a decentralized exchange (DEX) and interest from lending. By supplying liquidity through Birdie, you can benefit from two distinct sources of income, and you retain the flexibility to withdraw your liquidity at any time.",
  },
  {
    key: "need-wallet",
    topic: [FaqFilter.GENERAL],
    title: "Do I need a wallet to interact with Birdie?",
    content:
      "Yes. Because Birdie is deployed on a blockchain network, you must have a wallet compatible with that network in order to use Birdie. Common options include mobile wallets, browser wallets, and WalletConnect. When you connect your wallet to Birdie, you will sign messages and transactions within your wallet to confirm any actions taken on Birdie.",
  },
  {
    key: "cost-of-using-birdie",
    topic: [FaqFilter.GENERAL],
    title: "What is the cost of interacting with Birdie?",
    content:
      "Generally, users may encounter three main costs when using Birdie:\n\n1. Gas fees on the blockchain network\n2. Usage fees imposed by the underlying protocol\n3. Birdie software fees\n\nThe first two costs are common to most DeFi (Decentralized Finance) protocols and are not directly related to Birdie. The Birdie software fee is a fixed amount charged only when accumulated trading fees are automatically harvested. These collected fees are used to cover expenses such as the gas required for automated harvesting, as well as other operational costs of the software. Importantly, this fee is not charged on an individual basis. Rather, it is allocated proportionally among all participants supplying liquidity to a given pool, based on their respective shares. Consequently, the effective fee borne by any single user is typically significantly lower than the nominal fixed fee.",
  },
  {
    key: "risks",
    topic: [FaqFilter.GENERAL],
    title: "What are the risks involved in using Birdie?",
    content:
      "No protocol is entirely without risk, but Birdie has taken various measures to mitigate potential issues. Birdie's code is publicly available and has undergone multiple audits. Below are the main categories of risk:\n\n- Smart Contract Risk: There may be bugs or vulnerabilities in Birdie's smart contracts.\n- Oracle Risk: Because Birdie relies on external data providers (e.g., for price feeds), any failure or compromise of an oracle may result in incorrect asset valuations.\n- Underlying Protocol Risk: Birdie uses other DeFi protocols—such as DEXs, lending platforms, and yield farming—to generate returns. If these protocols carry inherent risks, you would be exposed to those risks as well.",
  },
  {
    key: "risk-mitigation",
    topic: [FaqFilter.GENERAL],
    title: "What steps are taken to mitigate risks?",
    content:
      "- Smart Contract Security: Birdie's code is publicly available and has been audited by multiple reputable institutions.\n- Oracle Protection: We employ various methods to ensure stable and tamper-resistant price feeds.\n- Underlying Protocol Selection: We carefully choose protocols that have demonstrated stability and reliability to minimize risk.",
  },
  {
    key: "how-to-supply",
    topic: [FaqFilter.FARM],
    title: "How do I supply?",
    content:
      '1. Click on the "Farm" menu at the top of the page.\n2. Select a pool from the Pool List and click on it to reveal the details.\n3. Enter the amount you wish to supply and click "Start Farming."\n4. Approve the transaction within your connected wallet.\n\nOnce the transaction is confirmed, your supply is successfully registered and begins to earn yield. Be sure you have sufficient tokens in your wallet for the selected pool, as well as a small amount of ETH to cover gas fees.',
  },
  {
    key: "how-much-earn",
    topic: [FaqFilter.FARM],
    title: "How much can I earn?",
    content:
      "As a liquidity provider, you will earn a continuous return that varies based on market conditions. The Annual Percentage Yield (APY) shown on the page is derived from historical data and may not perfectly reflect actual returns.\n\n- Interest Income: You share in the interest paid by borrowers, calculated by multiplying the token's average lending rate by the utilization rate in the underlying protocol. Higher utilization generally translates to higher returns for liquidity providers.\n- Trading Fee Income: Whenever trades occur in your chosen pool via the Birdie swap interface, you receive a share of the trading fees according to the fee distribution model for that pool.",
  },
  {
    key: "supply-limitations",
    topic: [FaqFilter.FARM],
    title: "Are there limitations to supply?",
    content:
      "Birdie itself does not impose specific limitations on supply. However, if the underlying protocol enforces its own supply constraints, those will apply.",
  },
  {
    key: "how-to-withdraw",
    topic: [FaqFilter.FARM],
    title: "How do I withdraw?",
    content:
      '1. Locate the pool you wish to withdraw from under the "Farm" menu.\n2. Click on it to reveal the details.\n3. Enter the amount you want to withdraw and click "Stop Farming."\n4. Approve the transaction in your connected wallet.\n\nOnce the transaction is confirmed, your withdrawal is processed and the tokens will be returned to your wallet.',
  },
  {
    key: "how-to-earn-profit",
    topic: [FaqFilter.FARM],
    title: "What do I have to do to earn profits?",
    content:
      "Essentially nothing beyond supplying your tokens. Birdie automates all tasks related to generating returns. You only need to provide liquidity in one of Birdie's pools.",
  },
  {
    key: "underlying-protocol",
    topic: [FaqFilter.GENERAL],
    title: "What is an Underlying Protocol?",
    content:
      "An underlying protocol refers to any DeFi protocol that Birdie utilizes to generate returns—commonly DEXs, lending platforms, or yield farming protocols.",
  },
  {
    key: "choose-underlying-protocol",
    topic: [FaqFilter.GENERAL],
    title: "Can I choose which Underlying Protocol to use?",
    content:
      "Not directly. When Birdie launches a new pool, the underlying protocol is predetermined to maintain stability and prevent liquidity fragmentation. However, you can review which underlying protocol each pool uses and select the pool (and thus the protocol) that best aligns with your preferences.",
  },
  {
    key: "principal-guarantee",
    topic: [FaqFilter.GENERAL],
    title: "Does Birdie guarantee my principal?",
    content:
      "Birdie is merely a software tool designed to help users easily engage with DeFi protocols of their choosing, and does not itself produce any direct gain or loss to a user's principal. Any profit or loss arising from the liquidity you provide is determined by the performance of the underlying protocol used by the chosen pool, and is therefore independent of Birdie.",
  },
  {
    key: "birdie-points",
    topic: [FaqFilter.GENERAL],
    title: "How can I earn Birdie Points?",
    content:
      "Birdie Points are awarded whenever you execute a token swap using Birdie's own swap interface, irrespective of the transaction amount. For further information on how points are earned, please consult our documentation.",
  },
  {
    key: "birdie-index",
    topic: [FaqFilter.GENERAL],
    title: "What is the Birdie Index?",
    content:
      "When you supply liquidity through Birdie, you receive LP tokens as evidence of your contribution. However, merely knowing the number of LP tokens does not indicate the overall value of your liquidity. For this reason, we introduced the Birdie Index. By multiplying your LP token balance by the Birdie Index, you can approximate the dollar value of your liquidity in that specific token pair.",
  },
  {
    key: "how-to-swap",
    topic: [FaqFilter.SWAP],
    title: "How do I swap?",
    content:
      '1. Select the "Swap" menu at the top of the page.\n2. In the swap interface, choose the tokens you wish to exchange.\n3. Confirm the transaction in your connected wallet.\n\nOur interface is designed to be intuitive, similar to other widely used DEXs. However, please note that you can only swap tokens that are listed as part of Birdie Farm\'s token pairs.',
  },
  {
    key: "price-impact",
    topic: [FaqFilter.SWAP],
    title: "What is Price Impact?",
    content:
      "Price Impact measures the extent to which your trade affects the token price in a particular liquidity pool. It is the difference between the current market price and the price following the execution of your trade. In a pool with substantial liquidity, the price impact is typically lower, whereas in a pool with less liquidity, the effect may be more pronounced. A higher price impact can lead to greater losses, and this rate fluctuates continuously due to supply and demand within the pool.",
  },
  {
    key: "birdie-fee",
    topic: [FaqFilter.GENERAL],
    title: "How much is the Birdie software fee?",
    content:
      "The Birdie software fee is charged when the returns generated by the underlying protocol are harvested and reinvested. Executing the harvest process requires a transaction, which incurs gas fees. To cover these gas costs and other operational expenses, Birdie imposes a fixed fee whenever a harvest takes place. This fixed fee is not applied to any single individual; rather, it is shared proportionally among all participants in the pool according to their respective liquidity shares. Consequently, the amount each user actually pays is substantially lower than the nominal fixed fee.\n\nMoreover, in order to avoid charging fees on minimal returns, Birdie sets a minimum profit threshold tied to the fixed fee. Harvesting occurs only if the pool's accumulated returns exceed this threshold. For instance, if the fixed fee for one harvest is set at 0.001 ETH, Birdie might establish a minimum profit threshold of 0.01 ETH. Under this arrangement, harvesting would proceed only if the pool's yield prior to harvest is greater than 0.01 ETH. Even when a harvest is triggered, the 0.001 ETH fee is distributed among all liquidity providers based on their contribution ratios, thereby ensuring that the actual fee borne by each individual is significantly less than 0.001 ETH.",
  },
];
