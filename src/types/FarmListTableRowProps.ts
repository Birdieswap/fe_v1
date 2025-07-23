import {
  IBirdieLPFarm,
  IBirdieSingleFarm,
  IToken,
} from "@/const/contracts/types/tokenTypes";

export type VaultDetails = {
  title: string;
  subtitle: string;
  summary: string;
  underlyingProtocolName: string;
  underlyingProtocolInfo?:
    | string
    | {
        rewardToken: string;
        rewardTokenContract: string;
        rewardAPR: string;
      };
  vaultContract: string;
  receiptToken: string;
};

export type Vault = {
  name: string;
  details: VaultDetails;
  apy: number;
};

export type Reward = {
  token: Pick<IToken, "symbol" | "decimals" | "iconSrc" | "displayDecimals">;
};

export type FarmDetails = {
  vaults: Vault[];
  rewards: Reward[];
};

export enum FarmType {
  PAIR = "PAIR",
  SINGLE = "SINGLE",
}

export enum FarmTag {
  SINGLE = "SINGLE",
  LP = "LP",
  STABLE = "STABLE",
}

export type Farm = {
  name: string;
  tags?: FarmTag[];
  wip_stakeToken: IBirdieSingleFarm | IBirdieLPFarm;
  details: FarmDetails;
  feeTier: number;
  apy: number;
  point?: number;
  birdRate: number;
  tvl: string;
} & (
  | {
      type: FarmType.SINGLE;
      wip_stakeToken: IBirdieSingleFarm;
    }
  | {
      type: FarmType.PAIR;
      wip_stakeToken?: IBirdieLPFarm;
    }
);

export type FarmPair = Farm & {
  type: FarmType.PAIR;
};

export type FarmSingle = Farm & {
  type: FarmType.SINGLE;
};
