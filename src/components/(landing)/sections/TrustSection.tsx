import Image from "next/image";
import Container from "@/app/(landing)/landing/Container";

type TrustBadge = {
  label: string;
  src: string;
  alt: string;
};

const BADGES: TrustBadge[] = [
  { label: "Part of", src: "/landing/Harvest.svg", alt: "Harvest Finance" },
  { label: "Built on", src: "/landing/BaseLogo.svg", alt: "Base" },
  { label: "Audited by", src: "/landing/certik.svg", alt: "CertiK" },
  { label: "Bug Bounty", src: "/landing/immunefi.svg", alt: "Immunefi" },
];

export default function TrustSection() {
  return (
    <section className="w-full bg-light-light-mint py-10 px-4 dark:bg-dark-mid-mint">
      <Container>
        <div
          className="
            grid grid-cols-2 place-items-center
            gap-x-6 gap-y-8
            min-[860px]:grid-cols-4 min-[860px]:gap-x-10
          "
        >
          {BADGES.map((b) => (
            <div
              key={b.label}
              className="
                flex flex-col items-start
                w-[120px] min-[860px]:w-[200px]
                min-h-[72px] min-[860px]:min-h-[96px]
              "
            >
              <span
                className="
                  w-full text-left
                  font-medium text-default-800 dark:text-default-100
                  text-[15px] min-[860px]:text-[24px]
                  leading-none
                "
              >
                {b.label}
              </span>

              <div className="mt-3 w-[120px] min-[860px]:w-[200px]">
                <Image
                  src={b.src}
                  alt={b.alt}
                  width={200}
                  height={50}
                  sizes="(max-width: 860px) 120px, 200px"
                  className="h-auto w-full object-contain"
                  priority
                />
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
