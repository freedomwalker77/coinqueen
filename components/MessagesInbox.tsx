"use client";

import { getInbox, sendInboxMessage } from "@/app/actions/messages";
import { SignInGate } from "@/components/AccountScreen";
import { Footer, Header } from "@/components/Chrome";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Inbox = Awaited<ReturnType<typeof getInbox>>;

function formatWhen(iso: string) {
  const date = new Date(iso);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function MessagesInbox() {
  const params = useSearchParams();
  const router = useRouter();
  const threadId = params.get("thread") ?? "";
  const toSlug = params.get("to") ?? "";
  const listingTitle = params.get("item") ?? "";
  const [inbox, setInbox] = useState<Inbox | null>(null);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [to, setTo] = useState(toSlug);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function refresh(id?: string) {
    const next = await getInbox(id || threadId || undefined);
    setInbox(next);
  }

  useEffect(() => {
    void refresh(threadId);
    const timer = window.setInterval(() => void refresh(threadId), 8000);
    return () => window.clearInterval(timer);
  }, [threadId]);

  useEffect(() => {
    if (toSlug) setTo(toSlug);
  }, [toSlug]);

  const rows = useMemo(() => {
    const list = inbox?.conversations ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (row) =>
        row.name.toLowerCase().includes(q) ||
        row.shopSlug.toLowerCase().includes(q) ||
        row.preview.toLowerCase().includes(q),
    );
  }, [inbox, query]);

  async function send() {
    const slug = inbox?.thread?.other.shopSlug || to.trim();
    if (!slug) {
      setError("Choose a shop to message.");
      return;
    }
    setBusy(true);
    setError(null);
    const result = await sendInboxMessage({
      toSlug: slug,
      body: draft,
      listingTitle: listingTitle || undefined,
    });
    setBusy(false);
    if ("error" in result && result.error) {
      setError(result.error);
      return;
    }
    if ("id" in result && result.id) {
      setDraft("");
      router.replace(`/messages?thread=${encodeURIComponent(result.id)}`);
      await refresh(result.id);
    }
  }

  if (inbox && !inbox.user) {
    return (
      <div className="flex min-h-full flex-col">
        <Header />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
          <h1 className="font-serif text-4xl text-money">Messages</h1>
          <div className="mt-8">
            <SignInGate />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col">
      <Header />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6 lg:py-8">
        <div className="min-h-[70vh] overflow-hidden rounded-3xl border border-money/20 bg-queen shadow-sm lg:grid lg:grid-cols-[20rem_1fr]">
          <aside className="border-b border-money/15 bg-queen-deep lg:border-b-0 lg:border-r">
            <div className="px-5 py-4">
              <h1 className="font-serif text-2xl text-money">Messages</h1>
              <label className="mt-3 block">
                <span className="sr-only">Search conversations</span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search conversations..."
                  className="w-full rounded-full border border-money/20 bg-queen px-4 py-2 text-sm text-cream outline-none focus:border-gold"
                />
              </label>
            </div>
            <ul className="max-h-[28rem] overflow-y-auto lg:max-h-[calc(70vh-8rem)]">
              {rows.length === 0 ? (
                <li className="px-5 py-6 text-sm text-cream/50">No conversations yet.</li>
              ) : (
                rows.map((row) => (
                  <li key={row.id}>
                    <Link
                      href={`/messages?thread=${encodeURIComponent(row.id)}`}
                      className={`flex gap-3 px-5 py-3 hover:bg-queen ${threadId === row.id ? "bg-queen" : ""}`}
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-money text-sm font-medium text-white">
                        {row.name.slice(0, 1).toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate font-medium text-queen-ink">{row.name}</span>
                          <span className="text-xs text-cream/45">{formatWhen(row.updatedAt)}</span>
                        </span>
                        <span className="mt-0.5 block truncate text-sm text-cream/55">{row.preview}</span>
                        {row.listingTitle ? (
                          <span className="mt-1 inline-flex rounded-full bg-money/10 px-2 py-0.5 text-[11px] text-money">
                            Listing
                          </span>
                        ) : null}
                      </span>
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </aside>
          <section className="flex min-h-[28rem] flex-col">
            {inbox?.thread ? (
              <>
                <div className="flex items-center justify-between border-b border-money/15 px-5 py-4">
                  <div>
                    <p className="font-medium text-queen-ink">{inbox.thread.other.name}</p>
                    {inbox.thread.other.shopSlug ? (
                      <Link href={`/shop/${inbox.thread.other.shopSlug}`} className="text-sm text-money hover:underline">
                        View shop
                      </Link>
                    ) : null}
                  </div>
                  {inbox.thread.listingTitle ? (
                    <span className="rounded-full bg-gold/20 px-3 py-1 text-xs text-queen-ink">
                      {inbox.thread.listingTitle}
                    </span>
                  ) : null}
                </div>
                <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
                  {inbox.thread.messages.map((message) => {
                    const mine = message.fromId === inbox.user?.id;
                    return (
                      <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                        <p
                          className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                            mine ? "bg-money text-white" : "bg-queen-deep text-cream"
                          }`}
                        >
                          {message.body}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center px-6 text-center text-cream/50">
                <p className="text-5xl text-money/30">○○</p>
                <p className="mt-3 font-medium text-queen-ink">Select a conversation or start a new one</p>
                <p className="mt-2 max-w-sm text-sm">
                  Message another collector’s shop about a lot. Sample catalog shops cannot receive mail.
                </p>
                <label className="mt-6 w-full max-w-sm text-left text-sm text-cream/70">
                  Shop slug or pick a seller
                  <input
                    value={to}
                    onChange={(event) => setTo(event.target.value)}
                    placeholder="kim-lavigne-297892"
                    className="mt-1 w-full rounded-xl border border-money/20 bg-queen px-3 py-2 text-cream"
                    list="mve-shops"
                  />
                  <datalist id="mve-shops">
                    {(inbox?.shops ?? []).map((shop) => (
                      <option key={shop.shopSlug} value={shop.shopSlug}>
                        {shop.name}
                      </option>
                    ))}
                  </datalist>
                </label>
              </div>
            )}
            <form
              className="border-t border-money/15 p-4"
              onSubmit={(event) => {
                event.preventDefault();
                void send();
              }}
            >
              {error ? <p className="mb-2 text-sm text-red-700">{error}</p> : null}
              <div className="flex gap-2">
                <input
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Write a message…"
                  className="w-full rounded-full border border-money/20 bg-queen px-4 py-2 text-sm text-cream outline-none focus:border-gold"
                />
                <button
                  type="submit"
                  disabled={busy}
                  className="rounded-full bg-gold px-5 py-2 text-sm font-medium text-queen-ink hover:bg-gold-bright disabled:opacity-60"
                >
                  Send
                </button>
              </div>
            </form>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
