"use client";

import "./settingsModal.css";

import { Button, ModalBody, ModalHeader } from "@heroui/react";
import { Fragment, useContext } from "react";
import { useTheme } from "next-themes";

import Icons from "@/assets/icons/icons";
import { SettingsContext } from "@/app/SettingsProvider";

function ThemeSelector(props: {
  selected?: boolean;
  value: "light" | "dark" | "system";
  setTheme: (value: "light" | "dark" | "system") => void;
  children?: React.ReactNode;
}) {
  return (
    <Button
      className="theme-selector"
      data-selected={props.selected}
      radius="md"
      onPress={() => props.setTheme(props.value)}
    >
      {props.children ?? props.value}
    </Button>
  );
}

export function SettingsPage(props: { onBack: () => void }) {
  const themes = useTheme();
  const theme = themes.theme;
  const setTheme = themes.setTheme;

  const {
    hideSmallBalances,
    setHideSmallBalances,
    hideUnknownTokens,
    setHideUnknownTokens,
  } = useContext(SettingsContext);

  return (
    <Fragment>
      <ModalHeader>
        <div className="grid w-full grid-cols-3">
          <Button
            className="m-0 size-6 min-w-0 bg-transparent p-0"
            variant="light"
            onPress={props.onBack}
          >
            <Icons.ToolbarBack className="fill-foreground" />
          </Button>
          <h1 className="self-center text-center text-[17px] font-semibold leading-[24px]">
            Settings
          </h1>
        </div>
      </ModalHeader>
      <ModalBody>
        <div className="flex w-full flex-col items-center gap-4 max-md:gap-0">
          <div className="drawer-item">
            <label className="drawer-item-label">Theme</label>
            <div className="flex flex-row gap-2 rounded-full border-1 border-default-300 p-1.5 dark:border-default-200">
              <ThemeSelector
                selected={!theme || theme === "system"}
                setTheme={setTheme}
                value="system"
              >
                Auto
              </ThemeSelector>
              <ThemeSelector
                selected={theme === "light"}
                setTheme={setTheme}
                value="light"
              >
                <Icons.ThemeLight className="fill-foreground" />
              </ThemeSelector>
              <ThemeSelector
                selected={theme === "dark"}
                setTheme={setTheme}
                value="dark"
              >
                <Icons.ThemeDark className="fill-foreground" />
              </ThemeSelector>
            </div>
          </div>
          {/* <div className="drawer-item">
            <label className="drawer-item-label">Hide small balances</label>
            <ThemedSwitch
              isSelected={hideSmallBalances}
              onValueChange={setHideSmallBalances}
            />
          </div>
          <div className="drawer-item">
            <label className="drawer-item-label">
              Hide unknown tokens & NFTs
            </label>
            <ThemedSwitch
              isSelected={hideUnknownTokens}
              onValueChange={setHideUnknownTokens}
            />
          </div> */}
        </div>
      </ModalBody>
    </Fragment>
  );
}
