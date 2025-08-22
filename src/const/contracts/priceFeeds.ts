import networks from "./networks";
import tokens from "./tokens/tokens";
import { PriceFeedGuard } from "./types/typeGuards";

const CBBTC_USD = PriceFeedGuard({
  symbol: "LINK:cbBTC_USD",
  fullName: "Chainlink CBBTC/USD Price Feed", //sepolia BTC/USD로 대체
  addresses: {
    [networks.sepolia.id]: "0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43",
    [networks.base.id]: "0x07DA0E54543a844a80ABE69c8A12F22B3aA59f9D",
    [networks.baseFork.id]: "0x07DA0E54543a844a80ABE69c8A12F22B3aA59f9D",
  },
  base: tokens.CBBTC,
  quote: "USD",
  decimals: 8,
});

const WETH_USD = PriceFeedGuard({
  symbol: "LINK:WETH_USD",
  fullName: "Chainlink WETH/USD Price Feed",
  addresses: {
    [networks.sepolia.id]: "0x694AA1769357215DE4FAC081bf1f309aDC325306", //ETH/USD price
    [networks.base.id]: "0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70",
    [networks.baseFork.id]: "0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70",
  },
  base: tokens.WETH,
  quote: "USD",
  decimals: 8,
});

const ETH_USD = PriceFeedGuard({
  symbol: "LINK:ETH_USD",
  fullName: "Chainlink ETH/USD Price Feed",
  addresses: {
    [networks.sepolia.id]: "0x694AA1769357215DE4FAC081bf1f309aDC325306", //ETH/USD price
    [networks.base.id]: "0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70",
    [networks.baseFork.id]: "0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70",
  },
  base: tokens.ETH,
  quote: "USD",
  decimals: 8,
});

const USDC_USD = PriceFeedGuard({
  symbol: "LINK:USDC_USD",
  fullName: "Chainlink USDC/USD Price Feed",
  addresses: {
    [networks.sepolia.id]: "0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E",
    [networks.base.id]: "0x7e860098F58bBFC8648a4311b374B1D669a2bc6B",
    [networks.baseFork.id]: "0x7e860098F58bBFC8648a4311b374B1D669a2bc6B",
  },
  base: tokens.USDC,
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
  ETH_USD,
  WETH_USD,
  USDC_USD,
};

export default priceFeeds;
