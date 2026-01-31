import { Fragment } from "react";
import Footer from "@/components/Footer";
import NavbarLanding from "@/components/(landing)/nav/NavbarLanding";
import { LandingNetworkProvider } from "./LandingNetworkProvider";

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LandingNetworkProvider>
      <Fragment>
        <NavbarLanding />
        <main className="flex grow flex-col items-center sm:pb-12">
          {children}
        </main>
        <Footer />
      </Fragment>
    </LandingNetworkProvider>
  );
}
