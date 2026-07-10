# Groundwork BHS — Contractor Marketplace

A Next.js 15 marketplace connecting homeowners with verified contractors across The Bahamas.

## Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS, Framer Motion
- **Auth**: Clerk
- **Database**: Neon (serverless PostgreSQL) + Prisma ORM
- **Payments**: Stripe (lead purchases + Builder subscriptions)
- **Email**: Resend
- **File Storage**: Vercel Blob
- **AI**: Anthropic Claude API, OpenAI GPT-4o
- **Hosting**: Vercel

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/leronwilliams/groundwork-bhs.git
cd groundwork-bhs
npm install
```

### 2. Environment Variables

Copy `.env.local.example` to `.env.local` and fill in all values:

```bash
cp .env.local.example .env.local
```

Required:
- `DATABASE_URL` — Neon PostgreSQL connection string
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY` — from Clerk dashboard
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` + `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` — from Stripe dashboard
- `ANTHROPIC_API_KEY` — for AI advisor
- `OPENAI_API_KEY` — for BOQ engine
- `RESEND_API_KEY` — for transactional email
- `BLOB_READ_WRITE_TOKEN` — Vercel Blob

### 3. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Run migrations (creates tables)
npm run db:migrate

# Seed sample data
npm run db:seed
```

### 4. Stripe Setup

1. Create products in Stripe Dashboard:
   - **Lead purchases** — one-time payments ($15-$75)
   - **Builder subscription** — $49/month recurring

2. Add price IDs to your environment

3. Configure webhook endpoint:
   - Local: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
   - Production: `https://your-domain.com/api/webhooks/stripe`

### 5. Run Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
groundwork-bhs/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── projects/      # Project CRUD + matching
│   │   ├── contractors/   # Contractor directory + leads
│   │   └── webhooks/      # Stripe webhooks
│   ├── (pages)/
│   │   ├── page.tsx       # Home
│   │   ├── post-project/  # Multi-step project form
│   │   ├── dashboard/     # Homeowner dashboard
│   │   ├── contractor-dashboard/  # Lead board
│   │   ├── contractors/   # Public directory
│   │   ├── pricing/       # Pricing page
│   │   ├── sign-in/       # Clerk sign-in
│   │   └── sign-up/       # Clerk sign-up
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Tailwind styles
├── components/            # React components
│   ├── layout/           # Header, Footer
│   └── home/             # Hero, HowItWorks, etc.
├── lib/
│   └── db.ts             # Prisma client
├── prisma/
│   ├── schema.prisma     # Database schema (15+ models)
│   └── seed.ts           # Seed data
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.ts
```

## Core Features

### For Homeowners
- **Post a Project** — Multi-step form (project details → description → contact)
- **Dashboard** — View projects, see contractor interest
- **Browse Contractors** — Filter by island, trade, tier

### For Contractors
- **Lead Board** — View matched projects, blurred until purchased
- **Lead Purchase** — One-click purchase via Stripe ($15-$75 based on budget)
- **Builder Tier** — $49/month for 3 free leads + 50% off additional

### Matching Logic
1. Homeowner posts project
2. System matches by island + contractor availability
3. Contractors get email notification
4. Contractors purchase lead to unlock full details

## Database Schema

Key models:
- **User** — homeowners & contractors (via Clerk)
- **Project** — homeowner project postings
- **Contractor** — contractor profiles with tier/status
- **Lead** — purchased leads with 30-day expiry
- **Match** — project-to-contractor matches
- **Subscription** — Stripe subscription tracking
- **Order** — payment records

Full schema: `prisma/schema.prisma`

## API Routes

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/projects` | POST | Optional | Create project, auto-match contractors |
| `/api/projects` | GET | Required | List homeowner's projects |
| `/api/projects/[id]` | GET | Required | Get project details |
| `/api/contractors/leads` | GET | Required | List contractor's leads |
| `/api/contractors/leads/[id]/purchase` | POST | Required | Purchase lead via Stripe |
| `/api/contractors/leads/[id]/status` | PATCH | Required | Update lead status |
| `/api/contractors` | GET | Public | List contractors (filterable) |
| `/api/webhooks/stripe` | POST | Stripe | Handle payments & subscriptions |

## Revenue Model

| Project Budget | Lead Price | Builder Price |
|----------------|-----------|---------------|
| Under $50k | $15 | $7.50 |
| $50k–$100k | $25 | $12.50 |
| $100k–$250k | $35 | $17.50 |
| $250k–$500k | $50 | $25 |
| $500k+ | $75 | $37.50 |

**Builder Tier**: $49/month = 3 free leads + 50% off additional + priority matching + BOQ tool

## Deployment

### Vercel

```bash
npm i -g vercel
vercel --prod
```

### Required Vercel Environment Variables

Set all variables from `.env.local` in Vercel dashboard.

### Neon Database

Use Neon serverless Postgres. Connection string format:
```
postgresql://user:password@host/dbname?sslmode=require
```

### Stripe Webhook (Production)

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-domain.com/api/webhooks/stripe`
3. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `invoice.payment_succeeded`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy signing secret to `STRIPE_WEBHOOK_SECRET`

## Next Steps / Roadmap

### Phase 1 (Current — MVP)
- [x] Project posting form
- [x] Contractor lead matching
- [x] Stripe lead purchases
- [x] Builder subscription tier
- [x] Basic dashboard

### Phase 2
- [ ] AI Advisor (`/advisor`) — Claude-powered construction advice
- [ ] BOQ Engine — Drawing upload → automated takeoff
- [ ] File uploads (Vercel Blob) — project photos, permits
- [ ] WhatsApp integration — notifications
- [ ] Email notifications (Resend)
- [ ] Reviews system
- [ ] Community board (Tiptap)

### Phase 3
- [ ] Real-time chat between homeowner & contractor
- [ ] Quote submission system
- [ ] Project timeline tracking
- [ ] Mobile app (React Native)
- [ ] Analytics dashboard (Recharts)

## License

Private — All rights reserved.
