"use client";

import { saveEbayMarketplace } from "@/app/actions/ebay";
import Link from "next/link";

export function ConnectEbay({
  configured,
  connected,
  marketplace,
  sites,
  status,
  reason,
}: {
  configured: boolean;
  connected: boolean;
  marketplace: string;
  sites: Array<{ id: string; label: string }>;
  status?: string;
  reason?: string;
}) {
  const flashConnected = status === "connected";
  const message =
    connected
      ? "eBay is connected. Check Also list on eBay when you publish."
      : flashConnected
        ? "eBay signed you in, but the connection was not saved. Click Sign in with eBay again."
        : status === "denied"
          ? reason || "eBay sign-in was cancelled."
          : status === "need_runame"
            ? "Add EBAY_RUNAME in env (the RuName from eBay Developer, not the https URL), then try again."
            : status === "error"
              ? reason ||
                "eBay did not finish connecting. Log out, log in, then try again. If it still fails, enable sell.inventory and sell.account on this RuName."
              : null;

  return (
    <div className="mb-8 rounded-2xl border border-money/20 bg-queen-deep p-5">
      <h2 className="font-serif text-2xl text-money">List on eBay</h2>
      <p className="mt-2 text-sm text-cream/60">
        Publish here, then optionally push a fixed-price listing to the eBay site you sell from. Worldwide
        buyers are a Shipping policy setting on that site, not a second eBay.com listing.
      </p>
      {message ? (
        <p className={`mt-3 text-sm ${connected ? "text-money" : "text-red-700"}`}>{message}</p>
      ) : null}
      {!configured ? (
        <p className="mt-3 text-sm text-cream/50">
          Set <code>EBAY_RUNAME</code> (and your existing eBay app keys) so Sign in with eBay can issue a
          user token.
        </p>
      ) : connected ? (
        <label className="mt-4 block text-sm text-cream/70">
          Your eBay site
          <select
            defaultValue={marketplace}
            onChange={(event) => {
              void saveEbayMarketplace(event.target.value);
            }}
            className="mt-1 w-full max-w-md rounded-xl border border-money/20 bg-queen px-3 py-2 text-cream"
          >
            {sites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.label}
              </option>
            ))}
          </select>
        </label>
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
