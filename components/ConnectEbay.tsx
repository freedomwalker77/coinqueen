"use client";

import { saveEbayMarketplace } from "@/app/actions/ebay";
import { openEbayPlanPortal, startEbayPlanCheckout } from "@/app/actions/ebayPlan";
import { useState } from "react";
import Link from "next/link";

function PlanButton({
  action,
  label,
}: {
  action: () => Promise<{ error?: string } | void>;
  label: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <div>
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError(null);
          const result = await action();
          if (result?.error) {
            setError(result.error);
            setBusy(false);
          }
        }}
        className="rounded-full bg-gold px-5 py-2.5 text-sm font-medium text-queen-ink hover:bg-gold-bright disabled:opacity-60"
      >
        {busy ? "Opening Stripe…" : label}
      </button>
      {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
    </div>
  );
}

export function ConnectEbay({
  configured,
  connected,
  subscribed,
  admin = false,
  planEnabled,
  planStatus,
  planPeriodEnd,
  marketplace,
  sites,
  status,
  reason,
}: {
  configured: boolean;
  connected: boolean;
  subscribed: boolean;
  admin?: boolean;
  planEnabled: boolean;
  planStatus: string | null;
  planPeriodEnd: number | null;
  marketplace: string;
  sites: Array<{ id: string; label: string }>;
  status?: string;
  reason?: string;
}) {
  const flashConnected = status === "connected";
  const message =
    connected
      ? admin
        ? "Administrator access: you can publish here and also list on eBay without the monthly plan."
        : subscribed
        ? "eBay is connected and your monthly plan is active. Check Also list on eBay when you publish."
        : "eBay is connected. Subscribe below to unlock Also list on eBay."
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

  const renews =
    subscribed && planPeriodEnd
      ? new Date(planPeriodEnd * 1000).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : null;

  return (
    <div className="mb-8 rounded-2xl border border-money/20 bg-queen-deep p-5">
      <h2 className="font-serif text-2xl text-money">List on eBay</h2>
      <p className="mt-2 text-sm text-cream/60">
        Publish here, then optionally push a fixed-price listing to the eBay site you sell from. Worldwide
        buyers are a Shipping policy setting on that site, not a second eBay.com listing. Also list on eBay
        is <span className="font-medium text-gold">$14.97 per month</span>.
      </p>
      {message ? (
        <p className={`mt-3 text-sm ${connected && subscribed ? "text-money" : connected ? "text-cream/70" : "text-red-700"}`}>
          {message}
        </p>
      ) : null}

      <div className="mt-4 rounded-2xl border border-gold/30 bg-queen p-4">
        <p className="text-sm font-medium text-queen-ink">
          {admin ? "Also list on eBay · administrator" : "Also list on eBay · $14.97 / month"}
        </p>
        <p className="mt-1 text-sm text-cream/55">
          {admin
            ? "This account can cross-post lots to eBay at no charge. Other sellers subscribe at $14.97/month."
            : subscribed
              ? `Your plan is ${planStatus ?? "active"}${renews ? ` · renews ${renews}` : ""}.`
              : "Subscribe to cross-post lots to your connected eBay account. Cancel anytime."}
        </p>
        {admin ? null : !planEnabled ? (
          <p className="mt-3 text-sm text-cream/50">Add a Stripe key to take this subscription.</p>
        ) : subscribed ? (
          <div className="mt-3">
            <PlanButton action={openEbayPlanPortal} label="Manage billing" />
          </div>
        ) : (
          <div className="mt-3">
            <PlanButton action={startEbayPlanCheckout} label="Subscribe · $14.97 / month" />
          </div>
        )}
      </div>

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
