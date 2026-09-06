import Link from "next/link";

const links = [{ href: "/catalog", label: "Catalog" }];

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-gold/15 bg-queen/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-gold/60 bg-gold/15 font-serif text-lg text-gold">
            ♕
          </span>
          <span className="font-serif text-xl tracking-wide text-cream">
            Coin<span className="text-gold">Queen</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3 py-1.5 text-cream/75 transition hover:bg-gold/10 hover:text-gold"
            >
              {link.label}
            </Link>
          ))}
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
    <footer className="mt-auto border-t border-gold/15 bg-queen-deep">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-cream/50 sm:flex-row sm:items-center sm:justify-between">
        <p>CoinQueen — market prices for coins and paper money.</p>
        <p>Sample catalog for the MVP. Live comps can plug in later (eBay, auction houses, bullion spots).</p>
      </div>
    </footer>
  );
}
