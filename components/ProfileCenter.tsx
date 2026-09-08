"use client";

import type { ReactNode } from "react";
import {
  changePassword,
  deleteMyAccount,
  disconnectEbay,
  getProfile,
  saveInviteCode,
  savePublicProfile,
  saveShippingAddress,
} from "@/app/actions/profile";
import { SignInGate } from "@/components/AccountScreen";
import { Footer, Header } from "@/components/Chrome";
import { formatMoney } from "@/lib/catalog";
import Link from "next/link";
import { useEffect, useState } from "react";

const field =
  "mt-1 w-full rounded-xl border border-money/20 bg-queen px-3 py-2 text-cream outline-none focus:border-gold";

export function ProfileCenter() {
  const [data, setData] = useState<Awaited<ReturnType<typeof getProfile>> | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pw, setPw] = useState({ current: "", next: "" });

  useEffect(() => {
    void getProfile().then(setData);
  }, []);

  async function reload() {
    setData(await getProfile());
  }

  if (!data) {
    return (
      <div className="flex min-h-full flex-col">
        <Header />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 text-cream/50">Loading account…</main>
        <Footer />
      </div>
    );
  }
  if (!data.user) {
    return (
      <div className="flex min-h-full flex-col">
        <Header />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
          <h1 className="font-serif text-4xl text-money">Account center</h1>
          <div className="mt-8">
            <SignInGate />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const user = data.user;
  const initial = user.name.trim().slice(0, 1).toUpperCase() || "V";
  const member = new Date(user.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const addressOn = Boolean(user.shipLine1 && user.shipCity && user.shipPostal);

  return (
    <div className="flex min-h-full flex-col">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <section className="overflow-hidden rounded-3xl bg-money px-6 py-8 text-white md:px-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatarUrl} alt="" className="h-20 w-20 rounded-full object-cover" />
              ) : (
                <span className="flex h-20 w-20 items-center justify-center rounded-full bg-gold font-serif text-3xl text-queen-ink">
                  {initial}
                </span>
              )}
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-gold">Account center</p>
                <h1 className="mt-1 font-serif text-3xl">{user.name}</h1>
                <p className="text-sm text-white/75">Member since {member}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <a href="#shipping" className="rounded-full bg-white/10 px-4 py-2 text-sm hover:bg-white/20">
                Shipping
              </a>
              <a href="#wallet" className="rounded-full bg-white/10 px-4 py-2 text-sm hover:bg-white/20">
                Wallet
              </a>
              <a href="#password" className="rounded-full bg-gold px-4 py-2 text-sm font-medium text-queen-ink">
                Change password
              </a>
            </div>
          </div>
        </section>

        {flash ? <p className="mt-4 text-sm text-money">{flash}</p> : null}
        {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="space-y-6">
            <Card
              title="Public profile"
              blurb="This name shows on your shop and in messages."
            >
              <form
                className="space-y-3"
                onSubmit={async (event) => {
                  event.preventDefault();
                  const form = new FormData(event.currentTarget);
                  const result = await savePublicProfile({
                    name: String(form.get("name") ?? ""),
                    bio: String(form.get("bio") ?? ""),
                    avatarUrl: String(form.get("avatarUrl") ?? ""),
                  });
                  if ("error" in result && result.error) setError(result.error);
                  else {
                    setError(null);
                    setFlash("Profile saved.");
                    await reload();
                  }
                }}
              >
                <label className="block text-sm text-cream/70">
                  Photo URL (https, optional)
                  <input name="avatarUrl" defaultValue={user.avatarUrl} className={field} />
                </label>
                <label className="block text-sm text-cream/70">
                  Display name
                  <input name="name" defaultValue={user.name} className={field} />
                </label>
                <label className="block text-sm text-cream/70">
                  Username
                  <input value={user.shopSlug} disabled className={`${field} opacity-60`} />
                </label>
                <label className="block text-sm text-cream/70">
                  Bio
                  <textarea name="bio" defaultValue={user.bio} rows={4} className={field} />
                </label>
                <button type="submit" className="rounded-full bg-money px-5 py-2 text-sm font-medium text-white">
                  Save changes
                </button>
              </form>
            </Card>

            <Card
              title="eBay"
              blurb="Cross-post lots from Sell using your seller policies."
              action={
                data.ebayConnected ? (
                  <button
                    type="button"
                    className="text-sm text-red-700 hover:underline"
                    onClick={async () => {
                      await disconnectEbay();
                      setFlash("eBay disconnected.");
                      await reload();
                    }}
                  >
                    Disconnect
                  </button>
                ) : null
              }
            >
              <div className="rounded-2xl border border-money/15 bg-queen-deep px-4 py-3 text-sm">
                <p>
                  Status:{" "}
                  <span className={data.ebayConnected ? "font-medium text-money" : "text-cream/60"}>
                    {data.ebayConnected ? "Connected" : "Not connected"}
                  </span>
                </p>
                <p className="mt-1 text-cream/55">Site: {data.ebayMarketplace}</p>
              </div>
              <Link href="/sell" className="mt-3 inline-flex text-sm text-gold hover:underline">
                Open eBay tools
              </Link>
            </Card>

            <Card
              id="shipping"
              title="Shipping addresses"
              blurb="Where you receive returns or ship from. Buyers pay in USD; this is for your shop records."
            >
              {addressOn ? (
                <p className="mb-3 rounded-2xl border border-money/15 bg-queen-deep px-4 py-3 text-sm text-cream">
                  {user.shipName}
                  <br />
                  {user.shipLine1}
                  <br />
                  {user.shipCity}
                  {user.shipRegion ? `, ${user.shipRegion}` : ""} {user.shipPostal}
                  <br />
                  {user.shipCountry}
                  <span className="ml-2 rounded-full bg-money/10 px-2 py-0.5 text-xs text-money">Default</span>
                </p>
              ) : null}
              <form
                className="grid gap-3 sm:grid-cols-2"
                onSubmit={async (event) => {
                  event.preventDefault();
                  const form = new FormData(event.currentTarget);
                  const result = await saveShippingAddress({
                    shipName: String(form.get("shipName") ?? ""),
                    shipLine1: String(form.get("shipLine1") ?? ""),
                    shipCity: String(form.get("shipCity") ?? ""),
                    shipRegion: String(form.get("shipRegion") ?? ""),
                    shipPostal: String(form.get("shipPostal") ?? ""),
                    shipCountry: String(form.get("shipCountry") ?? ""),
                  });
                  if ("error" in result && result.error) setError(result.error);
                  else {
                    setError(null);
                    setFlash("Address saved.");
                    await reload();
                  }
                }}
              >
                <label className="text-sm text-cream/70 sm:col-span-2">
                  Name
                  <input name="shipName" defaultValue={user.shipName} className={field} />
                </label>
                <label className="text-sm text-cream/70 sm:col-span-2">
                  Street
                  <input name="shipLine1" defaultValue={user.shipLine1} className={field} />
                </label>
                <label className="text-sm text-cream/70">
                  City
                  <input name="shipCity" defaultValue={user.shipCity} className={field} />
                </label>
                <label className="text-sm text-cream/70">
                  Region
                  <input name="shipRegion" defaultValue={user.shipRegion} className={field} />
                </label>
                <label className="text-sm text-cream/70">
                  Postal code
                  <input name="shipPostal" defaultValue={user.shipPostal} className={field} />
                </label>
                <label className="text-sm text-cream/70">
                  Country (CA, US, …)
                  <input name="shipCountry" defaultValue={user.shipCountry} className={field} />
                </label>
                <div className="sm:col-span-2">
                  <button type="submit" className="rounded-full bg-money px-5 py-2 text-sm font-medium text-white">
                    Save address
                  </button>
                </div>
              </form>
            </Card>

            <Card
              id="wallet"
              title="Wallet & payouts"
              blurb="Buyers pay with Stripe Checkout. Sellers receive payouts through Stripe Connect minus MyVaultExchange’s 10%."
            >
              <div className="grid gap-3 sm:grid-cols-3">
                <Stat
                  label="Payouts"
                  value={data.connect.payoutsEnabled ? "Ready" : "Not ready"}
                  emphasis
                />
                <Stat label="Orders" value={String(data.orders)} />
                <Stat label="Spent" value={formatMoney(data.spent)} />
              </div>
              <div className="mt-4 flex flex-wrap gap-3 text-sm">
                <Link href="/sell" className="rounded-full bg-gold px-4 py-2 font-medium text-queen-ink">
                  Stripe Connect
                </Link>
                <Link href="/orders" className="rounded-full border border-money/25 px-4 py-2 text-cream">
                  Orders
                </Link>
              </div>
            </Card>

            <Card title="Have an invite code?" blurb="Ambassador codes credit the collector who referred you.">
              <form
                className="flex flex-wrap gap-2"
                onSubmit={async (event) => {
                  event.preventDefault();
                  const form = new FormData(event.currentTarget);
                  const result = await saveInviteCode(String(form.get("inviteCode") ?? ""));
                  if ("error" in result && result.error) setError(result.error);
                  else {
                    setFlash("Invite code saved.");
                    await reload();
                  }
                }}
              >
                <input
                  name="inviteCode"
                  defaultValue={user.inviteCode}
                  placeholder="Code"
                  className={`${field} mt-0 max-w-xs`}
                />
                <button type="submit" className="rounded-full bg-money px-5 py-2 text-sm font-medium text-white">
                  Add code
                </button>
              </form>
            </Card>

            <Card id="password" title="Change password" blurb="Use at least 8 characters with a letter and a number.">
              <form
                className="grid max-w-md gap-3"
                onSubmit={async (event) => {
                  event.preventDefault();
                  const result = await changePassword(pw);
                  if ("error" in result && result.error) setError(result.error);
                  else {
                    setError(null);
                    setFlash("Password updated.");
                    setPw({ current: "", next: "" });
                  }
                }}
              >
                <label className="text-sm text-cream/70">
                  Current password
                  <input
                    type="password"
                    value={pw.current}
                    onChange={(event) => setPw({ ...pw, current: event.target.value })}
                    className={field}
                  />
                </label>
                <label className="text-sm text-cream/70">
                  New password
                  <input
                    type="password"
                    value={pw.next}
                    onChange={(event) => setPw({ ...pw, next: event.target.value })}
                    className={field}
                  />
                </label>
                <button type="submit" className="rounded-full bg-money px-5 py-2 text-sm font-medium text-white">
                  Update password
                </button>
              </form>
            </Card>
          </div>

          <aside className="space-y-6">
            <Card title="Account snapshot" blurb="How this account looks to MyVaultExchange.">
              <dl className="space-y-2 text-sm">
                <Row label="Email" value={user.email} />
                <Row label="Shop" value={user.shopSlug} />
                <Row label="eBay" value={data.ebayConnected ? "Connected" : "Off"} />
                <Row label="Payouts" value={data.connect.payoutsEnabled ? "Ready" : "Off"} />
              </dl>
              <div className="mt-4 flex gap-3 text-sm">
                <Link href="/orders" className="text-gold hover:underline">
                  Orders
                </Link>
                <Link href="/messages" className="text-gold hover:underline">
                  Messages
                </Link>
              </div>
            </Card>
            <div className="rounded-3xl bg-money p-5 text-white">
              <p className="font-serif text-xl">Buyer ready</p>
              <p className="mt-2 text-sm text-white/80">
                Add a shipping address and connect payouts if you sell. Cards are entered at checkout, not stored
                here.
              </p>
              <div className="mt-4 flex gap-2">
                <a href="#shipping" className="rounded-full bg-gold px-3 py-1.5 text-sm text-queen-ink">
                  Addresses
                </a>
                <a href="#wallet" className="rounded-full bg-white/15 px-3 py-1.5 text-sm">
                  Wallet
                </a>
              </div>
            </div>
          </aside>
        </div>

        <form
          className="mt-10 text-center"
          action={deleteMyAccount}
          onSubmit={(event) => {
            if (!window.confirm("Permanently delete this MyVaultExchange account?")) event.preventDefault();
          }}
        >
          <button type="submit" className="text-sm text-red-700 hover:underline">
            Permanently delete my account
          </button>
        </form>
      </main>
      <Footer />
    </div>
  );
}

function Card({
  id,
  title,
  blurb,
  action,
  children,
}: {
  id?: string;
  title: string;
  blurb: string;
  action?: React.ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} className="rounded-3xl border border-money/20 bg-queen p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-serif text-xl text-money">{title}</h2>
          <p className="mt-1 text-sm text-cream/55">{blurb}</p>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Stat({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className={`rounded-2xl border px-4 py-4 ${emphasis ? "border-money bg-money/5" : "border-money/15"}`}>
      <p className="text-[11px] uppercase tracking-[0.16em] text-cream/45">{label}</p>
      <p className={`mt-1 font-serif text-2xl ${emphasis ? "text-money" : "text-queen-ink"}`}>{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-cream/45">{label}</dt>
      <dd className="truncate text-queen-ink">{value}</dd>
    </div>
  );
}
