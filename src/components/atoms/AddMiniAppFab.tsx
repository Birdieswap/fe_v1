"use client";

import { useEffect, useState } from "react";
import { sdk } from "@farcaster/miniapp-sdk";

export default function AddMiniAppFab() {
  const [isVisible, setIsVisible] = useState(false); // 버튼 표시 여부
  const [isModalOpen, setIsModalOpen] = useState(false); // 모달 표시 여부
  const [isLoading, setIsLoading] = useState(false); // 로딩 상태

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const context = await sdk.context;

        // 1. 미니 앱 환경이 아니거나 유저 정보가 없으면 버튼 숨김
        if (!context || !context.user) {
          setIsVisible(false);
          return;
        }

        // 2. 이미 앱을 추가한 유저라면 버튼 숨김
        if (context.client.added) {
          setIsVisible(false);
        } else {
          setIsVisible(true);
        }
      } catch (e) {
        console.error("Context Check Failed:", e);
        setIsVisible(false);
      }
    };

    checkStatus();
  }, []);

  // 앱 추가 실행 함수
  const handleConfirmAdd = async () => {
    setIsLoading(true);
    try {
      // 시스템의 앱 추가 팝업 호출
      // ★ 수정: 결과를 변수에 담지 않고 바로 await만 합니다.
      await sdk.actions.addFrame();

      // 여기까지 에러 없이 왔다면 '성공'한 것입니다.
      setIsVisible(false); // 버튼 숨기기
      setIsModalOpen(false); // 모달 닫기
    } catch (error) {
      // 유저가 취소하거나 에러가 났을 때 여기로 옵니다.
      // Farcaster SDK 에러 코드를 확인하여 취소인지 실제 에러인지 구분할 수 있습니다.
      // (보통 유저가 취소하면 에러를 던집니다)
      console.log("User cancelled or failed:", error);

      // 취소가 아닌 진짜 에러일 때만 알림을 띄우고 싶다면 조건을 추가할 수 있습니다.
      // 예: if (error.message !== 'User rejected') alert(...)
    } finally {
      setIsLoading(false);
    }
  };

  // 버튼을 보여줄 조건이 아니면 렌더링 안 함
  if (!isVisible) return null;

  return (
    <>
      {/* 1. 우측 하단 플로팅 버튼 (FAB) */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-4 right-4 z-40 flex h-8 w-8 items-center justify-center rounded-full bg-light-primary dark:bg-dark-green-key text-white shadow-lg transition-transform hover:scale-110 active:scale-95 animate-bounce-slow"
        aria-label="Add App"
      >
        {/* Plus Icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>

      {/* 2. 안내 모달 (Overlay + Content) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* 배경 (클릭 시 닫기) */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsModalOpen(false)}
          />

          {/* 모달 내용 */}
          <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl bg-white p-6 shadow-2xl dark:bg-[#1e293b] animate-fade-in-up">
            {/* 헤더 & 타이틀 */}
            <div className="mb-5 flex flex-col items-center text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-3xl shadow-sm dark:bg-blue-900/30">
                📱
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Add Birdieswap App
              </h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                Add the app for seamless access to Birdieswap!
              </p>
            </div>

            {/* 혜택 리스트 */}
            <div className="mb-6 space-y-3 rounded-xl bg-gray-50 p-4 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-300 border border-gray-100 dark:border-gray-700">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-5 w-5 min-w-[20px] items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <span className="leading-snug">
                  Auto-connect to your wallet with one click
                </span>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-5 w-5 min-w-[20px] items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <span className="leading-snug">
                  Receive alerts for asset changes and swaps
                </span>
              </div>
            </div>

            {/* 질문 문구 */}
            <p className="mb-4 text-center text-sm font-medium text-gray-900 dark:text-white">
              Would you like to add the app?
            </p>

            {/* 버튼 그룹 (Cancel / Confirm) */}
            <div className="flex gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 active:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAdd}
                disabled={isLoading}
                className="flex-1 rounded-xl bg-[#0052FF] py-3 text-sm font-semibold text-white shadow-md hover:bg-blue-600 active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 transition-all"
              >
                {isLoading ? "Adding..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
