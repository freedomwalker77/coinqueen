import { Footer, Header } from "@/components/Chrome";
import { Scanner } from "@/components/Scanner";

export default function ScanPage() {
  return (
    <div className="flex min-h-full flex-col">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        <p className="text-xs uppercase tracking-[0.22em] text-money">AI scanner</p>
        <h1 className="mt-2 font-serif text-4xl text-money">Identify & price</h1>
        <p className="mt-2 max-w-2xl text-cream/70">
          Take several photos in a row. Each one drops into the queue with an eBay price underneath. Tap a
          thumbnail to swipe similar eBay listings and pick your scan photo or an eBay listing photo — no
          Imgur.
        </p>
        <div className="mt-8">
          <Scanner
            photoIdReady={Boolean(process.env.GEMINI_API_KEY)}
            ebayReady={Boolean(
              (process.env.EBAY_CLIENT_ID || process.env.EBAY_APP_ID) && process.env.EBAY_CLIENT_SECRET,
            )}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
