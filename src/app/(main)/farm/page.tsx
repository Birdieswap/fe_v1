import { Suspense } from "react";
import FarmIndex from ".";

export default function FarmPage() {
  return (
    <div className="container flex h-full grow flex-col items-center py-2 sm:py-8 md:px-3">
      <Suspense fallback={null}>
        <FarmIndex />
      </Suspense>
    </div>
  );
}
