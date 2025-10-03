"use client";

import dynamic from "next/dynamic";

// 클라 컴포넌트 안에서만 ssr:false를 쓸 수 있음
const DebugHUD = dynamic(() => import("@/debug/DebugHUD"), { ssr: false });

export default function ClientHUD() {
  // 필요시 환경변수로 on/off
  if (process.env.NEXT_PUBLIC_DEBUG !== "1") return null;
  return <DebugHUD />;
}
