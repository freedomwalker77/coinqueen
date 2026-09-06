# CoinQueen

Scan, identify, price, and **list coins and paper money** — Card Price King for numismatics.

## What’s in this version

- Catalog of U.S. and world coins, ancients, and banknotes
- Item pages with grade ladders, sold comps, population, and live listings
- Scanner: camera or upload, plus year/country/denomination hints
- Optional photo ID via Gemini (`GEMINI_API_KEY`)
- Local marketplace: shops, buy-now, auctions, cart, collection, and sell flow

Checkout is a browser-local demo. Stripe is not connected yet.

## Run it

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

To identify from a photo (not just typed hints), copy `.env.example` to `.env.local` and add a Gemini API key.
