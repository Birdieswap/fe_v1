import Container from "@/app/(landing)/landing/Container";
import Image from "next/image";

export default function HeroSection() {
  return (
    <section className="w-full bg-background pt-0 pb-[80px] lg:py-[100px]">
      <Container className="py-0">
        {/* ✅ 모바일: 가운데 정렬 / 웹: 상단 정렬 */}
        <div className="flex flex-col items-center gap-[56px] lg:flex-row lg:items-start lg:justify-between lg:gap-0">
          {/* Text */}
          <div className="w-full max-w-[520px] px-[16px] pt-[80px] lg:px-0 lg:pt-[100px]">
            <p className="text-[24px] font-semibold text-default-800 dark:text-default-700 lg:text-[40px]">
              A New Era of Swap
            </p>

            <h1 className="mt-2 text-[36px] font-bold leading-[1.1] text-foreground lg:text-[46px] lg:whitespace-nowrap">
              <span className="block lg:inline">Starts with </span>
              <span className="block lg:inline text-light-primary dark:text-dark-green-key">
                Birdieswap
              </span>
            </h1>

            <p className="mt-5 text-[18px] font-light leading-8 text-default-900 dark:text-default-600 lg:text-[24px]">
              <span className="max-[360px]:hidden">
                Birdieswap uses market-proven DeFi money
                <br />
                legos to deliver the best performance!
              </span>

              <span className="hidden max-[360px]:inline">
                Birdieswap uses market-proven DeFi <br />
                money legos to deliver the best <br />
                performance!
              </span>
            </p>

            <div className="mt-7">
              <div
                className="
                  flex items-center justify-center rounded-[4px]
                  w-[300px] h-[43px]
                  bg-light-primary text-background font-normal
                  dark:bg-dark-green-key
                  lg:w-[400px] lg:h-[50px]
                  text-[15px] lg:text-[20px]
                "
              >
                Enjoy your DeFi journey with Birdieswap
              </div>
            </div>
          </div>

          {/* Image */}
          <div className="relative shrink-0 w-[420px] h-[444px] lg:w-[520px] lg:h-[550px]">
            <Image
              src="/landing/hero.svg" // ✅ 문자열(public 경로)
              alt="Hero"
              fill
              className="object-contain" // ✅ 안 잘리고 전체 들어감
              priority // ✅ 히어로는 빨리
              unoptimized // ✅ /_next/image 안 타서 middleware 영향 회피
              sizes="(min-width: 1024px) 520px, 420px"
            />
          </div>
        </div>
      </Container>
    </section>
  );
}
