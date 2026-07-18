# PartSeekr

Local auto parts marketplace. Buyers browse listings or post demand. Sellers list parts. Built to take a real order by tonight.

## Run locally (no npm install)

```bash
cd C:\Users\bidbu\projects\partseekr
node server.js
```

Open http://localhost:3000

## Configure Stripe

1. Copy `.env.example` to `.env`.
2. Add your restricted Stripe key:
   ```
   STRIPE_RESTRICTED_KEY=rk_live_...
   ```
3. Required permissions:
   - Payment Links: Write
   - PaymentIntents: Write
   - Charges: Read

The server auto-creates a Stripe Payment Link at checkout.

## Auto-arbitrage importer

Add a listing from supplier cost + competitor price:

```bash
node src/arbitrage/manual_importer.js BOS-04495 32.50 52.00 New 4
```

This generates SEO title, description, tags, and markup-capped price.

## Deploy to Render

1. Push this folder to a GitHub repo.
2. In Render, click **New Web Service** and select the repo.
3. Render reads `render.yaml`; start command is `node server.js`.
4. Add environment variable `STRIPE_RESTRICTED_KEY` in Render dashboard.
5. Optional: add `SITE_URL=https://your-domain.onrender.com`.

## Deploy to Railway

1. Push to GitHub.
2. New project → Deploy from GitHub repo.
3. Add `STRIPE_RESTRICTED_KEY` and `SITE_URL` env vars.

## To get the first order

1. Run the arbitrage importer for 3–5 parts.
2. Share `/part/<id>` URLs on:
   - Facebook Marketplace / local groups
   - OfferUp
   - Craigslist
   - Nextdoor
   - Mechanic shops
3. Buyer clicks **Buy Now** and pays through Stripe.
4. Fulfill the order.

## Files

- `server.js` — zero-dep backend
- `public/` — static frontend
- `src/arbitrage/` — arbitrage importer + SEO generator
- `src/stripe_links.js` — Stripe Payment Link automation
- `loadenv.js` — zero-dep .env loader
- `render.yaml` — Render deploy config

## Still missing to go pro

- Real database (PostgreSQL/SQLite)
- Image uploads/hosting
- Email alerts for demand matches
- CAPTCHA / rate limiting
- Seller dashboard and order management
- Shipping label integration
- Stripe webhook for payment confirmation

## License

MIT
