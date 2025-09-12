import { Abi } from "viem";

export const birdieswap_wrapper_abi = [
{
    "type": "constructor",
    "inputs": [
      {
        "name": "router_",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "weth_",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "receive",
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "dualDepositWithETH",
    "inputs": [
      {
        "name": "_underlyingTokenAddress",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_underlyingTokenAmount",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "dualRedeemToETH",
    "inputs": [
      {
        "name": "_blpTokenAddress",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_blpTokenAmount",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "getRouterAddress",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getWETHAddress",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "singleDepositWithETH",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "singleRedeemToETH",
    "inputs": [
      {
        "name": "_bTokenAddress",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_bTokenAmount",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "swapToETH",
    "inputs": [
      {
        "name": "_tokenIn",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_feeTier",
        "type": "uint24",
        "internalType": "uint24"
      },
      {
        "name": "_amountIn",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "_minAmountOut",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "_sqrtPriceLimitX96",
        "type": "uint160",
        "internalType": "uint160"
      },
      {
        "name": "_referee",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "swapWithETH",
    "inputs": [
      {
        "name": "_feeTier",
        "type": "uint24",
        "internalType": "uint24"
      },
      {
        "name": "_tokenOut",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_minAmountOut",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "_sqrtPriceLimitX96",
        "type": "uint160",
        "internalType": "uint160"
      },
      {
        "name": "_referee",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "payable"
  },
  {
    "type": "event",
    "name": "DualDepositETH",
    "inputs": [
      {
        "name": "user",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "ethAmount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "otherToken",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      },
      {
        "name": "otherAmount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "blpTokenAmount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "DualRedeemETH",
    "inputs": [
      {
        "name": "user",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "blpToken",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "token0Address",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      },
      {
        "name": "token0Amount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "token1Address",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      },
      {
        "name": "token1Amount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "SingleDepositETH",
    "inputs": [
      {
        "name": "user",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "ethAmount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "bTokenAmount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "SingleRedeemETH",
    "inputs": [
      {
        "name": "user",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "bToken",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "wethAmount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "SwapToETH",
    "inputs": [
      {
        "name": "user",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "tokenIn",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      },
      {
        "name": "tokenInAmount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "ethOut",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "SwapWithETH",
    "inputs": [
      {
        "name": "user",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "ethIn",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "tokenOut",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      },
      {
        "name": "amountOut",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "error",
    "name": "BirdieswapWrapperV1__ETHTransferFailed",
    "inputs": []
  },
  {
    "type": "error",
    "name": "BirdieswapWrapperV1__NoWETHInPair",
    "inputs": []
  },
  {
    "type": "error",
    "name": "BirdieswapWrapperV1__RouterCallFailed",
    "inputs": []
  },
  {
    "type": "error",
    "name": "BirdieswapWrapperV1__WETHisNotNativeEthereum",
    "inputs": []
  },
  {
    "type": "error",
    "name": "BirdieswapWrapperV1__WrapperDidNotReceiveTokens",
    "inputs": []
  },
  {
    "type": "error",
    "name": "BirdieswapWrapperV1__ZeroAddressNotAllowed",
    "inputs": []
  },
  {
    "type": "error",
    "name": "BirdieswapWrapperV1__ZeroAmountNotAllowed",
    "inputs": []
  },
  {
    "type": "error",
    "name": "FailedCall",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InsufficientBalance",
    "inputs": [
      {
        "name": "balance",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "needed",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "SafeERC20FailedOperation",
    "inputs": [
      {
        "name": "token",
        "type": "address",
        "internalType": "address"
      }
    ]
  }
] as const satisfies Abi;
