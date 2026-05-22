"use client";

import dynamic from "next/dynamic";

const DynamicProvider = dynamic(
  () => import("./providers").then((mod) => mod.default),
  {
    ssr: false, // ⭐ 핵심: 서버사이드 렌더링 비활성화
    loading: () => (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto size-12 animate-spin rounded-full border-b-2 border-blue-500" />
          <p className="mt-4">Loading...</p>
        </div>
      </div>
    ),
  },
);

export default DynamicProvider;
