import type { ReactNode } from "react";
import { Footer, Header } from "@/components/Chrome";
import Link from "next/link";

export function AccountScreen({
  eyebrow,
  title,
  blurb,
  children,
}: {
  eyebrow: string;
  title: string;
  blurb: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        <p className="text-xs uppercase tracking-[0.22em] text-money">{eyebrow}</p>
        <h1 className="mt-2 font-serif text-4xl text-money">{title}</h1>
        <p className="mt-2 max-w-2xl text-cream/60">{blurb}</p>
        <div className="mt-8">{children}</div>
      </main>
      <Footer />
    </div>
  );
}

export function SignInGate() {
  return (
    <p className="rounded-2xl border border-money/20 bg-queen-deep p-6 text-cream/80">
      <Link href="/login" className="text-gold hover:underline">
        Log in
      </Link>{" "}
      to use this page.
    </p>
  );
}
