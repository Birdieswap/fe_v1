"use client";

import type React from "react";
import tokens from "@/const/contracts/tokens/tokens";
import { BigDecimal } from "@/types/BigDecimal";

function fmtBd(bd?: BigDecimal, dp = 6) {
  if (!bd) return "-";
  try {
    return bd.toFixed(dp);
  } catch {
    return "-";
  }
}

function fmtUsdFromNumber(n?: number) {
  if (n == null || Number.isNaN(n)) return "-";
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

// =======================
// PAY
// =======================
export function PaySummaryNode(props: {
  poolIcon?: string;
  poolSymbol?: string;
  receiver: string;
  stakedUsed?: BigDecimal;
  requiredUsdWithTol?: number;
  payAmountUsdc: string;
}) {
  const USDC = tokens.USDC;

  return (
    <div className="w-full rounded-2xl bg-default-100 dark:bg-dark-swap-bg p-4 text-left">
      <div className="space-y-2 text-[13px] text-default-700 dark:text-default-300">
        {/* From */}
        <div>
          <div className="text-[11px] text-default-500">From</div>

          <div className="mt-1 flex items-center text-foreground justify-between">
            <div className="flex min-w-0 items-center gap-2">
              {!!props.poolIcon && (
                <img
                  src={props.poolIcon}
                  alt={props.poolSymbol ?? "Pool"}
                  className="h-5 w-5 object-contain"
                />
              )}
              <span className="truncate font-semibold">
                Staked {props.poolSymbol ?? "-"}
              </span>
            </div>

            <div className="text-right">
              <div className="font-semibold leading-none">
                {fmtBd(props.stakedUsed, 6)}
              </div>
              <div className="mt-0.5 text-[11px] leading-none text-default-800 dark:text-default-300">
                {fmtUsdFromNumber(props.requiredUsdWithTol)}
              </div>
            </div>
          </div>
        </div>

        {/* To */}
        <div>
          <div className="mt-2 border-t border-default-200/60 pt-2 dark:border-default-100/20">
            <div className="flex items-start justify-between gap-3">
              <div className="text-[11px] text-default-500">To</div>
              <div className="min-w-0 text-right">
                <div className="break-all text-[12px] leading-snug text-foreground">
                  {props.receiver}
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-center text-foreground justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                {USDC.iconSrc && (
                  <img
                    src={USDC.iconSrc}
                    alt="USDC"
                    className="h-5 w-5 object-contain"
                  />
                )}
                <span className="font-semibold">USDC</span>
              </div>

              <div className="text-right">
                <span className="font-semibold">{props.payAmountUsdc}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PayResultNode(props: {
  poolIcon?: string;
  poolSymbol?: string;
  receiver: string;
  stakedUsed?: BigDecimal;
  requiredUsdWithTol?: number;
  payAmountUsdc: string;

  reEnter?: BigDecimal;
  reEnterUsd?: number;
  refundUsdc?: BigDecimal;
}) {
  const USDC = tokens.USDC;

  return (
    <div className="w-full rounded-2xl bg-default-100 dark:bg-dark-swap-bg p-4 text-left">
      <div className="space-y-2 text-[13px] text-default-700 dark:text-default-300">
        {/* From */}
        <div>
          <div className="text-[11px] text-default-500">From</div>

          <div className="mt-1 flex items-center text-foreground justify-between">
            <div className="flex min-w-0 items-center gap-2">
              {!!props.poolIcon && (
                <img
                  src={props.poolIcon}
                  alt={props.poolSymbol ?? "Pool"}
                  className="h-5 w-5 object-contain"
                />
              )}
              <span className="truncate font-semibold">
                Staked {props.poolSymbol ?? "-"}
              </span>
            </div>

            <div className="text-right">
              <div className="font-semibold leading-none">
                {fmtBd(props.stakedUsed, 6)}
              </div>
              <div className="mt-0.5 text-[11px] leading-none text-default-800 dark:text-default-300">
                {fmtUsdFromNumber(props.requiredUsdWithTol)}
              </div>
            </div>
          </div>
        </div>

        {/* To */}
        <div className="mt-2 border-t border-default-200/60 pt-2 dark:border-default-100/20">
          <div className="flex items-start justify-between gap-3">
            <div className="text-[11px] text-default-500">To</div>
            <div className="min-w-0 text-right">
              <div className="break-all text-[12px] leading-snug text-foreground">
                {props.receiver}
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center text-foreground justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              {USDC.iconSrc && (
                <img
                  src={USDC.iconSrc}
                  alt="USDC"
                  className="h-5 w-5 object-contain"
                />
              )}
              <span className="font-semibold">USDC</span>
            </div>

            <div className="text-right">
              <span className="font-semibold">{props.payAmountUsdc}</span>
            </div>
          </div>
        </div>

        {/* Settlement */}
        {(props.reEnter || props.refundUsdc) && (
          <div className="mt-2 border-t border-default-200/60 pt-2 dark:border-default-100/20">
            <div className="text-[11px] text-default-500">Settlement</div>

            {props.reEnter && (
              <div className="mt-2 flex items-start justify-between gap-3">
                <div className="text-[13px] text-default-700 dark:text-default-300">
                  Re-Enter
                </div>

                <div className="text-right">
                  <div className="flex items-center text-foreground justify-end gap-2">
                    {!!props.poolIcon && (
                      <img
                        src={props.poolIcon}
                        alt={props.poolSymbol ?? "Pool"}
                        className="h-5 w-5 object-contain"
                      />
                    )}
                    <span className="font-semibold">
                      {fmtBd(props.reEnter, 6)} {props.poolSymbol ?? ""}
                    </span>
                  </div>
                  <div className="mt-0.5 text-[11px] leading-none text-default-800 dark:text-default-300">
                    {fmtUsdFromNumber(props.reEnterUsd)}
                  </div>
                </div>
              </div>
            )}

            {props.refundUsdc && (
              <div className="mt-2 flex items-center justify-between gap-3">
                <div className="text-[13px] text-default-700 dark:text-default-300">
                  Refund
                </div>

                <div className="flex items-center justify-end gap-2 text-right text-foreground">
                  {USDC.iconSrc && (
                    <img
                      src={USDC.iconSrc}
                      alt="USDC"
                      className="h-5 w-5 object-contain"
                    />
                  )}
                  <span className="font-semibold">
                    {fmtBd(props.refundUsdc, 6)} USDC
                  </span>
                </div>
              </div>
            )}

            <div className="pt-3 text-[11px] text-default-600">
              Any refund dust was also sent to your wallet.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// =======================
// ENTER
// =======================
export function EnterSummaryNode(props: {
  tokenIcon?: string;
  tokenSymbol?: string;
  amount: string;

  poolIcon?: string;
  poolSymbol?: string;
}) {
  return (
    <div className="w-full rounded-2xl bg-default-100 dark:bg-dark-swap-bg p-4 text-left">
      <div className="space-y-2 text-[13px] text-default-700 dark:text-default-300">
        {/* From */}
        <div>
          <div className="text-[11px] text-default-500">From</div>

          <div className="mt-1 flex items-center text-foreground justify-between">
            <div className="flex min-w-0 items-center gap-2">
              {!!props.tokenIcon && (
                <img
                  src={props.tokenIcon}
                  alt={props.tokenSymbol ?? "Token"}
                  className="h-5 w-5 object-contain"
                />
              )}
              <span className="truncate font-semibold">
                {props.tokenSymbol ?? "-"}
              </span>
            </div>

            <span className="text-base font-semibold">{props.amount}</span>
          </div>
        </div>

        {/* To */}
        <div className="mt-2 border-t border-default-200/60 pt-2 dark:border-default-100/20">
          <div className="flex items-center justify-between gap-3">
            <div className="text-[11px] text-default-500">To</div>

            <div className="flex items-center text-foreground text-base justify-end gap-2 text-right">
              {!!props.poolIcon && (
                <img
                  src={props.poolIcon}
                  alt={props.poolSymbol ?? "Pool"}
                  className="h-5 w-5 object-contain"
                />
              )}
              <span className="font-semibold">
                Staked {props.poolSymbol ?? "-"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function EnterResultNode(props: {
  tokenIcon?: string;
  tokenSymbol?: string;
  amount: string;

  poolIcon?: string;
  poolSymbol?: string;

  stakedDelta?: BigDecimal;
  refund0?: { tokenIcon?: string; symbol?: string; amount?: BigDecimal };
  refund1?: { tokenIcon?: string; symbol?: string; amount?: BigDecimal };
}) {
  const hasRefund0 = !!props.refund0?.amount && !props.refund0.amount.isZero();
  const hasRefund1 = !!props.refund1?.amount && !props.refund1.amount.isZero();
  const hasRefund = hasRefund0 || hasRefund1;

  return (
    <div className="w-full rounded-2xl bg-default-100 dark:bg-dark-swap-bg p-4 text-left">
      <div className="space-y-2 text-[13px] text-default-700 dark:text-default-300">
        {/* From */}
        <div>
          <div className="text-[11px] text-default-500">From</div>

          <div className="mt-1 flex text-foreground items-center justify-between">
            <div className="flex min-w-0 items-center gap-2">
              {!!props.tokenIcon && (
                <img
                  src={props.tokenIcon}
                  alt={props.tokenSymbol ?? "Token"}
                  className="h-5 w-5 object-contain"
                />
              )}
              <span className="truncate font-semibold">
                {props.tokenSymbol ?? "-"}
              </span>
            </div>

            <span className="text-base  font-semibold">{props.amount}</span>
          </div>
        </div>

        {/* To */}
        <div className="mt-2 border-t border-default-200/60 pt-2 dark:border-default-100/20">
          <div className="flex items-center justify-between gap-3">
            <div className="text-[11px] text-default-500">To</div>

            <div className="flex items-center text-default-700 dark:text-default-300 text-xs justify-end gap-2 text-right">
              {!!props.poolIcon && (
                <img
                  src={props.poolIcon}
                  alt={props.poolSymbol ?? "Pool"}
                  className="h-5 w-5 object-contain"
                />
              )}
              <span className="font-semibold">
                Staked {props.poolSymbol ?? "-"}
              </span>
            </div>
          </div>

          {props.stakedDelta && (
            <div className="mt-1 flex justify-end">
              <div className="text-base leading-none text-foreground">
                +{fmtBd(props.stakedDelta, 6)}
              </div>
            </div>
          )}
        </div>

        {/* Refund */}
        {hasRefund && (
          <div className="mt-2 border-t border-default-200/60 pt-2 dark:border-default-100/20">
            <div className="text-[11px] text-default-500">Refund</div>

            {hasRefund0 && (
              <div className="mt-2 flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  {!!props.refund0?.tokenIcon && (
                    <img
                      src={props.refund0.tokenIcon}
                      alt={props.refund0.symbol ?? "token0"}
                      className="h-5 w-5 object-contain"
                    />
                  )}
                  <span className="truncate font-semibold">
                    {props.refund0?.symbol ?? ""}
                  </span>
                </div>
                <span className="text-foreground font-semibold">
                  {fmtBd(props.refund0!.amount!, 6)}
                </span>
              </div>
            )}

            {hasRefund1 && (
              <div className="mt-2 flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  {!!props.refund1?.tokenIcon && (
                    <img
                      src={props.refund1.tokenIcon}
                      alt={props.refund1.symbol ?? "token1"}
                      className="h-5 w-5 object-contain"
                    />
                  )}
                  <span className="truncate font-semibold">
                    {props.refund1?.symbol ?? ""}
                  </span>
                </div>
                <span className="text-foreground font-semibold">
                  {fmtBd(props.refund1!.amount!, 6)}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
