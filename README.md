# Gulel OTT - Vertical Micro Drama Streaming Platform

A modern, mobile-first vertical video streaming platform built for short-form micro dramas, similar to ReelShort and DramaBox. Built with Next.js 15, TypeScript, and Tailwind CSS.

## 🎯 Overview

Gulel OTT is a freemium streaming platform optimized for 9:16 vertical micro dramas with:
- Episodes 1-3 minutes long
- 40-100 episodes per series
- Coin-based monetization
- Ad-supported free tier
- Premium subscription option

## 🛠 Tech Stack

### Frontend
- **Next.js 15** (App Router)
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **HLS.js** - Video playback

### Backend
- **PostgreSQL** - Database (via Supabase)
- **Prisma ORM** - Database access
- **Cloudflare Stream** - Video hosting & streaming

### Payments
- **Stripe** - Global payments
- **Razorpay** - India payments

### Authentication
- Phone OTP authentication
- JWT tokens
- HTTP-only cookies

## 📦 Installation

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Cloudflare Stream account
- Stripe account
- (Optional) Razorpay account for India

### Setup

1. **Clone and install dependencies:**
```bash
cd gulel-ott
npm install
```

2. **Set up environment variables:**
```bash
cp .env.example .env
```

Edit `.env` with your credentials:
- Database URL (Supabase PostgreSQL)
- Cloudflare Stream credentials
- Stripe API keys
- Razorpay API keys (optional)
- JWT secret
- Twilio/SMS provider credentials

3. **Initialize the database:**
```bash
npx prisma generate
npx prisma db push
```

4. **Seed initial data (coin packages):**
```bash
npx prisma studio
```

Create coin packages in Prisma Studio or via seed script.

5. **Run development server:**
```bash
npm run dev
```

Visit http://localhost:3000

## 🏗 Architecture

### Database Schema

#### User
- Phone-based authentication
- Coin balance
- Multilingual support (en/hi/zh)

#### Series
- Multi-language titles & descriptions
- Genre categorization
- Featured flag
- Status (DRAFT/PUBLISHED/ARCHIVED)

#### Episode
- Vertical 9:16 video
- Multi-language subtitles
- Free/paid flag
- Cloudflare Stream integration

#### Monetization
- **CoinPackage** - Purchasable coin bundles
- **CoinTransaction** - Transaction history
- **EpisodePurchase** - Episode unlocks
- **Subscription** - Premium tiers
- **WatchHistory** - Progress tracking

### Key Features

#### 🎬 Video Player
- Full-screen vertical (9:16) playback
- HLS streaming via Cloudflare
- Swipe navigation (up/down for prev/next episode)
- Subtitle support (en/hi/zh)
- Progress tracking
- Paywall integration

#### 💰 Monetization
- **Freemium Model:**
  - First 3-5 episodes free per series
  - Unlock episodes with coins
  - Watch ads to earn coins
  - Optional subscription for unlimited access

- **Coin System:**
  - Purchase coin packages
  - Earn from ads
  - Spend to unlock episodes
  - Transaction history

#### 🔐 Authentication
- Phone OTP login
- JWT tokens
- Secure HTTP-only cookies
- Welcome bonus on signup

#### 🌍 Internationalization
- English (en)
- Hindi (hi)
- Chinese (zh)
- Multi-language content support

## 📱 Pages

- `/` - Home feed with genre filtering
- `/series/[id]` - Series detail with episode list
- `/watch/[episodeId]` - Full-screen video player
- `/wallet` - Coin balance & purchase
- `/profile` - User profile & watch history
- `/admin` - Admin dashboard

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/otp/send` - Send OTP
- `POST /api/auth/otp/verify` - Verify OTP & login

### Coins
- `GET /api/coins/purchase` - Get coin packages
- `POST /api/coins/purchase` - Buy coins
- `POST /api/coins/ad-reward` - Earn coins from ad

### Episodes
- `POST /api/episodes/unlock` - Unlock episode with coins

### Series
- `GET /api/series` - List series
- `POST /api/series` - Create series
- `GET /api/series/[id]/episodes` - List episodes
- `POST /api/series/[id]/episodes` - Create episode

### Watch
- `POST /api/watch/progress` - Save watch progress
- `GET /api/watch/progress` - Get watch history

### Webhooks
- `POST /api/webhooks/stripe` - Stripe payment webhooks
- `POST /api/webhooks/razorpay` - Razorpay payment webhooks

## 🎨 Design

- **Dark theme** throughout
- **Mobile-first** responsive design
- **9:16 aspect ratio** optimization
- **Bottom navigation** for mobile UX
- **Gradient accents** for premium feel

## 🚀 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy

### Database Migration
```bash
npx prisma migrate deploy
```

### Webhook Setup

Configure webhooks in payment provider dashboards:

**Stripe:**
- URL: `https://your-domain.com/api/webhooks/stripe`
- Events: `checkout.session.completed`, `payment_intent.payment_failed`

**Razorpay:**
- URL: `https://your-domain.com/api/webhooks/razorpay`
- Events: `payment.captured`, `payment.failed`

## 📊 Admin Tasks

### Adding Content

1. **Upload video to Cloudflare Stream:**
   - Get video ID and HLS URL
   - Generate thumbnail

2. **Create series:**
   - POST to `/api/series` with metadata

3. **Add episodes:**
   - POST to `/api/series/[id]/episodes`
   - Episodes ≤ `freeEpisodes` are automatically free

### Managing Coin Packages

Use Prisma Studio or create via API:
```typescript
await prisma.coinPackage.create({
  data: {
    name: "Starter Pack",
    coins: 100,
    priceUSD: 4.99,
    priceINR: 399,
    popular: false,
    active: true,
  },
});
```

## 🔒 Security

- JWT tokens with HTTP-only cookies
- CORS protection
- Rate limiting on sensitive endpoints
- Webhook signature verification
- SQL injection protection (Prisma)

## 🧪 Testing

```bash
# Run linter
npm run lint

# Type check
npx tsc --noEmit

# Build
npm run build
```

## 📝 Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | ✅ |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID | ✅ |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token | ✅ |
| `NEXT_PUBLIC_CLOUDFLARE_CUSTOMER_SUBDOMAIN` | Stream subdomain | ✅ |
| `STRIPE_SECRET_KEY` | Stripe secret key | ✅ |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | ✅ |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe public key | ✅ |
| `RAZORPAY_KEY_ID` | Razorpay key ID | ⚠️ |
| `RAZORPAY_KEY_SECRET` | Razorpay secret | ⚠️ |
| `JWT_SECRET` | JWT signing secret (32+ chars) | ✅ |
| `TWILIO_ACCOUNT_SID` | Twilio account SID | ✅ |
| `TWILIO_AUTH_TOKEN` | Twilio auth token | ✅ |
| `TWILIO_PHONE_NUMBER` | Twilio phone number | ✅ |

⚠️ = Optional (India-specific)

## 🎯 Roadmap

- [ ] Search functionality
- [ ] User reviews & ratings
- [ ] Watchlist / favorites
- [ ] Download for offline viewing
- [ ] Social sharing
- [ ] Referral program
- [ ] Push notifications
- [ ] Analytics dashboard
- [ ] Content recommendations
- [ ] Multi-device sync

## 📄 License

Proprietary - Gulel Entertainment

## 🤝 Contributing

Internal project - contact team lead for contribution guidelines.

---

**Built with ❤️ for Gulel Entertainment**
