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
          On a phone, tap Take photo to snap a picture. Add MyVaultExchange to your home screen
          (Safari Share → Add to Home Screen, or Chrome Install app) to use it like an app. The same
          Scan page is the website and the phone app.
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
