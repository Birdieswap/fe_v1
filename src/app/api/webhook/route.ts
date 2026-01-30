import { NextResponse } from "next/server";

export async function POST(request: Request) {
  // 나중에 여기에 보안 검증이나 알림 처리 로직이 들어갑니다.
  // 지금은 단순히 "수신 성공" 신호만 보냅니다.
  return NextResponse.json({ status: "ok", message: "Webhook received" });
}

export async function GET() {
  // 혹시 모를 GET 요청에 대한 헬스 체크
  return NextResponse.json({ status: "active" });
}
