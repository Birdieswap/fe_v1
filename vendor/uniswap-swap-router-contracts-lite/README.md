This local package replaces `@uniswap/swap-router-contracts` for runtime builds.

It intentionally contains only the artifact file used by `@uniswap/v3-sdk`:
- `artifacts/contracts/lens/QuoterV2.sol/QuoterV2.json`

Goal: avoid pulling Hardhat-related transitive dependencies that are not required by this app runtime.
