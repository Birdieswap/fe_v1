"use client";

import { ModalHeader, Button, ModalBody, cn } from "@heroui/react";
import { Fragment, useState } from "react";

import RewardsExtra from "./walletRewardsPage/RewardsExtra";
import RewardsSwap from "./walletRewardsPage/RewardsSwap";
import RewardsReferral from "./walletRewardsPage/RewardsReferral";

function TabSelector(props: {
  selected: "swap" | "referral" | "extra";
  value: "swap" | "referral" | "extra";
  setTab: (value: "swap" | "referral" | "extra") => void;
  name: string;
}) {
  return (
    <Button
      className={cn(
        "group p-0 flex max-h-max min-h-min min-w-min max-w-max flex-row",
        "data-[hover=true]:bg-transparent data-[hover=true]:opacity-70"
      )}
      data-selected={props.value === props.selected}
      radius="none"
      variant="light"
      onPress={() => props.setTab(props.value)}
    >
      <h2
        className={cn(
          "text-[13px] font-semibold leading-[17px] pl-3 pr-3",
          "group-data-[selected=true]:text-foreground group-data-[selected=false]:text-default-600",
          "dark:group-data-[selected=false]:text-default-400"
        )}
      >
        {props.name}
      </h2>
    </Button>
  );
}

export default function WalletRewards() {
  const [tab, setTab] = useState<"swap" | "referral" | "extra">("swap");

  return (
    <Fragment>
      <ModalBody className="max-h-full overflow-hidden p-0">
        <div className="flex max-h-full w-full grow flex-col items-center gap-3 overflow-hidden max-sm:gap-0">
          <div className="flex w-full flex-col items-center gap-3 px-3 max-sm:px-6">
            <div className="flex w-full flex-row justify-start gap-3 border-b-1 mt-0 bg-default-100 dark:bg-[#363B4C] border-default-300 pt-3 pl-3 pb-3 dark:border-default-100 max-sm:pb-4">
              <TabSelector
                name="Swap"
                selected={tab}
                setTab={setTab}
                value="swap"
              />
              <TabSelector
                name="Referral"
                selected={tab}
                setTab={setTab}
                value="referral"
              />
              <TabSelector
                name="Extra"
                selected={tab}
                setTab={setTab}
                value="extra"
              />
            </div>
          </div>
          <div className="flex max-h-full w-full grow flex-col gap-0 overflow-auto">
            {tab === "swap" && <RewardsSwap />}
            {tab === "referral" && <RewardsReferral />}
            {tab === "extra" && <RewardsExtra />}
          </div>
        </div>
      </ModalBody>
    </Fragment>
  );
}
