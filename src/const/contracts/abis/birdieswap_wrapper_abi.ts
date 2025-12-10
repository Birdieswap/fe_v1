import { Abi } from "viem";

export const birdieswap_wrapper_abi = [
  {
    type: "constructor",
    inputs: [
      {
        name: "configAddress_",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "receive",
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "dualDepositWithETH",
    inputs: [
      {
        name: "_otherUnderlyingToken",
        type: "address",
        internalType: "address",
      },
      {
        name: "_otherUnderlyingAmount",
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
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "dualRedeemToETH",
    inputs: [
      {
        name: "_blpTokenAddress",
        type: "address",
        internalType: "address",
      },
      {
        name: "_blpTokenAmount",
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
    name: "easyEnterWithETH",
    inputs: [
      {
        name: "_stakingContract",
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
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "getRouterAddress",
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
    name: "getWethAddress",
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
    name: "singleDepositWithETH",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "singleRedeemToETH",
    inputs: [
      {
        name: "_bTokenAddress",
        type: "address",
        internalType: "address",
      },
      {
        name: "_bTokenAmount",
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
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "swapFromETH",
    inputs: [
      {
        name: "_feeTier",
        type: "uint24",
        internalType: "uint24",
      },
      {
        name: "_tokenOut",
        type: "address",
        internalType: "address",
      },
      {
        name: "_minAmountOut",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "_sqrtPriceLimitX96",
        type: "uint160",
        internalType: "uint160",
      },
      {
        name: "_referrerAddress",
        type: "address",
        internalType: "address",
      },
      {
        name: "_deadline",
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
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "swapToETH",
    inputs: [
      {
        name: "_tokenIn",
        type: "address",
        internalType: "address",
      },
      {
        name: "_feeTier",
        type: "uint24",
        internalType: "uint24",
      },
      {
        name: "_amountIn",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "_minAmountOut",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "_sqrtPriceLimitX96",
        type: "uint160",
        internalType: "uint160",
      },
      {
        name: "_referrerAddress",
        type: "address",
        internalType: "address",
      },
      {
        name: "_deadline",
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
    stateMutability: "nonpayable",
  },
  {
    type: "error",
    name: "BirdieswapWrapperV1__DirectETHTransferNotSupported",
    inputs: [],
  },
  {
    type: "error",
    name: "BirdieswapWrapperV1__InvalidBirdieswapContract",
    inputs: [],
  },
  {
    type: "error",
    name: "BirdieswapWrapperV1__NoWETHInPair",
    inputs: [],
  },
  {
    type: "error",
    name: "BirdieswapWrapperV1__NonStandardToken",
    inputs: [],
  },
  {
    type: "error",
    name: "BirdieswapWrapperV1__OnlyWETHAllowed",
    inputs: [],
  },
  {
    type: "error",
    name: "BirdieswapWrapperV1__TokenDeltaMismatch",
    inputs: [],
  },
  {
    type: "error",
    name: "BirdieswapWrapperV1__UnauthorizedAccess",
    inputs: [],
  },
  {
    type: "error",
    name: "BirdieswapWrapperV1__UnexpectedETHRefund",
    inputs: [],
  },
  {
    type: "error",
    name: "BirdieswapWrapperV1__UnexpectedTokenRefund",
    inputs: [],
  },
  {
    type: "error",
    name: "BirdieswapWrapperV1__WETHInputNotAllowed",
    inputs: [],
  },
  {
    type: "error",
    name: "BirdieswapWrapperV1__WETHNotNativeETH",
    inputs: [],
  },
  {
    type: "error",
    name: "BirdieswapWrapperV1__WETHOutputNotAllowed",
    inputs: [],
  },
  {
    type: "error",
    name: "BirdieswapWrapperV1__ZeroAddressNotAllowed",
    inputs: [],
  },
  {
    type: "error",
    name: "BirdieswapWrapperV1__ZeroAmountNotAllowed",
    inputs: [],
  },
  {
    type: "error",
    name: "FailedCall",
    inputs: [],
  },
  {
    type: "error",
    name: "InsufficientBalance",
    inputs: [
      {
        name: "balance",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "needed",
        type: "uint256",
        internalType: "uint256",
      },
    ],
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
