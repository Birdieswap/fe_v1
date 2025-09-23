"use client";

import { cn } from "@heroui/react";
import Image from "next/image";
import { Fragment, useCallback, useContext, useMemo } from "react";
import { useChainId } from "wagmi";

import Icons from "@/assets/icons/icons";
import { AssetsContext } from "@/app/AssetsContextProvider";
import tokensList from "@/const/contracts/tokens/tokens";
import singleVaultsList from "@/const/contracts/tokens/singleVaults";
import lpVaultsList from "@/const/contracts/tokens/lpVaults";
import { buildWalletTokens } from "@/utils/wallet/tokens/buildWalletTokens";
import { useRouter } from "next/navigation";
import { findSymbolByAddress } from "@/utils/assets/getTokenSymbol";

export type WalletTokenType = "LP" | "staked" | "token";

export type WalletTokenInfo = {
  type?: WalletTokenType;
  address?: `0x${string}`;
  name: string;
  amount: string;
  src?: string;
  usdAmount: string;
};

function WalletTokenItem(props: WalletTokenInfo & { onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className={cn(
        "flex w-full flex-row items-center gap-2 rounded-sm px-1 py-2",
        "hover:bg-default-200 dark:hover:bg-default-100 transition-background cursor-pointe"
      )}
    >
      <div className="size-8 rounded-full">
        {props.src && (
          <Image
            alt={props.name}
            className="size-full rounded-full"
            height={28}
            src={props.src}
            width={28}
          />
        )}
      </div>
      <span className="text-[14px] font-bold leading-[15px] text-foreground">
        {props.name}
      </span>
      <div className="flex grow flex-col items-end gap-0.5">
        <span className="text-[14px] font-semibold leading-[15px] text-foreground">
          {props.amount}
        </span>
        <span className="text-[12px] font-bold leading-[14px] text-default-700 dark:text-default-300">
          $ {props.usdAmount}
        </span>
      </div>
    </button>
  );
}

export default function WalletTokens({ onClose }: { onClose?: () => void }) {
  const chainId = useChainId();
  const total = useContext(AssetsContext);
  const router = useRouter();

  const tokens = useMemo<WalletTokenInfo[]>(() => {
    return buildWalletTokens(
      total,
      {
        tokens: tokensList as any,
        lpVaults: lpVaultsList as any,
        // singleVaults: singleVaultsList as any,
      },
      chainId
    ) as WalletTokenInfo[];
  }, [total, chainId]);

  const handleClick = useCallback(
    (t: WalletTokenInfo) => {
      try {
        onClose?.();

        // 라우팅은 한 틱 뒤에
        const go = (href: string) => setTimeout(() => router.push(href), 0);

        if (t.type === "token") {
          const symbol = findSymbolByAddress(t.address as string, chainId);
          go(`/?from=${encodeURIComponent(symbol as string)}`);
          return;
        }
        if (t.type === "LP") {
          go(`/farm?open=${t.address}&stakePanel=stake`);
          return;
        }
        if (t.type === "staked") {
          go(`/farm?open=${t.address}&stakePanel=unstake&unstakeAmount=max`);
          return;
        }
      } catch (e) {
        console.error("WalletToken click failed:", e);
      }
    },
    [router, chainId, onClose]
  );

  console.log("walletTokens. tokens", tokens);

  return (
    <div
      className={cn(
        "flex w-full grow flex-col gap-1 px-4 pb-3",
        "max-sm:pt-3 max-sm:px-6 max-sm:gap-6"
      )}
    >
      {tokens.length === 0 ? (
        <div className="flex grow flex-col items-center justify-center gap-4">
          <Icons.WalletEmptyToken className="fill-light_mid_mint_2 dark:fill-dark_empty_state" />
          <span className="text-[14px] leading-[17px] text-default-700 max-sm:dark:text-default-600">
            No tokens yet.
          </span>
        </div>
      ) : (
        <Fragment>
          <h2 className="w-full text-right text-[14px] font-semibold mt-3 leading-[17px] text-primary ">
            {tokens.length} Tokens
          </h2>
          {tokens.map((token) => (
            <WalletTokenItem
              key={token.name}
              amount={token.amount}
              name={token.name}
              src={token.src}
              usdAmount={token.usdAmount}
              onClick={() => handleClick(token)}
            />
          ))}
        </Fragment>
      )}
    </div>
  );
}
