"use client";

import { getAmbassador } from "@/app/actions/ambassador";
import { SignInGate } from "@/components/AccountScreen";
import { Footer, Header } from "@/components/Chrome";
import { formatMoney } from "@/lib/catalog";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Data = Awaited<ReturnType<typeof getAmbassador>>;

function when(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function AmbassadorDesk() {
  const [data, setData] = useState<Data | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "sellers" | "listing">("all");

  useEffect(() => {
    void getAmbassador().then(setData);
  }, []);

  const people = useMemo(() => {
    const rows = data?.people ?? [];
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (filter === "sellers" && row.listings === 0) return false;
      if (filter === "listing" && row.listings === 0) return false;
      if (!q) return true;
      return row.name.toLowerCase().includes(q) || row.shopSlug.toLowerCase().includes(q);
    });
  }, [data, query, filter]);

  if (!data) {
    return (
      <div className="flex min-h-full flex-col">
        <Header />
        <main className="p-10 text-cream/50">Loading ambassador desk…</main>
        <Footer />
      </div>
    );
  }
  if (!data.user) {
    return (
      <div className="flex min-h-full flex-col">
        <Header />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
          <h1 className="font-serif text-4xl text-money">Ambassador</h1>
          <div className="mt-8">
            <SignInGate />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const { user, stats, rank } = data;
  const progress = rank.nextMin ? Math.min(100, (stats.joined / rank.nextMin) * 100) : 100;
  const share = encodeURIComponent(
    `Join me on MyVaultExchange — scan, price, and trade coins and paper money. ${user.link}`,
  );
  const blurb = `I’m collecting on MyVaultExchange. Use my link to join and we both grow the vault:\n${user.link}`;

  async function copy(label: string, text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(label);
  }

  return (
    <div className="flex min-h-full flex-col">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-8">
        <section className="overflow-hidden rounded-3xl bg-money px-6 py-8 text-white md:px-8">
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-gold px-3 py-1 font-medium text-queen-ink">{rank.name}</span>
            <span className="rounded-full bg-white/15 px-3 py-1">
              #{rank.place} of {rank.total}
            </span>
            {rank.place / rank.total <= 0.1 ? (
              <span className="rounded-full bg-gold/90 px-3 py-1 font-medium text-queen-ink">Top ambassador</span>
            ) : null}
          </div>
          <h1 className="mt-4 font-serif text-3xl md:text-4xl">
            Thank you, {user.name.split(" ")[0]}. {stats.joined}{" "}
            {stats.joined === 1 ? "person is" : "people are"} here because of you.
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-white/80">
            Earn 1% when collectors you refer list and sell on MyVaultExchange. Share your link — worldwide
            buyers still check out in USD.
          </p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <input readOnly value={user.link} className="w-full rounded-full bg-white px-4 py-2 text-sm text-queen-ink" />
            <button
              type="button"
              onClick={() => void copy("link", user.link)}
              className="rounded-full bg-gold px-5 py-2 text-sm font-medium text-queen-ink"
            >
              {copied === "link" ? "Copied" : "Copy link"}
            </button>
            <button
              type="button"
              onClick={() => {
                if (navigator.share) {
                  void navigator.share({ title: "MyVaultExchange", url: user.link, text: blurb });
                  return;
                }
                void copy("link", user.link);
              }}
              className="rounded-full bg-white px-5 py-2 text-sm font-medium text-money"
            >
              Share
            </button>
          </div>
          <p className="mt-3 text-sm text-white/80">
            Code <span className="font-medium text-gold">{user.code}</span>
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <a className="rounded-full bg-white/15 px-3 py-1.5" href={`sms:?&body=${share}`}>
              Text
            </a>
            <a
              className="rounded-full bg-white/15 px-3 py-1.5"
              href={`https://wa.me/?text=${share}`}
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp
            </a>
            <a
              className="rounded-full bg-white/15 px-3 py-1.5"
              href={`https://twitter.com/intent/tweet?text=${share}`}
              target="_blank"
              rel="noreferrer"
            >
              X
            </a>
            <a
              className="rounded-full bg-white/15 px-3 py-1.5"
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(user.link)}`}
              target="_blank"
              rel="noreferrer"
            >
              Facebook
            </a>
            <a
              className="rounded-full bg-white/15 px-3 py-1.5"
              href={`https://www.reddit.com/submit?url=${encodeURIComponent(user.link)}&title=${share}`}
              target="_blank"
              rel="noreferrer"
            >
              Reddit
            </a>
          </div>
        </section>

        <div className="grid gap-3 sm:grid-cols-5">
          <Stat label="Link clicks" value={String(stats.clicks)} />
          <Stat label="People joined" value={String(stats.joined)} />
          <Stat label="Active sellers" value={String(stats.sellers)} />
          <Stat label="Lots listed" value={String(stats.listed)} />
          <Stat label="Total earned" value={formatMoney(stats.earned)} gold />
        </div>

        <section className="rounded-3xl border border-money/20 bg-queen p-5">
          <h2 className="font-serif text-xl text-money">Your rank · {rank.name}</h2>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-queen-deep">
            <div className="h-full rounded-full bg-gold" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-2 text-sm text-cream/55">
            {rank.nextMin
              ? `${stats.joined} joined · ${rank.nextMin - stats.joined} more to ${rank.nextName}`
              : "Highest rank on the desk."}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {data.ranks.map((row) => (
              <span
                key={row.id}
                className={`rounded-full px-3 py-1 text-xs ${
                  row.current ? "bg-money text-white" : "bg-queen-deep text-cream/60"
                }`}
              >
                {row.name} · {row.min}+
              </span>
            ))}
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-3xl border border-money/20 bg-queen p-5">
            <h2 className="font-serif text-xl text-money">Live activity</h2>
            {data.activity.length === 0 ? (
              <p className="mt-4 text-sm text-cream/50">Share your link — joins show up here.</p>
            ) : (
              <ul className="mt-3 divide-y divide-money/10">
                {data.activity.map((row) => (
                  <li key={row.id} className="flex items-center justify-between py-3 text-sm">
                    <span>
                      <span className="font-medium text-queen-ink">{row.name}</span>
                      <span className="text-cream/45"> · {when(row.createdAt)}</span>
                    </span>
                    <Link href={`/messages?to=${row.shopSlug}`} className="text-gold hover:underline">
                      Message
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <div className="space-y-6">
            <section className="rounded-3xl border border-money/20 bg-queen p-5">
              <h2 className="font-serif text-xl text-money">Earnings</h2>
              <p className="mt-2 font-serif text-3xl text-gold">{formatMoney(stats.earned)}</p>
              <p className="mt-1 text-sm text-cream/55">1% of referred collectors’ checkout volume. Payouts at $15.</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-queen-deep">
                <div
                  className="h-full rounded-full bg-money"
                  style={{ width: `${Math.min(100, (stats.earned / 15) * 100)}%` }}
                />
              </div>
            </section>
            <section className="rounded-3xl border border-money/20 bg-queen p-5">
              <h2 className="font-serif text-xl text-money">Top ambassadors</h2>
              <ol className="mt-3 space-y-2 text-sm">
                {data.leaders.map((row, index) => (
                  <li key={row.id} className="flex justify-between">
                    <span>
                      {index + 1}. {row.name}
                    </span>
                    <span className="text-cream/50">{row.joined} joined</span>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        </div>

        <section className="rounded-3xl border border-money/20 bg-queen p-5">
          <h2 className="font-serif text-xl text-money">Growth</h2>
          <p className="mt-1 text-sm text-cream/50">Joins over the last eight weeks from your link.</p>
          <GrowthBars people={data.people} />
        </section>

        <section className="rounded-3xl border border-money/20 bg-queen p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-serif text-xl text-money">Your people · {stats.joined}</h2>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search"
              className="rounded-full border border-money/20 bg-queen-deep px-4 py-1.5 text-sm"
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            {(["all", "sellers", "listing"] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`rounded-full px-3 py-1 ${filter === key ? "bg-money text-white" : "bg-queen-deep"}`}
              >
                {key === "all" ? "All" : key === "sellers" ? "Sellers" : "Listing lots"}
              </button>
            ))}
          </div>
          {people.length === 0 ? (
            <p className="mt-6 text-sm text-cream/50">Nobody has joined with your code yet.</p>
          ) : (
            <ul className="mt-4 grid gap-4 md:grid-cols-2">
              {people.map((row) => (
                <li key={row.id} className="rounded-2xl border border-money/15 bg-queen-deep p-4">
                  <p className="font-medium text-queen-ink">{row.name}</p>
                  <p className="text-xs text-cream/45">
                    @{row.shopSlug} · joined {when(row.createdAt)}
                  </p>
                  <p className="mt-2 text-sm text-gold">{formatMoney(row.earned)} earned</p>
                  <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
                    <span>Listings {row.listings}</span>
                    <span>Scans {row.scans}</span>
                    <span>Sales {row.sales}</span>
                    <span>Sold {row.sold}</span>
                  </div>
                  <Link
                    href={`/messages?to=${row.shopSlug}`}
                    className="mt-3 inline-flex rounded-full bg-money px-3 py-1.5 text-sm text-white"
                  >
                    Message
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-money/20 bg-queen p-5">
            <h3 className="font-serif text-lg text-money">Ready-to-send</h3>
            <textarea readOnly rows={5} value={blurb} className="mt-3 w-full rounded-xl border border-money/15 p-3 text-sm" />
            <button
              type="button"
              onClick={() => void copy("msg", blurb)}
              className="mt-3 rounded-full bg-gold px-4 py-2 text-sm text-queen-ink"
            >
              {copied === "msg" ? "Copied" : "Copy message"}
            </button>
          </div>
          <div className="rounded-3xl border border-money/20 bg-queen p-5">
            <h3 className="font-serif text-lg text-money">Your QR code</h3>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt="Referral QR"
              className="mt-3 h-40 w-40 bg-white p-2"
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(user.link)}`}
            />
            <a
              href={`https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(user.link)}`}
              className="mt-3 inline-block text-sm text-gold hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              Download PNG
            </a>
          </div>
          <div className="rounded-3xl border border-money/20 bg-queen p-5">
            <h3 className="font-serif text-lg text-money">Share offline</h3>
            <p className="mt-2 text-sm text-cream/60">
              Print the QR or put {user.code} on a show card. New collectors land on signup with your credit.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function Stat({ label, value, gold }: { label: string; value: string; gold?: boolean }) {
  return (
    <div className="rounded-2xl border border-money/20 bg-queen p-4">
      <p className="text-[11px] uppercase tracking-[0.16em] text-cream/45">{label}</p>
      <p className={`mt-1 font-serif text-2xl ${gold ? "text-gold" : "text-money"}`}>{value}</p>
    </div>
  );
}

function GrowthBars({ people }: { people: { createdAt: string }[] }) {
  const weeks = Array.from({ length: 8 }, (_, index) => {
    const end = new Date();
    end.setDate(end.getDate() - (7 - index) * 7);
    const start = new Date(end);
    start.setDate(start.getDate() - 7);
    const count = people.filter((row) => {
      const at = new Date(row.createdAt).getTime();
      return at >= start.getTime() && at < end.getTime();
    }).length;
    return {
      label: end.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      count,
    };
  });
  const max = Math.max(1, ...weeks.map((week) => week.count));
  return (
    <div className="mt-4 flex h-40 items-end gap-2">
      {weeks.map((week) => (
        <div key={week.label} className="flex flex-1 flex-col items-center gap-1">
          <div
            className="w-full rounded-t-md bg-gold"
            style={{ height: `${Math.max(6, (week.count / max) * 100)}%` }}
          />
          <span className="text-[10px] text-cream/45">{week.label}</span>
        </div>
      ))}
    </div>
  );
}
