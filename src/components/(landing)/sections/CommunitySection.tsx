import Container from "@/app/(landing)/landing/Container";
import Icons from "@/assets/icons/icons";

export default function CommunitySection() {
  return (
    <section className="w-full  bg-light-primary mb-5 px-4 sm:px-0 py-10 dark:bg-dark-green-key">
      <Container>
        <div className="flex flex-col items-center justify-between gap-8 sm:flex-row sm:items-center sm:gap-6">
          <h3 className="text-[30px] font-semibold text-background sm:text-[28px]">
            Join our community
          </h3>

          <div className="flex w-full items-center justify-center gap-10 sm:w-auto sm:justify-start">
            <a href="https://discord.com" target="_blank" rel="noreferrer">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-default-200 dark:hover:bg-default-100">
                <Icons.SocialDiscord className="h-10 w-10 text-background" />
              </span>
            </a>

            <a href="https://twitter.com" target="_blank" rel="noreferrer">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-default-200 dark:hover:bg-default-100">
                <Icons.SocialTwitter className="h-10 w-10 text-background" />
              </span>
            </a>

            <a href="https://medium.com" target="_blank" rel="noreferrer">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-default-200 dark:hover:bg-default-100">
                <Icons.SocialMedium className="h-10 w-10 text-background" />
              </span>
            </a>
          </div>
        </div>
      </Container>
    </section>
  );
}
