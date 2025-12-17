import Container from "@/app/(landing)/landing/Container";
import Icons from "@/assets/icons/icons";

export default function CommunitySection() {
  return (
    <section className="w-full bg-default-100 dark:bg-dark-popup-bg py-10 px-4 sm:px-0">
      <Container>
        <div className="flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-center sm:gap-6">
          <h3 className="text-[30px] font-semibold text-foreground sm:text-[28px]">
            Join our community
          </h3>

          <div className="flex w-full items-center justify-center gap-10 sm:w-auto sm:justify-start">
            <a href="https://discord.com" target="_blank" rel="noreferrer">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-default-200 dark:hover:bg-default-100">
                <Icons.SocialDiscord className="h-10 w-10 text-default-900 dark:text-default-400" />
              </span>
            </a>

            <a href="https://twitter.com" target="_blank" rel="noreferrer">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-default-200 dark:hover:bg-default-100">
                <Icons.SocialTwitter className="h-10 w-10 text-default-900 dark:text-default-400" />
              </span>
            </a>

            <a href="https://medium.com" target="_blank" rel="noreferrer">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-default-200 dark:hover:bg-default-100">
                <Icons.SocialMedium className="h-10 w-10 text-default-900 dark:text-default-400" />
              </span>
            </a>
          </div>
        </div>
      </Container>
    </section>
  );
}
