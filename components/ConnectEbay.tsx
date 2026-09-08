import Link from "next/link";

export function ConnectEbay({
  configured,
  connected,
  status,
}: {
  configured: boolean;
  connected: boolean;
  status?: string;
}) {
  const message =
    status === "connected"
      ? "eBay account connected. New listings can go to eBay too."
      : status === "denied"
        ? "eBay sign-in was cancelled."
        : status === "need_runame"
          ? "Add EBAY_RUNAME in env (the RuName from eBay Developer, not the https URL), then try again."
          : status === "error"
            ? "eBay did not finish connecting. Check RuName, sell.inventory / sell.account scopes, and that this site is the accepted return URL."
            : null;

  return (
    <div className="mb-8 rounded-2xl border border-money/20 bg-queen-deep p-5">
      <h2 className="font-serif text-2xl text-money">List on eBay</h2>
      <p className="mt-2 text-sm text-cream/60">
        Same idea as CardPriceKing: publish here, and optionally push a fixed-price listing to your eBay
        seller account. You still need an eBay seller account with Payment, Return, and Shipping policies,
        plus a business location in Seller Hub.
      </p>
      {message ? (
        <p className={`mt-3 text-sm ${status === "connected" ? "text-money" : "text-red-700"}`}>{message}</p>
      ) : null}
      {!configured ? (
        <p className="mt-3 text-sm text-cream/50">
          Set <code>EBAY_RUNAME</code> (and your existing eBay app keys) so Sign in with eBay can issue a
          user token.
        </p>
      ) : connected ? (
        <p className="mt-3 text-sm text-money">Connected. Use the checkbox on the form below.</p>
      ) : (
        <Link
          href="/api/ebay/connect"
          className="mt-4 inline-flex rounded-full bg-gold px-5 py-2.5 text-sm font-medium text-queen-ink hover:bg-gold-bright"
        >
          Sign in with eBay
        </Link>
      )}
    </div>
  );
}
