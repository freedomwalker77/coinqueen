"use client";

import { getAccount } from "@/app/actions/market";
import { AccountMenu } from "@/components/AccountMenu";
import type { SessionUser } from "@/lib/definitions";
import Link from "next/link";
import { useEffect, useState } from "react";

export function AuthStatus() {
  const [user, setUser] = useState<SessionUser | null | undefined>(undefined);

  useEffect(() => {
    void getAccount().then(setUser);
  }, []);

  if (user === undefined) {
    return <span className="px-3 py-1.5 text-cream/40">…</span>;
  }

  if (!user) {
    return (
      <div className="flex items-center gap-1">
        <Link
          href="/login"
          className="rounded-full px-3 py-1.5 text-cream/75 hover:bg-gold/10 hover:text-gold"
        >
          Log in
        </Link>
        <Link
          href="/signup"
          className="rounded-full border border-gold/40 px-3 py-1.5 text-cream hover:bg-gold/10"
        >
          Sign up
        </Link>
      </div>
    );
  }

  return <AccountMenu user={user} />;
}
