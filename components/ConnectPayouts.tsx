"use client";

import { openConnectDashboard, startConnectOnboarding } from "@/app/actions/connect";
import { connectCountries } from "@/lib/countries";
import type { ConnectStatus } from "@/lib/definitions";
import { PLATFORM_FEE_BPS } from "@/lib/stripeFee";
import { useMemo, useState } from "react";

export function ConnectPayouts({ initial, returned }: { initial: ConnectStatus; returned?: boolean }) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [country, setCountry] = useState(initial.country ?? "");
  const countries = useMemo(() => connectCountries(), []);
  const feePercent = PLATFORM_FEE_BPS / 100;
  const status = initial;
  const lockedCountry = Boolean(status.accountId);

  async function connect() {
    setBusy(true);
    setError(null);
    const data = new FormData();
    if (country) data.set("country", country);
    const result = await startConnectOnboarding(data);
    if (result?.error) {
      setError(result.error);
      setBusy(false);
    }
  }

  async function dashboard() {
    setBusy(true);
    setError(null);
    const result = await openConnectDashboard();
    if (result?.error) {
      setError(result.error);
      setBusy(false);
    }
  }

  if (!status.enabled) {
    return (
      <div className="mb-8 rounded-2xl border border-money/20 bg-queen-deep p-5">
        <h2 className="font-serif text-2xl text-money">Payouts</h2>
        <p className="mt-2 text-sm text-cream/60">
          Add a Stripe test key to <code>.env.local</code> to connect a bank account and get paid for your
          sales.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-8 rounded-2xl border border-money/20 bg-queen-deep p-5">
      <h2 className="font-serif text-2xl text-money">Payouts</h2>
      <p className="mt-2 text-sm text-cream/60">
        MyVaultExchange takes {feePercent}% when a buyer pays. The rest goes to your connected Stripe account in
        your country. Buyers pay in USD with cards from most countries. Stripe cannot pay out in every
        country — pick where you bank.
      </p>
      <label className="mt-4 block max-w-md text-sm text-cream/70">
        Payout country
        <select
          value={country}
          disabled={lockedCountry || busy}
          onChange={(event) => setCountry(event.target.value)}
          className="mt-1 w-full rounded-xl border border-money/20 bg-queen px-3 py-2 text-cream disabled:opacity-60"
        >
          <option value="">Select country</option>
          {countries.map((row) => (
            <option key={row.code} value={row.code}>
              {row.name}
            </option>
          ))}
        </select>
      </label>
      {status.chargesEnabled ? (
        <p className="mt-3 text-sm text-money">
          Stripe is connected
          {status.payoutsEnabled
            ? " and payouts are enabled."
            : ". Finish bank details in Stripe if payouts are still pending."}
        </p>
      ) : returned ? (
        <p className="mt-3 text-sm text-cream/70">
          Returned from Stripe. If onboarding is unfinished, continue below — test mode accepts Stripe’s
          sample details.
        </p>
      ) : (
        <p className="mt-3 text-sm text-cream/70">
          Not connected yet. Buyers can still check out; you get paid after you connect.
        </p>
      )}
      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
      <div className="mt-4 flex flex-wrap gap-2">
        {status.payoutsEnabled ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void dashboard()}
            className="rounded-full bg-gold px-5 py-2.5 font-medium text-queen-ink hover:bg-gold-bright disabled:opacity-50"
          >
            {busy ? "Opening Stripe…" : "Stripe Express dashboard"}
          </button>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() => void connect()}
            className="rounded-full bg-gold px-5 py-2.5 font-medium text-queen-ink hover:bg-gold-bright disabled:opacity-50"
          >
            {busy ? "Opening Stripe…" : status.accountId ? "Continue Stripe onboarding" : "Connect Stripe to get paid"}
          </button>
        )}
        {status.accountId ? (
          status.payoutsEnabled ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void connect()}
              className="rounded-full border border-gold/40 px-5 py-2.5 text-cream hover:bg-gold/10 disabled:opacity-50"
            >
              Update Stripe details
            </button>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={() => void dashboard()}
              className="rounded-full border border-gold/40 px-5 py-2.5 text-cream hover:bg-gold/10 disabled:opacity-50"
            >
              Stripe Express dashboard
            </button>
          )
        ) : null}
      </div>
    </div>
  );
}
