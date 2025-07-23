export type NetworkInfo = {
  id: number;
  name: string;
  iconSrc?: string;
  rpcUrl?: string;
  blockExplorer?: {
    name: string;
    url: string;
  };
};
