import networks from "./networks";
import tokens from "./tokens/tokens";
import externalTokens from "./tokens/externalTokens";
import { PriceFeedGuard } from "./types/typeGuards";
import RewardsTokens from "./tokens/RewardsTokens";

const CBBTC_USD = PriceFeedGuard({
  symbol: "LINK:cbBTC_USD",
  fullName: "Chainlink CBBTC/USD Price Feed", //sepolia BTC/USD로 대체
  addresses: {
    [networks.sepolia.id]: "0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43",
    [networks.base.id]: "0x07DA0E54543a844a80ABE69c8A12F22B3aA59f9D",
  },
  base: externalTokens.CBBTC,
  quote: "USD",
  decimals: 8,
});
const WBTC_USD = PriceFeedGuard({
  symbol: "LINK:WBTC_USD",
  fullName: "Chainlink WBTC/USD Price Feed", //sepolia BTC/USD로 대체
  addresses: {
    // [networks.sepolia.id]: "0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43",
    [networks.arbitrum.id]: "0xd0C7101eACbB49F3deCcCc166d238410D6D46d57",
  },
  base: tokens.WBTC,
  quote: "USD",
  decimals: 8,
});

const WETH_USD = PriceFeedGuard({
  symbol: "LINK:WETH_USD",
  fullName: "Chainlink WETH/USD Price Feed",
  addresses: {
    [networks.sepolia.id]: "0x694AA1769357215DE4FAC081bf1f309aDC325306", //ETH/USD price
    [networks.base.id]: "0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70",
    [networks.arbitrum.id]: "0xEAeFFF521cb36dFb414E8580f8635BFB44d96255",
  },
  base: externalTokens.WETH,
  quote: "USD",
  decimals: 8,
});

const ETH_USD = PriceFeedGuard({
  symbol: "LINK:ETH_USD",
  fullName: "Chainlink ETH/USD Price Feed",
  addresses: {
    [networks.sepolia.id]: "0x694AA1769357215DE4FAC081bf1f309aDC325306", //ETH/USD price
    [networks.base.id]: "0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70",
    [networks.arbitrum.id]: "0xEAeFFF521cb36dFb414E8580f8635BFB44d96255",
  },
  base: externalTokens.ETH,
  quote: "USD",
  decimals: 8,
});

const USDC_USD = PriceFeedGuard({
  symbol: "LINK:USDC_USD",
  fullName: "Chainlink USDC/USD Price Feed",
  addresses: {
    [networks.sepolia.id]: "0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E",
    [networks.base.id]: "0x7e860098F58bBFC8648a4311b374B1D669a2bc6B",
    [networks.arbitrum.id]: "0x50834F3163758fcC1Df9973b6e91f0F0F0434aD3",
  },
  base: tokens.USDC,
  quote: "USD",
  decimals: 8,
});

const EURC_USD = PriceFeedGuard({
  symbol: "LINK:EURC_USD",
  fullName: "Chainlink EURC/USD Price Feed",
  addresses: {
    [networks.sepolia.id]: "0x1a81afB8146aeFfCFc5E50e8479e826E7D55b910", //EUR/USD
    [networks.base.id]: "0xDAe398520e2B67cd3f27aeF9Cf14D93D927f8250",
    [networks.arbitrum.id]: "0xCF9752295D0ac9215461fA095faFEC1B854b849B",
  },
  base: tokens.EURC,
  quote: "USD",
  decimals: 8,
});

const VIRTUAL_USD = PriceFeedGuard({
  symbol: "LINK:VIRTUAL_USD",
  fullName: "Chainlink VIRTUAL/USD Price Feed",
  addresses: {
    [networks.base.id]: "0xEaf310161c9eF7c813A14f8FEF6Fb271434019F7",
  },
  base: externalTokens.VIRTUAL,
  quote: "USD",
  decimals: 8,
});

const AERO_USD = PriceFeedGuard({
  symbol: "LINK:AERO_USD",
  fullName: "Chainlink AERO/USD Price Feed",
  addresses: {
    [networks.base.id]: "0x4EC5970fC728C5f65ba413992CD5fF6FD70fcfF0",
  },
  base: externalTokens.AERO,
  quote: "USD",
  decimals: 8,
});

const DEGEN_USD = PriceFeedGuard({
  symbol: "LINK:DEGEN_USD",
  fullName: "Chainlink DEGEN/USD Price Feed",
  addresses: {
    [networks.base.id]: "0xE62BcE5D7CB9d16AB8b4D622538bc0A50A5799c2",
  },
  base: externalTokens.DEGEN,
  quote: "USD",
  decimals: 8,
});

const PEPE_USD = PriceFeedGuard({
  symbol: "LINK:PEPE_USD",
  fullName: "Chainlink PEPE/USD Price Feed",
  addresses: {
    [networks.base.id]: "0xB48ac6409C0c3718b956089b0fFE295A10ACDdad",
  },
  base: externalTokens.PEPE,
  quote: "USD",
  decimals: 8,
});

/*
const USDT_USD = PriceFeedGuard({
  symbol: "LINK:USDT_USD",
  fullName: "Chainlink USDT/USD Price Feed",
  addresses: {
    [networks.base.id]: "0xf19d560eB8d2ADf07BD6D13ed03e1D11215721F9",
    [networks.baseFork.id]: "0xf19d560eB8d2ADf07BD6D13ed03e1D11215721F9",
  },
  base: tokens.USDT,
  quote: "USD",
  decimals: 8,
});          

const AAVE_USD = PriceFeedGuard({
  symbol: "LINK:AAVE_USD",
  fullName: "Chainlink AAVE/USD Price Feed",
  addresses: {
    [networks.base.id]: "0x3d6774EF702A10b20FCa8Ed40FC022f7E4938e07",
    [networks.baseFork.id]: "0x3d6774EF702A10b20FCa8Ed40FC022f7E4938e07",
  },
  base: tokens.AAVE,
  quote: "USD",
  decimals: 8,
});    */

const priceFeeds = {
  CBBTC_USD,
  WBTC_USD,
  ETH_USD,
  WETH_USD,
  USDC_USD,
  EURC_USD,
  VIRTUAL_USD,
  AERO_USD,
  DEGEN_USD,
  PEPE_USD,
  // USDT_USD,
  // AAVE_USD,
};

export default priceFeeds;
