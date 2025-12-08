"use client";

import Icons from "@/assets/icons/icons";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  Image,
  Button,
} from "@heroui/react";
import { useDisclosure } from "@heroui/react";
import clsx from "clsx";

export type PoolLike = {
  symbol: string;
  fullName: string;
  iconSrc?: string;
};

interface Props<T extends PoolLike> {
  pools: T[];
  selected?: T;
  onSelect: (pool: T) => void;
}

/**
 * PAY / ENTER 공용 Pool 선택 컴포넌트
 * - 큰 "Select a Pool" 버튼
 * - 모달에서 lpVault 리스트 선택
 */
export default function PayPoolSelector<T extends PoolLike>({
  pools,
  selected,
  onSelect,
}: Props<T>) {
  const { isOpen, onOpen, onClose, onOpenChange } = useDisclosure();

  const label = selected ? selected.fullName : "Select a Pool";

  return (
    <>
      {/* 메인 Select a Pool 버튼 */}
      <Button
        fullWidth
        variant="bordered"
        onPress={onOpen}
        className={clsx(
          "relative flex h-11 items-center justify-start rounded-lg",
          "border border-default-300 dark:border-default-100 bg-background px-3 text-sm",
          "hover:bg-default-100"
        )}
      >
        {/* 가운데 정렬 라벨 */}
        <span
          className={clsx(
            "pointer-events-none absolute left-1/2 -translate-x-1/2",
            selected ? "text-default-900" : "text-default-500"
          )}
        >
          {label}
        </span>

        {/* 오른쪽 끝 화살표 아이콘 */}
        <span className="ml-auto flex items-center">
          <Icons.SwapTokenArrow />
        </span>
      </Button>

      {/* 풀 선택 모달 */}
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        size="lg"
        scrollBehavior="inside"
      >
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="text-base font-semibold">
                Select a Pool
              </ModalHeader>
              <ModalBody>
                <div className="flex flex-col gap-2">
                  {pools.map((pool) => (
                    <button
                      key={pool.symbol + pool.fullName}
                      type="button"
                      onClick={() => {
                        onSelect(pool);
                        onClose();
                      }}
                      className={clsx(
                        "flex w-full items-center gap-3 rounded-lg px-2 py-2",
                        "hover:bg-default-100"
                      )}
                    >
                      {pool.iconSrc && (
                        <Image
                          src={pool.iconSrc}
                          alt={pool.symbol}
                          width={28}
                          height={28}
                          classNames={{ img: "object-contain" }}
                        />
                      )}
                      <div className="flex flex-col items-start">
                        <span className="text-sm font-semibold">
                          {pool.symbol}
                        </span>
                        <span className="text-xs text-default-500">
                          {pool.fullName}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
