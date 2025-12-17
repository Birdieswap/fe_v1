import { Fragment } from "react";
import Footer from "@/components/Footer";
import NavbarLanding from "@/components/(landing)/nav/NavbarLanding";
import AssetsContextProvider from "../AssetsContextProvider";

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Fragment>
      <NavbarLanding />
      <main className="flex grow flex-col items-center sm:pb-12">
        {children}
      </main>
      <Footer />
    </Fragment>
  );
}
