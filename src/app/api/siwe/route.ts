import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  // 클라이언트에서 지갑 주소와 서명(signature)을 보내왔다고 가정
  const { address, signature, message } = await req.json();

  // TODO: 여기서 실제 SIWE 검증 로직 수행 (메시지 포맷/체인/만료/nonce 검증 + 서명 확인)
  const verified = Boolean(address && signature && message); // 실제 검증으로 대체

  if (!verified) {
    return new NextResponse(JSON.stringify({ ok: false }), { status: 401 });
  }

  // 검증 통과 시 서버 세션 발급(예: DB에 기록) → 세션 ID를 HttpOnly 쿠키로 내려줌
  const sid = randomUUID().replace(/-/g, "");
  // TODO: 세션 저장소에 { sid, address, createdAt, ip, ua } 등 저장

  const res = NextResponse.json({ ok: true, address });
  res.cookies.set("sid", sid, {
    httpOnly: true,
    secure: true,
    sameSite: "lax", // strict로 하면 일부 리디렉션 플로우에서 UX 제한
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7일
  });
  return res;
}

export async function DELETE() {
  // 로그아웃: 세션 제거 + 쿠키 만료
  const res = NextResponse.json({ ok: true });
  res.cookies.set("sid", "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}
