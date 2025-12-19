"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useContext, useMemo } from "react";
import clsx from "clsx";

import {
  defaultTransition,
  presenceTransition,
} from "@/const/presenceTransition";
import ThemedButton from "@/components/atoms/ThemedButton";
import { WalletContext } from "@/app/WalletContextProvider";
import { usePayContext } from "@/components/(main)/pay/PayProvider";
import { TransactionContext } from "@/app/TransactionContextProvider";

function ButtonWithPulse({
  isBusy,
  className,
  children,
}: {
  isBusy?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={clsx(className, isBusy && "animate-pulse")}>{children}</div>
  );
}

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

  /**
   * ✅ 승인 단계인지 판단 (ENTER 모드에서 approve UI가 떠있고, tx가 busy면 approve 중으로 간주)
   * - 이 가정이 가장 안전한 이유: approve UI가 안 뜨는 상태에서 isBusy면 'execute(enter)' 중일 확률이 큼
   */
  const isApproveStage = mode === "ENTER" && pay.showApproveUI;

  // ✅ Approve 진행 중이면 Approve 버튼만 pulse, main은 disable만
  const isApprovePending = isApproveStage && isBusy;

  // ✅ Execute(Enter/Pay) 진행 중 = isBusy 이면서 approve 단계가 아닐 때
  const isExecutePending = isBusy && !isApproveStage;

  // ✅ main disabled: 기존 폼 검증 + tx busy(approve/execute 모두 포함)
  const mainDisabled = model.disabled || isBusy;

  const approveDisabled =
    isBusy ||
    !pay.isConnected ||
    pay.isWrongNetwork ||
    !pay.showApproveUI ||
    !pay.executeApproveWeth;

  return (
    <motion.div layout className="flex w-full flex-col" {...defaultTransition}>
      <AnimatePresence initial={false}>
        {mode === "ENTER" && pay.showApproveUI && (
          <motion.div
            key="approve"
            {...presenceTransition}
            className="mb-6 w-full"
          >
            <ButtonWithPulse isBusy={isApprovePending} className="w-full">
              <ThemedButton
                fullWidth
                variant="MINT"
                isDisabled={approveDisabled}
                // ✅ 스피너 제거: pulse로 통일
                isLoading={false}
                onPress={() => {
                  if (isBusy) return;
                  pay.executeApproveWeth?.();
                }}
              >
                {isApprovePending ? "Approving WETH" : "Approve WETH"}
              </ThemedButton>
            </ButtonWithPulse>
          </motion.div>
        )}

        <motion.div key="main" {...presenceTransition} className="w-full">
          {/* ✅ main 버튼은 execute 중일 때만 pulse (approve 중에는 pulse X) */}
          <ButtonWithPulse isBusy={isExecutePending} className="w-full">
            <ThemedButton
              fullWidth
              variant={model.variant}
              isDisabled={mainDisabled}
              // ✅ 스피너 제거: pulse로 통일
              isLoading={false}
              onPress={() => {
                if (isBusy) return;
                onPress();
              }}
            >
              {model.text}
            </ThemedButton>
          </ButtonWithPulse>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

// "use client";

// import { AnimatePresence, motion } from "framer-motion";
// import { useContext, useMemo } from "react";

// import {
//   defaultTransition,
//   presenceTransition,
// } from "@/const/presenceTransition";
// import ThemedButton from "@/components/atoms/ThemedButton";
// import { WalletContext } from "@/app/WalletContextProvider";
// import { usePayContext } from "@/components/(main)/pay/PayProvider";
// import { TransactionContext } from "@/app/TransactionContextProvider";

// export default function PayExecuteButtons({ mode }: { mode: "PAY" | "ENTER" }) {
//   const pay = usePayContext();
//   const { setIsConnectModalOpen, setIsNetworkModalOpen } =
//     useContext(WalletContext);

//   const { isBusy } = useContext(TransactionContext);

//   const model = mode === "PAY" ? pay.payButton : pay.enterButton;

//   const onPress = useMemo(() => {
//     if (!pay.isConnected) return () => setIsConnectModalOpen(true);
//     if (pay.isWrongNetwork) return () => setIsNetworkModalOpen(true);
//     return mode === "PAY" ? pay.executePay : pay.executeEnter;
//   }, [
//     pay.isConnected,
//     pay.isWrongNetwork,
//     mode,
//     pay.executePay,
//     pay.executeEnter,
//     setIsConnectModalOpen,
//     setIsNetworkModalOpen,
//   ]);

//   // ✅ 최종 disabled: 기존 폼 검증(model.disabled) + tx 진행중(isBusy)
//   const mainDisabled = model.disabled || isBusy;

//   // ✅ Approve 버튼도 tx 진행중이면 잠그기
//   const approveDisabled =
//     isBusy ||
//     !pay.isConnected ||
//     pay.isWrongNetwork ||
//     !pay.showApproveUI ||
//     !pay.executeApproveWeth; // 함수 없으면 비활성

//   return (
//     <motion.div layout className="flex w-full flex-col" {...defaultTransition}>
//       <AnimatePresence initial={false}>
//         {mode === "ENTER" && pay.showApproveUI && (
//           <motion.div
//             key="approve"
//             {...presenceTransition}
//             className="mb-6 w-full"
//           >
//             <ThemedButton
//               fullWidth
//               variant="MINT"
//               isDisabled={approveDisabled}
//               isLoading={isBusy} // ✅ 진행중이면 로딩(원하면 approve 전용 pending도 따로 분리 가능)
//               onPress={() => pay.executeApproveWeth?.()}
//             >
//               Approve WETH
//             </ThemedButton>
//           </motion.div>
//         )}

//         <motion.div key="main" {...presenceTransition} className="w-full">
//           <ThemedButton
//             fullWidth
//             variant={model.variant}
//             isDisabled={mainDisabled}
//             isLoading={isBusy} // ✅ Pay/Enter 실행 중 로딩
//             onPress={() => {
//               // ✅ 혹시라도 isBusy인데 클릭 들어오면 막기
//               if (isBusy) return;
//               onPress();
//             }}
//           >
//             {model.text}
//           </ThemedButton>
//         </motion.div>
//       </AnimatePresence>
//     </motion.div>
//   );
// }
