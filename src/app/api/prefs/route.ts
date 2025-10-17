import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { riskConsent = "accepted" } = body;

  const res = NextResponse.json({ ok: true });
  res.cookies.set("risk_consent", String(riskConsent), {
    httpOnly: true, // JS 접근 차단
    secure: true, // HTTPS에서만
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1년
  });
  return res;
}
