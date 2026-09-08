"use client";

import { logout } from "@/app/actions/auth";
import type { SessionUser } from "@/lib/definitions";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

function Icon({ d, className }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className ?? "h-4 w-4 shrink-0"} aria-hidden>
      <path d={d} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const buyer = [
  { href: "/account", label: "Dashboard", d: "M4 13h4v7H4zM10 4h4v16h-4zM16 9h4v11h-4z" },
  { href: "/orders", label: "My orders", d: "M4 7h16v12H4zM8 7V5h8v2" },
  { href: "/messages", label: "Messages", d: "M4 6h16v10H8l-4 4z" },
  { href: "/shop", label: "Profile", d: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM5 20a7 7 0 0 1 14 0" },
  { href: "/training", label: "My training", d: "M4 10l8-4 8 4-8 4zM7 12v5c3 2 7 2 10 0v-5" },
  { href: "/essentials", label: "Collector essentials", d: "M7 4h10v16H7zM9 8h6M9 12h6M9 16h4" },
  { href: "/help", label: "Help center", d: "M12 18h.01M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.8.5-1.5 1.2-1.5 2.2V14" },
];

const selling = [
  { href: "/shop", label: "My store", d: "M4 9h16l-1 11H5zM4 9l2-5h12l2 5" },
  { href: "/account", label: "Seller dashboard", d: "M3 10h18v10H3zM6 10V7h12v3" },
  { href: "/listings", label: "My listings", d: "M7 7h10v10H7zM9 4h6v3H9z" },
  { href: "/deals", label: "Discounts & deals", d: "M6 6h5l9 9-5 5-9-9zM8.5 9.5h.01" },
  { href: "/listings?kind=auction", label: "My auctions", d: "M8 6l8 4M9 20h6M12 10v10M7 8l10 5" },
  { href: "/orders?role=seller", label: "Seller orders", d: "M8 5h8v3H8zM6 8h12v11H6zM9 12h6" },
  { href: "/chests", label: "Mystery chests", d: "M4 10h16v8H4zM4 10V8h16v2M12 8v10" },
  { href: "/sell", label: "eBay tools", d: "M4 8h16M6 8v10h12V8M9 12h6" },
  { href: "/ambassador", label: "Ambassador", d: "M12 4v16M8 8h8M7 16h10", extra: "Earn 1%" },
];

export function AccountMenu({ user }: { user: SessionUser }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const shopHref = `/shop/${user.shopSlug}`;
  const handle = user.name.replace(/\s+/g, "");
  const initial = user.name.trim().slice(0, 1).toUpperCase() || "V";

  useEffect(() => {
    function close(event: MouseEvent) {
      if (root.current && !root.current.contains(event.target as Node)) setOpen(false);
    }
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", escape);
    };
  }, []);

  function hrefFor(href: string) {
    if (href === "/shop") return shopHref;
    return href;
  }

  return (
    <div className="relative" ref={root}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex max-w-48 items-center gap-2 rounded-full border border-money/15 bg-queen-deep px-2 py-1 text-sm text-cream hover:border-gold"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-money text-xs font-medium text-white">
          {initial}
        </span>
        <span className="hidden max-w-28 truncate sm:inline">{user.name}</span>
        <span className="text-cream/45">▾</span>
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 max-h-[min(80vh,36rem)] w-80 overflow-y-auto rounded-2xl border border-money/20 bg-queen py-3 shadow-xl shadow-queen-ink/10"
        >
          <div className="flex items-center gap-3 px-4 pb-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-money text-lg font-serif text-white">
              {initial}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-queen-ink">{user.name}</p>
              <p className="truncate text-xs text-cream/50">@{handle}</p>
            </div>
            <Link href={shopHref} onClick={() => setOpen(false)} className="text-sm text-money hover:underline">
              Profile
            </Link>
          </div>
          <nav className="px-2">
            {buyer.map((item) => (
              <Link
                key={item.label}
                href={hrefFor(item.href)}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-cream hover:bg-queen-deep"
              >
                <Icon d={item.d} />
                {item.label}
              </Link>
            ))}
          </nav>
          <p className="mt-2 px-5 text-[11px] uppercase tracking-[0.18em] text-cream/40">Selling</p>
          <nav className="px-2">
            {selling.map((item) => (
              <Link
                key={item.label}
                href={hrefFor(item.href)}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-cream hover:bg-queen-deep"
              >
                <Icon d={item.d} />
                <span className="flex-1">{item.label}</span>
                {item.extra ? <span className="text-xs font-medium text-money">{item.extra}</span> : null}
              </Link>
            ))}
          </nav>
          <form action={logout} className="mt-2 border-t border-money/15 px-2 pt-2">
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-red-700 hover:bg-red-50"
            >
              <Icon d="M10 6H6v12h4M10 12h8M15 9l3 3-3 3" />
              Log out
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
