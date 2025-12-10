// components/(main)/pay/common/PayExecuteButtons.tsx
"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useContext, useMemo } from "react";

import {
  defaultTransition,
  presenceTransition,
} from "@/const/presenceTransition";
import ThemedButton from "@/components/atoms/ThemedButton";
import { WalletContext } from "@/app/WalletContextProvider";
import { usePayContext } from "@/components/(main)/pay/PayProvider";
import { TransactionContext } from "@/app/TransactionContextProvider";

export default function PayExecuteButtons({ mode }: { mode: "PAY" | "ENTER" }) {
  const pay = usePayContext();
  const { setIsConnectModalOpen, setIsNetworkModalOpen } =
    useContext(WalletContext);

  const { isBusy } = useContext(TransactionContext);

  const model = mode === "PAY" ? pay.payButton : pay.enterButton;

  const onPress = useMemo(() => {
    if (!pay.isConnected) return () => setIsConnectModalOpen(true);
    if (pay.isWrongNetwork) return () => setIsNetworkModalOpen(true);
    return mode === "PAY" ? pay.executePay : pay.executeEnter;
  }, [
    pay.isConnected,
    pay.isWrongNetwork,
    mode,
    pay.executePay,
    pay.executeEnter,
    setIsConnectModalOpen,
    setIsNetworkModalOpen,
  ]);

  // ✅ 최종 disabled: 기존 폼 검증(model.disabled) + tx 진행중(isBusy)
  const mainDisabled = model.disabled || isBusy;

  // ✅ Approve 버튼도 tx 진행중이면 잠그기
  const approveDisabled =
    isBusy ||
    !pay.isConnected ||
    pay.isWrongNetwork ||
    !pay.showApproveUI ||
    !pay.executeApproveWeth; // 함수 없으면 비활성

  return (
    <motion.div layout className="flex w-full flex-col" {...defaultTransition}>
      <AnimatePresence initial={false}>
        {mode === "ENTER" && pay.showApproveUI && (
          <motion.div
            key="approve"
            {...presenceTransition}
            className="mb-6 w-full"
          >
            <ThemedButton
              fullWidth
              variant="MINT"
              isDisabled={approveDisabled}
              isLoading={isBusy} // ✅ 진행중이면 로딩(원하면 approve 전용 pending도 따로 분리 가능)
              onPress={() => pay.executeApproveWeth?.()}
            >
              Approve WETH
            </ThemedButton>
          </motion.div>
        )}

        <motion.div key="main" {...presenceTransition} className="w-full">
          <ThemedButton
            fullWidth
            variant={model.variant}
            isDisabled={mainDisabled}
            isLoading={isBusy} // ✅ Pay/Enter 실행 중 로딩
            onPress={() => {
              // ✅ 혹시라도 isBusy인데 클릭 들어오면 막기
              if (isBusy) return;
              onPress();
            }}
          >
            {model.text}
          </ThemedButton>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
