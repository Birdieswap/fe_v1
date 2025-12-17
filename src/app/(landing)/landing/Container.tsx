import clsx from "clsx";
import { PropsWithChildren } from "react";

export default function Container({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={clsx("mx-auto w-full max-w-[1060px] px-0 sm:px-6", className)}
    >
      {children}
    </div>
  );
}
