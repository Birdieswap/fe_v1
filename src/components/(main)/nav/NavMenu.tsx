import {
  Button,
  Divider,
  ModalBody,
  ModalContent,
  useDisclosure,
} from "@heroui/react";
import Link from "next/link";
import { useEffect } from "react";

import Icons from "@/assets/icons/icons";
import ModalBase from "@/components/atoms/ModalBase";
import ModalCloseButton from "@/components/atoms/ModalCloseButton";

import { MobileNavLink } from "./NavbarLink";

export default function NavMenu(props: ReturnType<typeof useDisclosure>) {
  // 화면 크기 변경 감지하여 모바일에서 데스크탑으로 변경 시 모달 닫기

  const { isOpen, onClose } = props;

  //  이제 destructured 변수들을 의존성 배열에 사용
  useEffect(() => {
    const handleResize = () => {
      // 640px 이상이면 모바일 화면이 아님 (sm 브레이크포인트)
      if (window.innerWidth >= 640 && isOpen) {
        onClose();
      }
    };

    // 초기 화면 크기 체크
    handleResize();

    // 화면 크기 변경 이벤트 리스너 추가
    window.addEventListener("resize", handleResize);

    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [isOpen, onClose]); //  props.isOpen, props.onClose 대신 destructured 변수 사용

  return (
    <ModalBase
      className="mt-2 pt-6 sm:hidden"
      classNames={{
        backdrop: "bg-black/60 supports-[backdrop-filter]:backdrop-blur-none",
        wrapper: "items-end justify-center",
        base: "m-0 max-h-[75vh] overflow-hidden",
        body: "p-0 h-full flex flex-col",
        closeButton: "absolute top-3 right-4",
      }}
      closeButton={<ModalCloseButton onClose={onClose} />}
      isDismissable={true}
      scrollBehavior="inside"
      isKeyboardDismissDisabled={false}
      isOpen={isOpen}
      motionProps={{
        variants: {
          enter: {
            y: 0,
            opacity: 1,
            transition: {
              duration: 0.3,
              ease: "easeOut",
            },
          },
          exit: {
            y: "100%",
            opacity: 0,
            transition: {
              duration: 0.3,
              ease: "easeIn",
            },
          },
        },
      }}
      placement="bottom"
      //  모바일에 최적화된 스타일
      size="lg"
      //  하단 슬라이드 애니메이션
      onClose={onClose}
    >
      <ModalContent className="h-full">
        <ModalBody className="p-0 h-full flex flex-col">
          {/*  모바일 메뉴 아이템들 - onClick으로 모달 닫기 */}
          <div className="flex-1 overflow-y-auto">
            <div className="flex flex-col space-y-2 px-6 py-4 text-foreground transition-colors ">
              <MobileNavLink href="/" onClick={onClose}>
                <span>SWAP</span>
              </MobileNavLink>

              <MobileNavLink href="/farm" onClick={onClose}>
                <span>FARM</span>
              </MobileNavLink>

              <MobileNavLink
                href="https://docs.birdieswap.com"
                target="_blank"
                onClick={onClose}
              >
                <span>DOCS</span>
              </MobileNavLink>

              <MobileNavLink href="/faq" onClick={onClose}>
                <span>FAQ</span>
              </MobileNavLink>
            </div>

            <Divider className="bg-default-300 dark:bg-default-100" />

            <div className="flex flex-col gap-5 py-4">
              <div className="flex flex-row gap-4 px-10">
                <Link
                  className="text-sm text-foreground transition-colors hover:text-default-800"
                  href="https://https://docs.birdieswap.com/legal/terms-of-service"
                  target="_blank"
                  onClick={onClose}
                >
                  Terms of Service
                </Link>
                <Link
                  className="text-sm text-foreground transition-colors hover:text-default-800"
                  href="https://docs.birdieswap.com/legal/privacy-policy"
                  target="_blank"
                  onClick={onClose}
                >
                  Privacy Policy
                </Link>
              </div>

              <div className="flex flex-row gap-4 px-8">
                <a
                  className="text-sm text-default-900 dark:text-default-600"
                  href="https://discord.com"
                  rel="noreferrer"
                  target="_blank"
                >
                  <Button isIconOnly size="sm" variant="light">
                    <Icons.SocialDiscord />
                  </Button>
                </a>
                <a
                  className="text-sm text-default-900 dark:text-default-600"
                  href="https://twitter.com"
                  rel="noreferrer"
                  target="_blank"
                >
                  <Button isIconOnly size="sm" variant="light">
                    <Icons.SocialTwitter />
                  </Button>
                </a>
                <a
                  className="text-sm text-default-900 dark:text-default-600"
                  href="https://medium.com"
                  rel="noreferrer"
                  target="_blank"
                >
                  <Button isIconOnly size="sm" variant="light">
                    <Icons.SocialMedium />
                  </Button>
                </a>
              </div>
            </div>

            {/* ⭐ 하단 safe area */}
            <div className="h-4" />
          </div>
        </ModalBody>
      </ModalContent>
    </ModalBase>
  );
}
