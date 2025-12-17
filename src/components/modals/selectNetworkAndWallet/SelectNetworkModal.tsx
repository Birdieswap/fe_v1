"use client";

import "./SelectNetworkMenu.css";

import { Button, ModalBody, ModalContent, ModalHeader } from "@heroui/react";
import { Fragment, useContext, useEffect, useRef } from "react";
import clsx from "clsx";

import ModalBase from "@/components/atoms/ModalBase";
import { WalletContext } from "@/app/WalletContextProvider";
import { useNetworkSelection } from "@/app/NetworkSelectionProvider";

import { NetworkIcon, SelectNetworkListBox } from "./SelectNetworkMenu";

export default function SelectNetworkModal() {
  // ✅ open/close 상태는 기존 WalletContext 그대로 사용 (NavbarConnect 변경 최소화)
  const { isNetworkModalOpen, setIsNetworkModalOpen } =
    useContext(WalletContext);

  // ✅ 목록/선택/선택함수는 NetworkSelectionProvider에서 (WalletContext.networks 기반)
  const { networks, selectedNetwork, selectedChainId, selectNetwork } =
    useNetworkSelection();

  const modalRef = useRef<HTMLButtonElement>(null);

  // 화면 크기 변화 감지: 데스크탑(640px 이상)으로 전환 시 Modal 닫기
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 640 && isNetworkModalOpen) {
        setIsNetworkModalOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isNetworkModalOpen, setIsNetworkModalOpen]);

  const isOpen = isNetworkModalOpen;
  const isBase = selectedNetwork?.name?.toLowerCase() === "base";

  return (
    <Fragment>
      <Button
        ref={modalRef}
        isIconOnly
        radius={isBase ? "none" : "full"}
        className={clsx(
          "h-8 w-8 min-w-8 p-0",
          isBase ? "rounded-none" : "rounded-full"
        )}
        size="sm"
        variant="light"
        onPress={() => setIsNetworkModalOpen(true)}
      >
        {selectedNetwork ? (
          <div
            className={clsx(
              "flex items-center justify-center h-6 w-6 p-0 border-1 bg-white border-default-300 dark:border-default-200",
              isBase ? "rounded-none" : "rounded-full"
            )}
          >
            <NetworkIcon network={selectedNetwork} />
          </div>
        ) : (
          <span>Select Network</span>
        )}
      </Button>

      <ModalBase
        hideCloseButton
        portalContainer={
          typeof window !== "undefined" ? document.body : undefined
        }
        className="sm:hidden"
        // 모바일 최적화: iOS 16 backdrop blur 제거 + 컨테이너 고정 높이 + 내부 스크롤
        classNames={{
          backdrop: "bg-black/60 supports-[backdrop-filter]:backdrop-blur-none",
          wrapper: "items-end justify-center",
          base: "m-0 max-h-[65vh] overflow-hidden",
          body: "p-0 h-full flex flex-col",
        }}
        isOpen={isOpen}
        motionProps={{
          variants: {
            enter: {
              y: 0,
              opacity: 1,
              transition: { duration: 0.3, ease: "easeOut" },
            },
            exit: {
              y: "100%",
              opacity: 0,
              transition: { duration: 0.3, ease: "easeIn" },
            },
          },
        }}
        placement="bottom"
        scrollBehavior="inside"
        size="lg"
        onClose={() => {
          if (isOpen) setIsNetworkModalOpen(false);
        }}
      >
        <ModalContent>
          <ModalHeader className="px-6 py-[18px]">
            <p className="w-full text-[14px] font-medium leading-[20px] text-default-800 dark:text-foreground">
              Select a network
            </p>
          </ModalHeader>

          <ModalBody className="p-0 h-full flex flex-col">
            <div className="flex-1 overflow-y-auto [-webkit-overflow-scrolling:touch]">
              <SelectNetworkListBox
                networks={networks}
                selectedChainId={selectedChainId}
                onSelect={selectNetwork}
                onClose={() => setIsNetworkModalOpen(false)}
              />
              <div className="h-4" />
            </div>
          </ModalBody>
        </ModalContent>
      </ModalBase>
    </Fragment>
  );
}

// "use client";

// import "./SelectNetworkMenu.css";

// import { Button, ModalBody, ModalContent, ModalHeader } from "@heroui/react";
// import { Fragment, useContext, useRef, useEffect } from "react";

// import ModalBase from "@/components/atoms/ModalBase";
// import { WalletContext } from "@/app/WalletContextProvider";

// import { NetworkIcon, SelectNetworkListBox } from "./SelectNetworkMenu";
// import clsx from "clsx";

// export default function SelectNetworkModal() {
//   const {
//     selectedNetwork,
//     networks,
//     isNetworkModalOpen,
//     setIsNetworkModalOpen,
//   } = useContext(WalletContext);

//   const modalRef = useRef<HTMLButtonElement>(null);

//   // 핵심 추가: 화면 크기 변화 감지
//   useEffect(() => {
//     const handleResize = () => {
//       // 데스크탑으로 전환 시 (640px 이상) Modal 닫기
//       if (window.innerWidth >= 640 && isNetworkModalOpen) {
//         setIsNetworkModalOpen(false);
//       }
//     };

//     window.addEventListener("resize", handleResize);

//     return () => window.removeEventListener("resize", handleResize);
//   }, [isNetworkModalOpen, setIsNetworkModalOpen]);

//   const isOpen = isNetworkModalOpen;
//   const isBase = selectedNetwork?.name?.toLowerCase() === "base";
//   // useMemo(() => {
//   //   return isNetworkModalOpen && (modalRef.current?.checkVisibility() ?? false);
//   // }, [isNetworkModalOpen, modalRef]);

//   return (
//     <Fragment>
//       <Button
//         ref={modalRef}
//         isIconOnly
//         // ✅ base면 radius none, 아니면 full
//         radius={isBase ? "none" : "full"}
//         // ✅ base면 rounded-full 제거 (또는 rounded-none으로 명시)
//         className={clsx(
//           "h-8 w-8 min-w-8 p-0",
//           isBase ? "rounded-none" : "rounded-full"
//         )}
//         size="sm"
//         variant="light"
//         onPress={() => setIsNetworkModalOpen(true)}
//       >
//         {selectedNetwork ? (
//           <div
//             className={clsx(
//               "flex items-center justify-center h-6 w-6 p-0 border-1 bg-white border-default-300 dark:border-default-200",
//               // 아이콘 컨테이너도 같이 각지게 하려면 이것도 조건 처리
//               isBase ? "rounded-none" : "rounded-full"
//             )}
//           >
//             <NetworkIcon network={selectedNetwork} />
//           </div>
//         ) : (
//           <span>Select Network</span>
//         )}
//       </Button>
//       <ModalBase
//         hideCloseButton
//         portalContainer={
//           typeof window !== "undefined" ? document.body : undefined
//         }
//         className="sm:hidden"
//         //  모바일 최적화 설정
//         // iOS 16: backdrop blur 제거 + 컨테이너 고정 높이 + 외부 스크롤 금지
//         classNames={{
//           backdrop: "bg-black/60 supports-[backdrop-filter]:backdrop-blur-none",
//           wrapper: "items-end justify-center",
//           base: "m-0 max-h-[65vh] overflow-hidden",
//           body: "p-0 h-full flex flex-col",
//         }}
//         isOpen={isOpen}
//         motionProps={{
//           variants: {
//             enter: {
//               y: 0,
//               opacity: 1,
//               transition: { duration: 0.3, ease: "easeOut" },
//             },
//             exit: {
//               y: "100%",
//               opacity: 0,
//               transition: { duration: 0.3, ease: "easeIn" },
//             },
//           },
//         }}
//         placement="bottom"
//         scrollBehavior="inside"
//         size="lg"
//         onClose={() => {
//           if (isOpen) setIsNetworkModalOpen(false);
//         }}
//       >
//         <ModalContent>
//           <ModalHeader className="px-6 py-[18px]">
//             <p className="w-full text-[14px] font-medium leading-[20px] text-default-800 dark:text-foreground">
//               Select a network
//             </p>
//           </ModalHeader>
//           <ModalBody className="p-0 h-full flex flex-col">
//             <div className="flex-1 overflow-y-auto [-webkit-overflow-scrolling:touch]">
//               <SelectNetworkListBox
//                 networks={networks}
//                 onClose={() => setIsNetworkModalOpen(false)}
//               />
//               <div className="h-4" />
//             </div>
//           </ModalBody>
//         </ModalContent>
//       </ModalBase>
//     </Fragment>
//   );
// }
