import { Abi } from "viem";

export const birdieswap_staking_abi = [
  {
    type: "constructor",
    inputs: [
      {
        name: "configAddress_",
        type: "address",
        internalType: "address",
      },
      {
        name: "stakingTokenAddress_",
        type: "address",
        internalType: "address",
      },
      {
        name: "roleRouterAddress_",
        type: "address",
        internalType: "address",
      },
      {
        name: "zapAddress_",
        type: "address",
        internalType: "address",
      },
      {
        name: "underlying0_",
        type: "address",
        internalType: "address",
      },
      {
        name: "underlying1_",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "DEFAULT_ADMIN_ROLE",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "bytes32",
        internalType: "bytes32",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "DISTRIBUTOR_ROLE",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "bytes32",
        internalType: "bytes32",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "GUARDIAN_ROLE",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "bytes32",
        internalType: "bytes32",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "KEEPER_ROLE",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "bytes32",
        internalType: "bytes32",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "MANAGER_ROLE",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "bytes32",
        internalType: "bytes32",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "OPERATOR_ROLE",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "bytes32",
        internalType: "bytes32",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "addRewardToken",
    inputs: [
      {
        name: "_rewardToken",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "balanceOf",
    inputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "claim",
    inputs: [
      {
        name: "_rewardIndex",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "claimAll",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "claimMany",
    inputs: [
      {
        name: "_rewardIndices",
        type: "uint256[]",
        internalType: "uint256[]",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "deposit",
    inputs: [
      {
        name: "_stakeAmount",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "depositAndClaimAll",
    inputs: [
      {
        name: "_stakeAmount",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "depositsPaused",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "bool",
        internalType: "bool",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "earned",
    inputs: [
      {
        name: "_userAddress",
        type: "address",
        internalType: "address",
      },
      {
        name: "_rewardIndex",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "total",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "easyEnter",
    inputs: [
      {
        name: "_tokenIn",
        type: "address",
        internalType: "address",
      },
      {
        name: "_tokenInAmount",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "_beneficiary",
        type: "address",
        internalType: "address",
      },
      {
        name: "_dustReceiver",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "sharesMinted",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "token0Returned",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "token1Returned",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "easyEnterPaused",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "bool",
        internalType: "bool",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "easyPay",
    inputs: [
      {
        name: "_stakedAmount",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "_tokenOut",
        type: "address",
        internalType: "address",
      },
      {
        name: "_exactOut",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "_beneficiary",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "easyPayPaused",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "bool",
        internalType: "bool",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "emergencyWithdraw",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "fundReward",
    inputs: [
      {
        name: "_rewardIndex",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "_rewardAmount",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "_duration",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getAllRewardTokens",
    inputs: [],
    outputs: [
      {
        name: "tokens",
        type: "address[]",
        internalType: "address[]",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getPendingRewards",
    inputs: [
      {
        name: "_account",
        type: "address",
        internalType: "address",
      },
      {
        name: "_rewardIndices",
        type: "uint256[]",
        internalType: "uint256[]",
      },
    ],
    outputs: [
      {
        name: "pendingRewards",
        type: "uint256[]",
        internalType: "uint256[]",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getRemainingEmission",
    inputs: [
      {
        name: "_rewardIndex",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "remaining",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getRewardCount",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getRewardInfo",
    inputs: [
      {
        name: "_rewardIndex",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "token",
        type: "address",
        internalType: "address",
      },
      {
        name: "rewardPerTokenStored",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "lastUpdateTimestamp",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "rewardRate",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "periodFinish",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getRewardPerToken",
    inputs: [
      {
        name: "_rewardIndex",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "rewardPerToken",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getStakingToken",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getTotalSupply",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getVersion",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "string",
        internalType: "string",
      },
    ],
    stateMutability: "pure",
  },
  {
    type: "function",
    name: "i_underlying0",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "i_underlying1",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "pause",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "pauseDeposits",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "pauseEasyEnter",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "pauseEasyPay",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "pauseWithdrawals",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "paused",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "bool",
        internalType: "bool",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "rescueERC20",
    inputs: [
      {
        name: "_tokenAddress",
        type: "address",
        internalType: "address",
      },
      {
        name: "_receiverAddress",
        type: "address",
        internalType: "address",
      },
      {
        name: "_amount",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "unpause",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "unpauseDeposits",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "unpauseEasyEnter",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "unpauseEasyPay",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "unpauseWithdrawals",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "userRewardAccrued",
    inputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "userRewardPerTokenPaid",
    inputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "withdraw",
    inputs: [
      {
        name: "_withdrawAmount",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "withdrawAndClaimAll",
    inputs: [
      {
        name: "_withdrawAmount",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "withdrawalsPaused",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "bool",
        internalType: "bool",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "Paused",
    inputs: [
      {
        name: "account",
        type: "address",
        indexed: false,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "Unpaused",
    inputs: [
      {
        name: "account",
        type: "address",
        indexed: false,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
  {
    type: "error",
    name: "BirdieswapStakingV1__CannotRescueRewardToken",
    inputs: [],
  },
  {
    type: "error",
    name: "BirdieswapStakingV1__CannotRescueStakingToken",
    inputs: [],
  },
  {
    type: "error",
    name: "BirdieswapStakingV1__DepositsAlreadyPaused",
    inputs: [],
  },
  {
    type: "error",
    name: "BirdieswapStakingV1__DepositsNotPaused",
    inputs: [],
  },
  {
    type: "error",
    name: "BirdieswapStakingV1__DepositsPaused",
    inputs: [],
  },
  {
    type: "error",
    name: "BirdieswapStakingV1__DuplicatedClaimIndex",
    inputs: [],
  },
  {
    type: "error",
    name: "BirdieswapStakingV1__DuplicatedRewardToken",
    inputs: [],
  },
  {
    type: "error",
    name: "BirdieswapStakingV1__EasyEnterAlreadyPaused",
    inputs: [],
  },
  {
    type: "error",
    name: "BirdieswapStakingV1__EasyEnterNoSharesMinted",
    inputs: [],
  },
  {
    type: "error",
    name: "BirdieswapStakingV1__EasyEnterNotPaused",
    inputs: [],
  },
  {
    type: "error",
    name: "BirdieswapStakingV1__EasyEnterPaused",
    inputs: [],
  },
  {
    type: "error",
    name: "BirdieswapStakingV1__EasyEnterZeroAddress",
    inputs: [],
  },
  {
    type: "error",
    name: "BirdieswapStakingV1__EasyEnterZeroAmount",
    inputs: [],
  },
  {
    type: "error",
    name: "BirdieswapStakingV1__EasyPayAlreadyPaused",
    inputs: [],
  },
  {
    type: "error",
    name: "BirdieswapStakingV1__EasyPayBalanceInvariantViolated",
    inputs: [],
  },
  {
    type: "error",
    name: "BirdieswapStakingV1__EasyPayInsufficientOutput",
    inputs: [],
  },
  {
    type: "error",
    name: "BirdieswapStakingV1__EasyPayInvalidAddress",
    inputs: [],
  },
  {
    type: "error",
    name: "BirdieswapStakingV1__EasyPayInvalidAmount",
    inputs: [],
  },
  {
    type: "error",
    name: "BirdieswapStakingV1__EasyPayNotPaused",
    inputs: [],
  },
  {
    type: "error",
    name: "BirdieswapStakingV1__EasyPayPaused",
    inputs: [],
  },
  {
    type: "error",
    name: "BirdieswapStakingV1__ExceededMaxCap",
    inputs: [],
  },
  {
    type: "error",
    name: "BirdieswapStakingV1__ExceededMaxRewardTokens",
    inputs: [],
  },
  {
    type: "error",
    name: "BirdieswapStakingV1__GlobalPauseActive",
    inputs: [],
  },
  {
    type: "error",
    name: "BirdieswapStakingV1__InsufficientRewardBalance",
    inputs: [],
  },
  {
    type: "error",
    name: "BirdieswapStakingV1__InsufficientStakedBalance",
    inputs: [],
  },
  {
    type: "error",
    name: "BirdieswapStakingV1__InvalidAddress",
    inputs: [],
  },
  {
    type: "error",
    name: "BirdieswapStakingV1__InvalidAmount",
    inputs: [],
  },
  {
    type: "error",
    name: "BirdieswapStakingV1__InvalidConfiguration",
    inputs: [],
  },
  {
    type: "error",
    name: "BirdieswapStakingV1__InvalidContractAddress",
    inputs: [],
  },
  {
    type: "error",
    name: "BirdieswapStakingV1__InvalidDuration",
    inputs: [],
  },
  {
    type: "error",
    name: "BirdieswapStakingV1__InvalidRewardIndex",
    inputs: [],
  },
  {
    type: "error",
    name: "BirdieswapStakingV1__NonStandardToken",
    inputs: [],
  },
  {
    type: "error",
    name: "BirdieswapStakingV1__ReentrantCall",
    inputs: [],
  },
  {
    type: "error",
    name: "BirdieswapStakingV1__RewardFundingOverflow",
    inputs: [],
  },
  {
    type: "error",
    name: "BirdieswapStakingV1__RewardPrecisionZero",
    inputs: [],
  },
  {
    type: "error",
    name: "BirdieswapStakingV1__RewardRateTooHigh",
    inputs: [],
  },
  {
    type: "error",
    name: "BirdieswapStakingV1__RewardTokenNotWhitelisted",
    inputs: [],
  },
  {
    type: "error",
    name: "BirdieswapStakingV1__StakingTokenCannotBeRewardToken",
    inputs: [],
  },
  {
    type: "error",
    name: "BirdieswapStakingV1__UnauthorizedAccess",
    inputs: [],
  },
  {
    type: "error",
    name: "BirdieswapStakingV1__WithdrawalsAlreadyPaused",
    inputs: [],
  },
  {
    type: "error",
    name: "BirdieswapStakingV1__WithdrawalsNotPaused",
    inputs: [],
  },
  {
    type: "error",
    name: "BirdieswapStakingV1__WithdrawalsPaused",
    inputs: [],
  },
  {
    type: "error",
    name: "EnforcedPause",
    inputs: [],
  },
  {
    type: "error",
    name: "ExpectedPause",
    inputs: [],
  },
  {
    type: "error",
    name: "ReentrancyGuardReentrantCall",
    inputs: [],
  },
  {
    type: "error",
    name: "SafeERC20FailedOperation",
    inputs: [
      {
        name: "token",
        type: "address",
        internalType: "address",
      },
    ],
  },
] as const satisfies Abi;
