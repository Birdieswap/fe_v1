"use client";

import "./MaxSlippagePopover.css";

import {
  Button,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@heroui/react";
import clsx from "clsx";
import { useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";

import Icons from "@/assets/icons/icons";
import {
  defaultTransition,
  presenceTransition,
} from "@/const/presenceTransition";

export default function MaxSlippagePopover(props: {
  maxSlippage: "auto" | number;
  setMaxSlippage: (value: "auto" | number) => void;
}) {
  const [customSlippage, setCustomSlippage] = useState<string>(
    props.maxSlippage === "auto" ? "0.5" : props.maxSlippage.toString(),
  );

  const [isOpen, setIsOpen] = useState(false);
  // Input ref 추가
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <Popover
      className="text-foreground"
      isOpen={isOpen}
      placement="bottom-end"
      onOpenChange={(open) => {
        setIsOpen(open);

        // Popover가 닫힐 때 체크
        if (!open) {
          // 100 이상의 값이 입력된 경우 Auto 모드로 전환
          if (props.maxSlippage !== "auto" && props.maxSlippage >= 100) {
            props.setMaxSlippage("auto");

            return;
          }
          // Custom 모드이고 Input이 비어있으면 Auto 모드로 전환
          if (
            props.maxSlippage !== "auto" &&
            (!customSlippage || customSlippage.trim() === "")
          ) {
            props.setMaxSlippage("auto");
          }
        }
      }}
    >
      <PopoverTrigger>
        <Button
          isIconOnly
          className="size-7 max-h-7 max-w-7 data-[hover=true]:bg-transparent"
          size="sm"
          variant="light"
        >
          <Icons.Setting className="size-6 fill-default-700 transition-colors group-hover:fill-default-800 dark:group-hover:fill-default-500" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        as={motion.div}
        {...defaultTransition}
        className={clsx(
          "dark:border-1 dark:border-default-900 dark:bg-dark_popup_bg",
        )}
      >
        <motion.div
          layout
          {...defaultTransition}
          className="flex w-min flex-col gap-4 px-2 py-4"
        >
          <motion.div
            layout
            {...defaultTransition}
            className="flex flex-row items-center gap-1.5 text-[16px] font-medium"
          >
            <span>Max slippage</span>
            <Button
              isIconOnly
              className={clsx(
                "w-4 min-w-4",
                "h-4 min-h-4",
                "rounded-full",
                "flex items-center justify-center",
                "data-[hover=true]:bg-background data-[hover=true]:opacity-100",
              )}
              variant="light"
            >
              <Icons.Info
                className={clsx(
                  "fill-default-500 group-hover:fill-default-700",
                  "dark:fill-default-500 dark:group-hover:fill-default-700",
                  "transition-[fill]",
                )}
                fillRule="evenodd"
              />
            </Button>
            <span className="grow text-right">
              {props.maxSlippage === "auto"
                ? "Auto"
                : typeof props.maxSlippage === "number" &&
                    !isNaN(props.maxSlippage) &&
                    props.maxSlippage > 0
                  ? props.maxSlippage.toString() + "%"
                  : ""}
            </span>
          </motion.div>
          <motion.div layout {...defaultTransition} className="flex flex-col">
            <motion.div
              layout
              {...defaultTransition}
              className="flex flex-row items-center gap-3"
            >
              <div className="flex flex-row gap-2 rounded-[14px] border-1 border-default-300 px-2 py-1.5 dark:border-default-900">
                <Button
                  className={"max-slippage-selector px-[9px]"}
                  data-selected={props.maxSlippage === "auto"}
                  onPress={() => props.setMaxSlippage("auto")}
                >
                  Auto
                </Button>
                <Button
                  className={"max-slippage-selector px-3"}
                  data-selected={props.maxSlippage !== "auto"}
                  onPress={() => {
                    setCustomSlippage(""); // 빈 문자열로 설정
                    setTimeout(() => {
                      inputRef.current?.focus();
                    }, 100);
                  }}
                >
                  Custom
                </Button>
              </div>
              <Input
                ref={inputRef}
                classNames={{
                  inputWrapper: clsx(
                    "w-[110px] border-1",
                    "transition-colors",
                    "border-default-500 bg-background",
                    "dark:border-default-900 dark:bg-dark_swap_bg",
                    "data-[hover=true]:border-default-500",
                    "dark:data-[hover=true]:border-default-500",
                    "data-[hover=true]:bg-background",
                    "dark:data-[hover=true]:bg-dark_swap_bg",
                    "data-[focus=true]:bg-background",
                    "dark:data-[focus=true]:bg-dark_swap_bg",
                    "data-[focus-within=true]:bg-background",
                    "dark:data-[focus-within=true]:bg-dark_swap_bg",
                    "data-[focus=true]:border-default-500",
                    "data-[focus-within=true]:border-default-500",
                    "dark:data-[focus=true]:border-default-500",
                    "dark:data-[focus-within=true]:border-default-500",
                  ),
                  input: "text-right text-[15px] textfield",
                }}
                endContent="%"
                isDisabled={false}
                min={0}
                placeholder=""
                size="md"
                step="0.0001"
                type="number"
                value={props.maxSlippage === "auto" ? "5.5" : customSlippage} // Auto일 때 표시 값
                onFocus={() => {
                  // Input을 클릭하면 자동으로 Custom 모드로 전환
                  if (props.maxSlippage === "auto") {
                    setCustomSlippage("");
                    props.setMaxSlippage(0);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "-") {
                    e.preventDefault();
                  }

                  // Enter 키 처리 추가
                  if (e.key === "Enter") {
                    e.preventDefault();

                    // 유효한 값이 입력되었는지 확인
                    if (customSlippage && customSlippage.trim() !== "") {
                      const numValue = parseFloat(customSlippage);

                      if (!isNaN(numValue) && numValue >= 0) {
                        props.setMaxSlippage(numValue);
                      }
                    }

                    // Popover 닫기
                    setIsOpen(false);
                  }
                }}
                onValueChange={(v) => {
                  setCustomSlippage(v);
                  // 빈 문자열일 때는 아무것도 하지 않음 (Auto 모드로 전환하지 않음)
                  if (!v || v.trim() === "") {
                    props.setMaxSlippage(0);

                    return;
                  }

                  const numValue = parseFloat(v);

                  if (v && !isNaN(numValue) && numValue >= 0) {
                    props.setMaxSlippage(numValue);
                  }
                }}
              />
            </motion.div>
            <AnimatePresence>
              {props.maxSlippage !== "auto" &&
                (props.maxSlippage <= 0.05 || props.maxSlippage >= 3) && (
                  <motion.div
                    layout
                    className="flex w-full max-w-full flex-row gap-1 pt-4"
                    {...presenceTransition}
                  >
                    <Icons.Error className="shrink-0" />
                    <span className="text-wrap text-danger">
                      {props.maxSlippage <= 0.05
                        ? "Slippage below 0.05% may result in a failed transaction."
                        : props.maxSlippage >= 100
                          ? "Slippage limit cannot exceed 100. Please enter a value less than 100."
                          : "Your transaction may be frontrun and result in an unfavorable trade."}
                    </span>
                  </motion.div>
                )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </PopoverContent>
    </Popover>
  );
}
