"use client";

import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";

type Rule = { max: number; len: number };

function chooseLen(width: number, rules: Rule[]) {
  for (const r of rules) if (width <= r.max) return r.len;
  return rules[rules.length - 1]?.len ?? 40;
}

export default function ResponsiveSlice({
  text,
  className,
  rules = [
    { max: 400, len: 30 }, // ≤ 400px → 30자
    { max: 640, len: 40 }, // ≤ 640px → 40자
    { max: Infinity, len: 56 }, // 그 이상 → 56자 (원하는 값으로 조절)
  ],
  titleAll = true,
  ellipsis = "…",
}: {
  text: string | undefined | null;
  className?: string;
  rules?: Rule[];
  titleAll?: boolean;
  ellipsis?: string;
}) {
  const [vw, setVw] = useState(0);

  useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const len = chooseLen(vw, rules);
  const full = text ?? "";
  const shown = useMemo(() => {
    if (!full) return "";
    return full.length > len ? `${full.slice(0, len)}${ellipsis}` : full;
  }, [full, len, ellipsis]);

  return (
    <span
      className={clsx("inline-block align-middle", className)}
      title={titleAll ? full : undefined}
      aria-label={full}
    >
      {shown}
    </span>
  );
}
