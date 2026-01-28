export enum FaqFilter {
  GENERAL = "GENERAL",
  SWAP = "SWAP",
  FARM = "FARM",
  EASY = "EASY",
  TROUBLESHOOTING = "TROUBLESHOOTING",
}

export const items = [
  // 1. General
  {
    key: "what-is-birdieswap",
    topic: [FaqFilter.GENERAL],
    title: "What is Birdieswap?",
    content:
      "Birdieswap is a decentralized interface software that helps users seamlessly connect and utilize various DeFi protocols. We do not operate a bank or exchange ourselves. Instead, we provide Router technology that connects verified external protocols (Yield Vaults, DEXs, etc.), enabling users to enjoy the benefits of both Deposit Yields and Trading Fees simultaneously without complex processes.",
  },
  {
    key: "is-birdieswap-a-dex",
    topic: [FaqFilter.GENERAL, FaqFilter.SWAP],
    title: "Is Birdieswap a DEX (AMM) itself?",
    content:
      "No, Birdieswap does not operate its own AMM. Users perform swaps or liquidity provision just like on a standard DEX, but the actual trade execution and liquidity reside in the connected external DEXs. The Birdieswap Router automates the complex steps in between, such as Deposit → Wrap → Swap → Redeem.",
  },
  {
    key: "do-i-need-a-wallet",
    topic: [FaqFilter.GENERAL],
    title: "Do I need a wallet to use the service?",
    content:
      "Yes. Since Birdieswap is a non-custodial service, no sign-up is required. You can instantly access all features by connecting a personal cryptocurrency wallet (like MetaMask) that supports the networks Birdieswap operates on.",
  },
  {
    key: "are-my-assets-safe",
    topic: [FaqFilter.GENERAL, FaqFilter.SWAP, FaqFilter.FARM],
    title: "Are my assets safe?",
    content:
      "Birdieswap never holds or controls your funds directly. Your assets only move between external protocols and your wallet via smart contracts. However, as Birdieswap is a software tool, it is subject to the risks of connected external protocols (hacks, policy changes) and market volatility. Please consider these risks carefully before using the service.",
  },

  // 2. Features & Concepts
  {
    key: "how-is-dual-yield-possible",
    topic: [FaqFilter.GENERAL, FaqFilter.FARM],
    title: "How is Dual Yield possible?",
    content:
      "It works by utilizing capital efficiently. The Birdieswap Router deposits your assets into (1) external protocols to generate Basic Rewards (interest) and (2) simultaneously supplies them as liquidity to a DEX to generate Trading Fees. The software automatically connects these two processes.",
  },
  {
    key: "what-are-btokens",
    topic: [FaqFilter.GENERAL, FaqFilter.SWAP, FaqFilter.FARM],
    title: "What are bTokens?",
    content:
      "bTokens are standardized versions of deposit proof tokens (receipt tokens) from various external protocols, created by Birdieswap. When users supply assets, the Router converts them into bTokens to ensure smooth trading across different protocols.",
  },
  {
    key: "how-does-auto-compounding-work",
    topic: [FaqFilter.GENERAL, FaqFilter.FARM],
    title: "How does Auto-Compounding work?",
    content:
      "All earnings (Deposit Yield + Trading Fees) are automatically harvested and compounded into the principal by the system. This allows users to enjoy compound interest effects without manually harvesting rewards.",
  },

  // 3. Easy Mode
  {
    key: "what-is-easyenter",
    topic: [FaqFilter.EASY],
    title: "What is EasyEnter?",
    content:
      "EasyEnter is a feature that allows you to complete liquidity provision and staking with a single click using only ETH in your wallet, without complex ratio calculations or swaps. The Router automatically distributes assets and handles the necessary steps.",
  },
  {
    key: "what-is-easypay",
    topic: [FaqFilter.EASY],
    title: "What is EasyPay?",
    content:
      "EasyPay is a feature that allows you to automatically convert only the necessary amount into USDC and send it without unwinding your entire staked position. You can utilize your investment assets flexibly, just like a checking account.",
  },
  {
    key: "why-set-tolerance",
    topic: [FaqFilter.EASY, FaqFilter.TROUBLESHOOTING],
    title: "Why do I need to set Tolerance?",
    content:
      "Tolerance is a safety buffer to prevent falling short of the target amount due to minor price fluctuations when converting tokens in Easy Mode. The system calculates with a margin based on the set value (default 5%), and 100% of the remaining balance is immediately refunded after the transfer.",
  },

  // 4. Fees & Policy
  {
    key: "fee-for-using-birdieswap",
    topic: [FaqFilter.GENERAL],
    title: "What is the fee for using Birdieswap software?",
    content:
      "During the current Beta period, Birdieswap does not charge separate service fees (e.g., in ETH) directly to users. Instead, we operate a Reserve Rate policy.",
  },
  {
    key: "what-is-reserve-rate",
    topic: [FaqFilter.GENERAL, FaqFilter.FARM],
    title: "What is the Reserve Rate?",
    content:
      "Reserve Rate is a policy where, when the system automatically harvests rewards (such as swap fees), 50% is reinvested into the user's principal, and the remaining 50% is accumulated in a Reserve Vault. These funds are not used for the project team's operating expenses but are reserved for the future community and ecosystem.",
  },
  {
    key: "are-gas-fees-higher",
    topic: [
      FaqFilter.GENERAL,
      FaqFilter.EASY,
      FaqFilter.FARM,
      FaqFilter.TROUBLESHOOTING,
    ],
    title: "Are gas fees higher than standard transfers?",
    content:
      "Technically, yes—because multiple steps like Deposit → Wrap → Supply → Stake are executed simultaneously in a single click, requiring more gas units than a simple transfer.\n\nHowever, since Birdieswap operates on Layer 2 networks (e.g., Base) where gas fees are extremely low, the actual cost difference is typically negligible. You can enjoy the convenience of automated complex processes with almost no noticeable increase in fees.",
  },

  // 5. Troubleshooting
  {
    key: "tx-failed-or-buttons-disabled",
    topic: [FaqFilter.TROUBLESHOOTING],
    title: "My transaction failed or buttons are disabled.",
    content:
      "This usually happens for the following reasons:\n\n1. Exceeded Slippage: The market price changed rapidly and exceeded your set range. Try increasing the slippage setting slightly.\n2. Insufficient Gas (ETH): Check if you have enough ETH in your wallet to pay for network fees.\n3. Approval Needed: You must approve the use of tokens in your wallet when using them for the first time.",
  },
];
