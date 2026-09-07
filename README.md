# MyVaultExchange

Scan, identify, and **price coins and paper money** from **eBay last sold** and **Heritage Auctions**.

Heritage is the second comps source because it is the main place collectors buy and consign coins *and* paper money at auction (alongside eBay). There is no TCG pricing.

## What’s in this version

- White layout with money-green type and gold prices/accents
- Catalog, scanner, market, collection, and accounts
- Sold comps labeled as eBay last sold or Heritage Auctions, with **Search live** links on each item page
- Optional eBay keys (`EBAY_APP_ID` / `EBAY_CLIENT_ID` + `EBAY_CLIENT_SECRET`) to pull live eBay rows
- Stripe Checkout for buy-now cart items (set `STRIPE_SECRET_KEY`)
- Stripe Connect on the Sell page so sellers can receive payouts (MyVaultExchange keeps 10%)

Without Stripe keys, cart still records a demo order. Enable Connect in the Stripe Dashboard (test mode) before sellers onboard. Heritage has no public sold-price API, so those rows stay catalog samples plus a live Heritage search.

## Run it

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) locally. Production: [https://myvaultexchange.com](https://myvaultexchange.com).

Copy `.env.example` to `.env.local` to set `SESSION_SECRET` (required in production), optional `GEMINI_API_KEY` for photo identification, `STRIPE_SECRET_KEY` for Checkout (use Stripe test keys first), optional eBay keys for live listing/sold rows, and optional `GHL_API_KEY` + `GHL_LOCATION_ID` so each signup creates a Go High Level Contact.
