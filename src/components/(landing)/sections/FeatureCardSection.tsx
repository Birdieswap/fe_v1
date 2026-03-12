import Image from "next/image";
import Container from "@/app/(landing)/landing/Container";

function FeatureCard(props: {
  imgSrc: string;
  imgAlt: string;
  titleLeft: string;
  titleAccent: string;
  desc: React.ReactNode;
  bottomTop: string;
  bottomBottom?: React.ReactNode;
}) {
  return (
    <div className="flex h-full flex-col items-center text-center">
      <div className="relative h-[190px] w-[240px] md:h-[240px] md:w-[304px]">
        <Image
          src={props.imgSrc}
          alt={props.imgAlt}
          fill
          className="object-contain"
          sizes="(min-width: 768px) 304px, 240px"
          unoptimized
        />
      </div>

      <h3 className="mt-10 text-[28px] font-semibold md:text-[32px]">
        <span className="text-default-900 dark:text-default-500">
          {props.titleLeft}{" "}
        </span>
        <span className="text-light-primary dark:text-dark-green-key">
          {props.titleAccent}
        </span>
      </h3>

      {/* desc 높이를 어느 정도 통일 (원하면 값 조절) */}
      <p className="mt-3 min-h-[3.5rem] text-[14px] font-light leading-6 text-foreground md:min-h-[4.5rem] md:text-[18px] md:leading-7">
        {props.desc}
      </p>

      {/* Bottom Box를 카드 하단으로 밀어 고정 */}
      <div
        className="
          mt-auto pt-6 w-full
          max-w-[328px]
          md:max-w-[408px]
        "
      >
        <div
          className="
            h-[107px] md:h-[110px]
            rounded-xl border border-default-100
            bg-background shadow-[0_4px_24px_rgba(20,25,42,0.08)]
            dark:border-dark-popup-bg
          "
        >
          <div className="flex h-full flex-col items-center justify-center gap-1 px-[32px] py-[24px]">
            <div className="text-[18px] font-medium text-foreground md:text-[20px]">
              {props.bottomTop}
            </div>
            <div className="text-[18px] text-foreground md:text-[20px]">
              {props.bottomBottom}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FeatureCardsSection() {
  return (
    <section className="w-full bg-default-100 dark:bg-dark-popup-bg py-[100px]">
      <Container className="px-[16px] md:px-[62px]">
        {/* 960px 이상: 좌우 배치 + gap은 남는 공간에서 자연스럽게 줄어듦
            960px 이하: 위아래 배치 */}
        <div className="flex flex-col items-center gap-[64px] min-[960px]:flex-row min-[960px]:items-start min-[960px]:justify-between min-[960px]:gap-0">
          {/* 각 카드 폭을 유지하려고 shrink 방지 */}
          <div className="shrink-0">
            <FeatureCard
              imgSrc="/landing/card1.svg"
              imgAlt="Earn Dual Yields"
              titleLeft="Earn"
              titleAccent="Dual Yields"
              desc={
                <>
                  Stop choosing between interest and trading-fee
                  <br />
                  revenue and enjoy the highest yield available!
                </>
              }
              bottomTop="Supply once, earn both"
              // bottomBottom={
              //   <>
              //     Only on{" "}
              //     <span className="font-medium text-light-primary dark:text-dark-green-key">
              //       Birdieswap
              //     </span>
              //   </>
              // }
            />
          </div>

          <div className="shrink-0">
            <FeatureCard
              imgSrc="/landing/card2.svg"
              // imgAlt="Earn Swap Points"
              // titleLeft="Earn"
              // titleAccent="Swap Points"
              imgAlt="Easy Enter & Pay"
              titleLeft="Easy"
              titleAccent="Enter & Pay"
              desc={
                <>
                  {/* Swap and Earn */}
                  Move in and out of your assets
                  <br />
                  {/* Birdieswap Points for selected pairs */}
                  with less friction, whenever you want
                </>
              }
              // bottomTop="Swap more, get points more"
              bottomTop="Click once, move freely"
              // bottomBottom={
              //   <>
              //     Only on{" "}
              //     <span className="font-medium text-light-primary dark:text-dark-green-key">
              //       Birdieswap
              //     </span>
              //   </>
              // }
            />
          </div>
        </div>
      </Container>
    </section>
  );
}
