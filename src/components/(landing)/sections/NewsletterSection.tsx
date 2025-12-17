"use client";

import Container from "@/app/(landing)/landing/Container";
import { useMemo, useState } from "react";

const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzUHJG_xK6cCYn8enrHUo0u85ck8PL89cjvgO2N8IC-gvDOHGA4CKfTCx602C6vfDEU/exec";

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export default function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done">("idle");

  const canSubmit = useMemo(
    () => isValidEmail(email) && status === "idle",
    [email, status]
  );

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setStatus("submitting");
    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `email=${encodeURIComponent(email)}`,
      });
      setStatus("done");
      setEmail("");
      setTimeout(() => setStatus("idle"), 2000);
    } catch {
      setStatus("idle");
    }
  };

  return (
    <section className="w-full bg-light-primary px-4 sm:px-0 py-10 dark:bg-dark-green-key">
      <Container>
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div className="max-w-[620px]">
            <h3 className="text-[26px] font-semibold text-background sm:text-[36px]">
              Stay in the Loop
            </h3>
            <p className="mt-2 text-[13px] leading-6 text-background sm:text-[14px]">
              If you&apos;re interested, drop us your email. We&apos;ll keep you
              updated on key news and our launch. We may invite selected
              subscribers to join the Birdieswap closed beta.
            </p>
          </div>

          <form
            onSubmit={onSubmit}
            className="flex w-full max-w-[420px] items-center"
          >
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="contact@Birdieswap.com"
              className="h-10 w-full rounded-l-md border border-white/60 bg-background px-4 text-[14px] text-foreground outline-none
                         placeholder:text-default-600"
            />
            <button
              type="submit"
              disabled={!canSubmit}
              className={[
                "h-10 shrink-0 rounded-r-md px-4 text-[14px] font-medium bg-default-900 dark:bg-default-200",
                canSubmit
                  ? "text-primary dark:text-dark-green-key hover:opacity-90"
                  : "text-background cursor-not-allowed",
              ].join(" ")}
            >
              {status === "submitting"
                ? "Submitting..."
                : status === "done"
                  ? "Subscribed!"
                  : "Subscribe"}
            </button>
          </form>
        </div>
      </Container>
    </section>
  );
}
