# CoinQueen

Scan, identify, and price **coins and paper money** — the Card Price King idea for numismatics.

## What’s in the MVP

- Catalog of U.S. and world coins, ancients, and banknotes
- Item pages with grade ladders, sold comps, and a population snapshot
- Scanner: camera or upload, plus year/country/denomination hints
- Optional photo ID via Gemini (`GEMINI_API_KEY`)

Buying, shops, auctions, and Stripe are not in this first cut.

## Run it

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

To identify from a photo (not just typed hints), copy `.env.example` to `.env.local` and add a Gemini API key.
