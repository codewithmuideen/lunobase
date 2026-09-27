# Lunobase

Crypto exchange platform built with Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Supabase and Resend.

## What's inside

| Area | Highlights |
|---|---|
| **Public site** | Home, live markets (top 100), SEO page per coin (`/price/[id]`), security, fees, about, help center, legal |
| **Auth** | Sign-up with branded verification email, password + **email OTP on every login (users and admins)**, password reset, Cloudflare Turnstile "I am not a robot" |
| **User dashboard** | Portfolio overview, candlestick trading terminal, markets + watchlist, wallet, deposit (crypto address + QR, or bank), withdraw (with lock period), full history + CSV, support tickets, security center, settings, notifications |
| **Realtime** | Balances, deposits, withdrawals and notifications update live through Supabase Realtime. When an admin confirms a payment, the user's dashboard updates instantly. |
| **Admin panel** | KPIs + volume chart, users (search, freeze, suspend, promote, credit/debit, set unlock date / unlock now), deposit & withdrawal review queues, trades, support inbox, audit log, platform settings (fees, lock days, deposit addresses, bank details) |

### Withdrawal policy
Every new account gets `withdrawal_unlock_at = signup + N days` (N set in **Admin → Platform settings**, default 90).
Until then, users can deposit and trade but the Withdraw page shows the unlock date and a **Contact support** button that opens a pre-filled ticket.
Admins can move the date or tick **Override: allow withdrawals** per user. Unlocked withdrawals still need the user's password, and funds are held until an admin marks them sent.

### Security
- Email OTP (6 digits, 10-min expiry, 5 attempts, HMAC-hashed at rest), required on every login and bound to the Supabase session
- Cloudflare Turnstile + honeypot on sign-up, login and password reset
- Database-backed rate limits on login, OTP, sign-up, trading, deposits, withdrawals and tickets
- Breached-password check (Have I Been Pwned, k-anonymity)
- Anti-phishing code shown in every email
- New-device login alerts, login history, sign out of all devices, self-service account freeze
- All money movement goes through `SECURITY DEFINER` Postgres functions that only the service role can call. The browser can't change balances.
- Trade prices are fetched server-side, with a 2% slippage guard
- Row-Level Security on every table; immutable ledger; admin audit log
- Strict security headers (CSP, HSTS, X-Frame-Options, Permissions-Policy)

### SEO
Metadata + Open Graph + Twitter cards, a generated OG image, `robots.txt`, `sitemap.xml` (includes every coin page), web manifest, JSON-LD (Organization, WebSite, FinancialService, FAQPage), canonical URLs, and `noindex` on private pages.

---

## Setup

### 1. Install
```bash
npm install
```

### 2. Environment
Copy `.env.example` to `.env.local` and fill it in. You need:
- **`SUPABASE_SECRET_KEY`**: Supabase → Project Settings → API Keys → *Secret keys*. Required.
- **`AUTH_SECRET`**: any random 48+ character string.
- **Turnstile**: the test keys work locally. Create real keys at dash.cloudflare.com → Turnstile (add `lunobase.com` and `localhost`).

### 3. Database
Supabase → **SQL Editor** → paste all of `supabase/migrations/0001_lunobase_core.sql` → **Run**.

### 4. Supabase auth settings
- **Authentication → URL Configuration**: Site URL `https://lunobase.com`; add `http://localhost:3000/**` and `https://lunobase.com/**` to Redirect URLs.
- **Authentication → Providers → Email**: keep *Confirm email* **on**.
- Lunobase sends its own branded emails through Resend, so Supabase's built-in email templates aren't used.

### 5. Resend
Resend → **Domains** → add `lunobase.com` → add the DNS records it shows (SPF, DKIM, and optionally DMARC) at your domain registrar → wait for **Verified**.
Until the domain is verified, Resend only delivers to the account owner's own address. In local development, login codes are also printed to the terminal.

### 6. Run
```bash
npm run dev
```

### 7. Make yourself admin
Register and verify your email, then run this in the SQL Editor:
```sql
update public.profiles set role = 'admin' where email = 'you@example.com';
```
Sign in again and you'll land on `/admin`. Next, go to **Platform settings** and add your deposit addresses and bank details.

## Deploy (Vercel)
1. Push to GitHub and import the repo into Vercel.
2. Add every variable from `.env.local` under Project → Settings → Environment Variables, with `NEXT_PUBLIC_SITE_URL=https://lunobase.com`.
3. Add the domain `lunobase.com` in Vercel → Domains and point DNS to Vercel.

## Project structure
```
src/
  actions/        server actions (auth, trade, wallet, account, support, admin)
  app/
    (marketing)/  public site
    (auth)/       login, register, verify (OTP), password reset
    dashboard/    user app
    admin/        admin panel
    api/          cached market-data endpoints
  components/     ui, marketing, market, dashboard, trade, admin, support
  lib/            supabase clients, auth guards, market data, email, security
  proxy.ts        session refresh + route protection (password + OTP)
supabase/migrations/  schema, RLS, money-moving functions
```

## Before going live
- Replace the placeholder legal pages (`src/app/(marketing)/legal`) with lawyer-reviewed copy.
- Check the licensing requirements for operating a crypto exchange in each country you serve.
- Replace the Turnstile test keys with real ones.
- Consider a paid CoinGecko plan (`COINGECKO_API_KEY`) for production traffic.
