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

Copy `.env.example` to `.env.local`. Required in production: `SESSION_SECRET`. For Scan photo ID, set `OPENROUTER_API_KEY` (OpenRouter → Keys; model is `google/gemini-flash-latest`). `STRIPE_SECRET_KEY` for Checkout. eBay keys for live comps and **Also list on eBay**. Optional `GHL_API_KEY` + `GHL_LOCATION_ID` so signup creates a Go High Level Contact.

### OpenRouter (Scan)

1. Create an account at [openrouter.ai](https://openrouter.ai) and add credits.
2. Create a key at [openrouter.ai/settings/keys](https://openrouter.ai/settings/keys).
3. Put it in `.env.local` as `OPENROUTER_API_KEY=` and restart `npm run dev`.
4. Scan uses **Gemini Flash latest** (`google/gemini-flash-latest`, currently 3.8 Flash). Pin with `OPENROUTER_MODEL` if you want.

### eBay (comps + post)

This app already calls eBay **Browse** (for-sale), **Finding** (sold), and **Sell Inventory** (publish). Use **Production** keys, not Sandbox.

1. Register at [developer.ebay.com](https://developer.ebay.com).
2. Create an application → **Production** Application Keys.
3. Copy **App ID (Client ID)** into `EBAY_APP_ID` and `EBAY_CLIENT_ID` (same value). **Cert ID (Client Secret)** into `EBAY_CLIENT_SECRET`.
4. Under **User Tokens** → **Get a Token from eBay via Your Application**, create a **RuName**. Put the RuName string in `EBAY_RUNAME` (not the https callback URL).
5. In that RuName, set the auth accepted URL to `https://myvaultexchange.com/api/ebay/oauth` (and `http://localhost:3000/api/ebay/oauth` for local).
6. Enable scopes: `api_scope`, `sell.inventory`, `sell.account`.
7. On eBay as the seller: business policies (payment, return, shipping) and at least one inventory location. The app uses the first policy set it finds (`EBAY_MARKETPLACE`, default `EBAY_CA`).
8. Sign in to MyVaultExchange → **Sell** → **Sign in with eBay**. Your admin email can list without the $14.97 plan; others subscribe on that page.
9. Scan a piece, tap a similar eBay photo (public https image), check **Also list on eBay**, publish. Shop listings can use your scan photo; eBay needs the listing image URL.
