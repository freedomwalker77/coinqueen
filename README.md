# CoinQueen

Scan, identify, and **price coins and paper money** from **eBay last sold** and **Heritage Auctions**.

Heritage is the second comps source because it is the main place collectors buy and consign coins *and* paper money at auction (alongside eBay). There is no TCG pricing.

## What’s in this version

- White layout with money-green type and gold prices/accents
- Catalog, scanner, market, collection, and accounts
- Sold comps labeled as eBay last sold or Heritage Auctions

Checkout is still a demo (no Stripe yet). Live eBay/Heritage APIs can replace the sample sold rows later.

## Run it

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Copy `.env.example` to `.env.local` to set `SESSION_SECRET` (required in production) and an optional `GEMINI_API_KEY` for photo identification.
