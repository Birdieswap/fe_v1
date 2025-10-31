import { Spacer } from "@heroui/react";

export function LoadingPulse({
  w = "w-12",
  className = "",
}: {
  w?: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center align-middle ${className}`}
      aria-busy="true"
    >
      <Spacer x={0.5} />
      <span
        className={`inline-block h-[14px] ${w} rounded-md bg-default-200 dark:bg-default-700 animate-pulse`}
      />
    </span>
  );
}
