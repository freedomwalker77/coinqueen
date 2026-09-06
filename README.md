# CoinQueen

Scan, identify, price, and **list coins and paper money** — Card Price King for numismatics.

## What’s in this version

- Catalog of U.S. and world coins, ancients, and banknotes
- Item pages with grade ladders, sold comps, population, and live listings
- Scanner: camera or upload, plus year/country/denomination hints
- Optional photo ID via Gemini (`GEMINI_API_KEY`)
- Marketplace: shops, buy-now, auctions, cart, collection, and sell flow
- Accounts: email/password sign-up, session cookie, cabinet and listings saved per user

Checkout is still a demo (no Stripe yet).

## Run it

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Copy `.env.example` to `.env.local` to set `SESSION_SECRET` (required in production) and an optional `GEMINI_API_KEY` for photo identification.
