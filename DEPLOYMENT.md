# Gulel — Production Deployment Runbook

This is the ordered checklist to take Gulel live. The codebase is
production-ready (CI gates: lint, typecheck, build, e2e). What remains requires
**your** accounts and secrets — work top to bottom.

Status legend: ✅ done in code · 🔑 needs your account/secret · ☁️ deploy step

---

## 0. Prerequisites (accounts)
- 🔑 **Supabase** (free tier ok) — Postgres database + auth.
- 🔑 **Vercel** — hosts the Next.js web app + API.
- 🔑 **Cloudflare Stream** — video hosting/HLS (already integrated).
- 🔑 **Stripe** and/or **Razorpay** — web payments.
- 🔑 **RevenueCat** + **Apple Developer ($99/yr)** + **Google Play ($25)** — mobile IAP & store distribution.

---

## ⚠️ 0.5 Pending production migration (apply first)
The live database predates the `vip_subscription_and_payment_idempotency`
migration, so `Subscription.providerCustomerId` and `CoinTransaction.providerRef`
are **missing in production** — this crashes Subscription/CoinTransaction queries
for logged-in users and breaks webhook idempotency. Apply it before anything else:

- **Proper** (if the DB uses Prisma migrations):
  ```bash
  DATABASE_URL="<prod-connection-string>" npx prisma migrate deploy
  ```
- **Or** paste `prisma/hotfix-apply-pending-migration.sql` into the Supabase
  SQL Editor (idempotent, safe to re-run).

## 1. Database (Supabase)
1. Create a Supabase project. From **Project Settings → Database**, copy the
   connection string into `DATABASE_URL` (use the pooled URL; if you have a
   direct URL, set `DIRECT_URL` for migrations/seeds).
2. From **Project Settings → API**, copy `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`.
3. Push the schema and seed coin packages:
   ```bash
   npm run db:deploy        # prisma migrate deploy (or: npm run db:push)
   npm run db:seed          # coin packages
   # optional dev/staging demo catalog:
   SEED_DEMO_CONTENT=true npm run db:seed
   ```
4. **Auth providers** (Supabase → Authentication):
   - Enable **Phone** (configure Twilio/MessageBird) for OTP sign-in.
   - Enable **Google/Apple** OAuth for social login (optional but recommended;
     Apple requires "Sign in with Apple" if you offer other social logins on iOS).

## 2. Web app (Vercel)
1. Import the GitHub repo into Vercel. Framework preset: **Next.js** (root dir
   is the repo root; `mobile/` and `packages/` are ignored by the web build).
2. Add **Environment Variables** (Production + Preview) — see `.env.example` for
   the full list. Minimum to boot:
   - `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
     `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, `NEXT_PUBLIC_APP_URL` (your prod URL).
   - Payments: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
     `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (+ Razorpay keys if used).
   - Video: `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`,
     `NEXT_PUBLIC_CLOUDFLARE_CUSTOMER_SUBDOMAIN`.
   - Mobile IAP webhook: `REVENUECAT_WEBHOOK_SECRET`.
   - `CRON_SECRET` (used by the scheduled audit in `vercel.json`).
   - `CORS_ALLOWED_ORIGINS` — only if a cross-origin web client calls the API.
3. Deploy. The build runs `prisma generate && next build`.
4. **Webhooks** — point each provider at your deployed URL:
   - Stripe → `https://<domain>/api/webhooks/stripe` (use `STRIPE_WEBHOOK_SECRET`).
   - Razorpay → `https://<domain>/api/webhooks/razorpay`.
   - RevenueCat → `https://<domain>/api/webhooks/revenuecat` (Authorization =
     `REVENUECAT_WEBHOOK_SECRET`).

## 3. Payments
- **Stripe/Razorpay** (web): create products/prices; set the keys above; verify
  a test purchase credits coins (idempotent via `CoinTransaction.providerRef`).
- **RevenueCat** (mobile): create the products from `src/lib/revenuecat.ts`
  (e.g. `com.gulel.coins.500`, `com.gulel.vip.monthly`) in App Store Connect +
  Play Console, map them in RevenueCat, and set the public SDK keys in the
  mobile env (`EXPO_PUBLIC_RC_IOS_KEY` / `EXPO_PUBLIC_RC_ANDROID_KEY`).

## 4. Mobile app (EAS)
See `MOBILE.md` for detail. Summary:
```bash
cd mobile
cp .env.example .env          # set EXPO_PUBLIC_API_URL=https://<your-domain>, Supabase, RC keys
npx eas-cli@latest login
npx eas-cli@latest build --profile production --platform ios
npx eas-cli@latest build --profile production --platform android
npx eas-cli@latest submit --platform ios
npx eas-cli@latest submit --platform android
```
- `EXPO_PUBLIC_API_URL` must be the deployed web URL.
- For a quick on-device test without store review: `--profile development`.

## 5. Go-live checks
- [ ] `npm run build` green (CI enforces this on every push).
- [ ] Homepage + catalog load real series from the DB.
- [ ] Sign in (phone OTP) works on web and mobile.
- [ ] Coin purchase credits balance (web: Stripe; mobile: RevenueCat webhook).
- [ ] Locked episode → unlock spends coins → plays.
- [ ] VIP subscription gates content correctly.
- [ ] Webhooks return 200 for real events (check provider dashboards).
- [ ] Custom domain + HTTPS on Vercel; `NEXT_PUBLIC_APP_URL` matches it.

---

## CI
`.github/workflows/ci.yml` runs on every push/PR: web lint + typecheck + build,
shared typecheck, mobile typecheck, and a Playwright smoke test. Keep it green.
