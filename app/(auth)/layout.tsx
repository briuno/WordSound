import Link from "next/link";

import { Logo } from "@/components/brand";
import { OfflineBanner } from "@/components/offline-banner";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <OfflineBanner />
      <main className="flex min-h-dvh flex-col items-center justify-center px-5 py-12">
        <Link href="/" className="mb-8 rounded-xl">
          <Logo withTagline />
        </Link>
        <div className="w-full max-w-md">{children}</div>
      </main>
    </>
  );
}
