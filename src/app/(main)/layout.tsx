import { Fragment } from "react";

import Footer from "@/components/Footer";
import Navbar from "@/components/(main)/nav/Navbar";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Fragment>
      <Navbar />
      <main className="flex grow flex-col items-center sm:pb-12">
        {children}
      </main>
      <Footer />
    </Fragment>
  );
}
