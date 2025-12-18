import HeroSection from "@/components/(landing)/sections/HeroSection";
import FeatureCardsSection from "@/components/(landing)/sections/FeatureCardSection";
import StartInOneClickSection from "@/components/(landing)/sections/StartInOneClickSection";
import TrustSection from "@/components/(landing)/sections/TrustSection";
import FaqSection from "@/components/(landing)/sections/FaqSection";
import CommunitySection from "@/components/(landing)/sections/CommunitySection";
import NewsletterSection from "@/components/(landing)/sections/NewsletterSection";

export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <FeatureCardsSection />
      <StartInOneClickSection />
      <TrustSection />
      <FaqSection />
      <CommunitySection />
      {/* <NewsletterSection /> */}
    </>
  );
}
