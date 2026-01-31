// src/components/landing/sections/FaqSection.tsx
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Container from "@/app/(landing)/landing/Container";

const appUrl = (
  process.env.NEXT_PUBLIC_APP_URL || "https://app.birdieswap.com"
).replace(/\/$/, "");

type Faq = { q: string; a: React.ReactNode };

export default function FaqSection() {
  const faqs = useMemo<Faq[]>(
    () => [
      {
        q: "What is Birdieswap?",
        a: (
          <>
            Birdieswap is a decentralized interface software that helps users
            seamlessly connect and utilize various DeFi protocols.
            <br />
            <br />
            We do not operate a bank or exchange ourselves. Instead, we provide
            Router technology that connects verified external protocols (Yield
            Vaults, DEXs, etc.), enabling users to enjoy the benefits of both
            Deposit Yields and Trading Fees simultaneously without complex
            processes.
          </>
        ),
      },
      {
        q: "Does Birdieswap have risks?",
        a: (
          <>
            Like all DeFi, risks exist (smart contracts, market conditions,
            underlying protocols). We mitigate these by integrating proven
            protocols and continuously improving safety measures.
          </>
        ),
      },
      {
        q: "When will Birdieswap launch?",
        a: (
          <>
            We’ll announce the launch timeline via official channels. Subscribe
            below to stay updated.
          </>
        ),
      },
    ],
    [],
  );

  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section className="w-full bg-background py-[100px] px-4 sm:px-0">
      <Container>
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[140px_1fr]">
          <h2 className="text-[28px] font-semibold text-foreground sm:text-[36px]">
            FAQs
          </h2>

          <div className="w-full">
            {faqs.map((f, idx) => {
              const open = openIdx === idx;
              return (
                <div
                  key={f.q}
                  className="border-b border-default-400 py-4 dark:border-default-100"
                >
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-4 text-left"
                    onClick={() => setOpenIdx(open ? null : idx)}
                  >
                    <span className="text-[14px] font-medium text-foreground sm:text-[16px]">
                      {f.q}
                    </span>
                    <span className="text-light-primary dark:text-dark-green-key text-[18px] font-semibold">
                      {open ? "–" : "+"}
                    </span>
                  </button>

                  <div
                    className={[
                      "overflow-hidden transition-all duration-300",
                      open ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0",
                    ].join(" ")}
                  >
                    <div className="mt-4 rounded-lg bg-default-100 p-4 text-[14px] leading-6 text-foreground dark:bg-dark-popup-bg ">
                      {f.a}
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="mt-4 text-right">
              <Link
                href={`${appUrl}/faq`}
                prefetch={false}
                className="text-[13px] text-default-800 hover:text-foreground dark:text-default-700"
              >
                See more &nbsp;›
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
