export type RewardItem = {
  type: string;
  blockNumber: string;
  blockTimestamp: string; // unix seconds (string)
  transactionHash: `0x${string}`;
  data: {
    rewardToken: `0x${string}`;
    rewardAmount: string;
    [k: string]: string;
  };
};