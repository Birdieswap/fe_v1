"use client";
import { useEffect, useState } from "react";

export default function LegalPanel({
  doc, // "terms" | "privacy"
  className = "",
  fallbackHref, // 실패 시 원문 링크
}: {
  doc: "terms" | "privacy";
  className?: string;
  fallbackHref: string;
}) {
  const [html, setHtml] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setErr(null);
    fetch(`/api/legal/${doc}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        if (!alive) return;
        if (j?.ok && typeof j.html === "string") setHtml(j.html);
        else setErr(j?.error ?? "unknown_error");
      })
      .catch(() => alive && setErr("network_error"))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [doc]);

  if (loading)
    return (
      <div className="h-[50vh] overflow-auto px-1 text-sm text-default-600">
        Loading...
      </div>
    );

  if (err) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-danger">
          문서를 불러오지 못했습니다. (원인: {err})
        </p>
        <a
          href={fallbackHref}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline"
        >
          원문 열기
        </a>
      </div>
    );
  }

  return (
    <div
      className={
        "prose prose-neutral dark:prose-invert max-w-none text-sm leading-6 " +
        className
      }
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
