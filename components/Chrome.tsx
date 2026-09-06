import { AuthStatus } from "./AuthStatus";
import { CartBadge } from "./CartBadge";
import Link from "next/link";

const links = [
  { href: "/catalog", label: "Catalog" },
  { href: "/market", label: "Market" },
  { href: "/collection", label: "Collection" },
  { href: "/sell", label: "Sell" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-money/15 bg-queen/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-gold/70 bg-money/10 font-serif text-lg text-gold">
            ♕
          </span>
          <span className="font-serif text-xl tracking-wide text-money">
            Coin<span className="text-gold">Queen</span>
          </span>
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-1 text-sm">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3 py-1.5 text-cream/80 transition hover:bg-money/10 hover:text-money"
            >
              {link.label}
            </Link>
          ))}
          <CartBadge />
          <AuthStatus />
          <Link
            href="/scan"
            className="ml-2 rounded-full bg-gold px-4 py-1.5 font-medium text-queen-ink transition hover:bg-gold-bright"
          >
            Scan a piece
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-auto border-t border-money/15 bg-queen-deep">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-cream/55 sm:flex-row sm:items-center sm:justify-between">
        <p>CoinQueen — coins and paper money, priced from eBay last sold and Heritage Auctions.</p>
        <p>Checkout is still a local demo. Stripe can plug in next.</p>
      </div>
    </footer>
  );
}
