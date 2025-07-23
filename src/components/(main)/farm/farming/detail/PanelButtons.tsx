import { Dispatch, SetStateAction } from "react";

import Icons from "@/assets/icons/icons";

import PanelButtonBase from "./panelButtons/PanelButtonBase";

export function PanelButtonStart({
  selectedPanel,
  setSelectedPanel,
}: {
  selectedPanel: "START" | "STOP";
  setSelectedPanel: Dispatch<SetStateAction<"START" | "STOP">>;
}) {
  return (
    <div className="flex grow basis-0 flex-row">
      <PanelButtonBase
        selectedPanel={selectedPanel}
        setSelectedPanel={setSelectedPanel}
        value={"START"}
      >
        <div className="relative size-6">
          <Icons.PiggyBankStartOn className="absolute inset-0 block transition-opacity group-data-[selected=false]:opacity-0 dark:hidden" />
          <Icons.PiggyBankStartOnDark className="absolute inset-0 hidden transition-opacity group-data-[selected=false]:opacity-0 dark:block" />
          <Icons.PiggyBankStartOff className="absolute inset-0 block transition-opacity group-data-[selected=true]:opacity-0 dark:hidden" />
          <Icons.PiggyBankStartOffDark className="absolute inset-0 hidden transition-opacity group-data-[selected=true]:opacity-0 dark:block" />
        </div>
        Start
      </PanelButtonBase>
    </div>
  );
}

export function PanelButtonStop({
  selectedPanel,
  setSelectedPanel,
}: {
  selectedPanel: "START" | "STOP";
  setSelectedPanel: Dispatch<SetStateAction<"START" | "STOP">>;
}) {
  return (
    <div className="flex grow basis-0 flex-row">
      <PanelButtonBase
        selectedPanel={selectedPanel}
        setSelectedPanel={setSelectedPanel}
        value={"STOP"}
      >
        <div className="relative size-6">
          <Icons.PiggyBankStopOn className="absolute inset-0 block transition-opacity group-data-[selected=false]:opacity-0 dark:hidden" />
          <Icons.PiggyBankStopOnDark className="absolute inset-0 hidden transition-opacity group-data-[selected=false]:opacity-0 dark:block" />
          <Icons.PiggyBankStopOff className="absolute inset-0 block transition-opacity group-data-[selected=true]:opacity-0 dark:hidden" />
          <Icons.PiggyBankStopOffDark className="absolute inset-0 hidden transition-opacity group-data-[selected=true]:opacity-0 dark:block" />
        </div>
        Stop
      </PanelButtonBase>
    </div>
  );
}

const PanelButtons = { Start: PanelButtonStart, Stop: PanelButtonStop };

export default PanelButtons;
