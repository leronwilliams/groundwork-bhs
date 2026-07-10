# Groundwork BHS — Claude Code Completion Prompt

## Mission
Complete the Groundwork BHS contractor marketplace so it is **fully functional end-to-end**: a homeowner can post a project, contractors get notified via email, they can purchase leads, and the marketplace loop works.

## Tech Stack
- **Next.js 15.1.0** + React 19 + TypeScript 5.7
- **Tailwind CSS 3.4** (utility classes like `btn-primary`, `btn-secondary`, `card`, `input-field`, `select-field` already exist in `globals.css`)
- **Prisma 6.0** + PostgreSQL (`lib/db.ts` exports `prisma` singleton)
- **Clerk** for auth (`@clerk/nextjs`, use `auth()` server-side, `useAuth()` client-side)
- **Stripe** for payments (`stripe` v17, `@stripe/stripe-js` v5, `@stripe/react-stripe-js` v3)
- **Resend** for email (`resend` v4 already in package.json)
- **Vercel Blob** for photo uploads (`@vercel/blob` v0.27 already in package.json)
- **Framer Motion** for animations
- **Lucide React** for icons

## What Already Exists (DO NOT REWRITE)

### Database Schema (`prisma/schema.prisma`)
- `User`, `Project`, `Contractor`, `Lead`, `Match`, `Review`, `Order`, `Subscription`, `AdvisorSession`, `BOQQuoteRequest`, `HardwareStore`, `Partner`, `PartnerAd`, `PexelsCache`
- All enums: `UserRole`, `ProjectStatus`, `ContractorTier`, `ContractorStatus`, `LeadStatus`, `NotificationMethod`, `SubscriptionStatus`, `OrderStatus`, `OrderType`

### API Routes
- `POST /api/projects` — creates project, auto-matches contractors by island
- `GET /api/projects` — lists homeowner's projects
- `GET /api/projects/[id]` — project detail with leads
- `GET /api/contractors` — public directory with island/trade/search filters
- `GET /api/contractors/leads` — contractor's matches + leads
- `POST /api/contractors/leads/[id]/purchase` — purchase lead with Stripe payment intent + Builder tier logic
- `PATCH /api/contractors/leads/[id]/status` — update lead status
- `POST /api/webhooks/stripe` — handles Stripe webhooks (payment_intent, invoice, subscription events)

### Pages
- `app/page.tsx` — homepage with hero, featured contractors, how it works, CTA
- `app/post-project/page.tsx` — 3-step project posting form (project details → description → contact)
- `app/dashboard/page.tsx` — homeowner project list with contractor interest
- `app/dashboard/projects/[id]/page.tsx` — project detail with contractor contact info
- `app/contractors/page.tsx` — public contractor directory (currently static demo data)
- `app/contractor-dashboard/page.tsx` — lead board with blurred/purchased states, Stripe payment
- `app/pricing/page.tsx` — subscription tiers
- `app/sign-in/[[...sign-in]]/page.tsx` — Clerk sign-in
- `app/sign-up/[[...sign-up]]/page.tsx` — Clerk sign-up
- `app/layout.tsx` — RootLayout with ClerkProvider, Header, Footer

### Components
- `components/layout/header.tsx` — site header with navigation
- `components/layout/footer.tsx` — site footer
- `components/home/hero-section.tsx` — homepage hero
- `components/home/featured-contractors.tsx` — featured contractor cards (static demo data)
- `components/home/how-it-works.tsx` — how the platform works
- `components/home/stats-section.tsx` — stats section
- `components/home/cta-section.tsx` — call-to-action section

### Existing Styles
`globals.css` defines utility classes:
- `.btn-primary` — primary button
- `.btn-secondary` — secondary button
- `.card` — card container
- `.input-field` — form input
- `.select-field` — form select

## What's Missing (BUILD THIS)

### 1. Email Notifications (HIGHEST PRIORITY)

**When a homeowner posts a project, matching contractors MUST receive an email.**

In `POST /api/projects` (file: `app/api/projects/route.ts`), after creating matches, send emails via Resend.

**What to do:**
- At the top of `app/api/projects/route.ts`, import Resend: `import { Resend } from "resend"; const resend = new Resend(process.env.RESEND_API_KEY);`
- After the `for (const contractor of contractors)` loop that creates matches, send an email to each contractor:
  - **To:** `contractor.email`
  - **From:** `"Groundwork BHS" <notifications@groundworkbhs.com>`
  - **Subject:** `New Project Match: [Project Type] in [Island]`
  - **HTML body:** A clean email template with:
    - "A new project matching your services has been posted on Groundwork BHS"
    - Project type, island, area, budget range, timeline
    - A CTA button: "View Lead →" linking to `https://groundworkbhs.com/contractor-dashboard`
    - Note: "This lead costs $[price] to unlock. Builder tier members get 3 free leads/month."
- Wrap each email send in `try/catch` so one failed email doesn't break the whole loop. Log errors with `console.error`.

### 2. Photo Upload for Projects

**Homeowners should be able to upload photos when posting a project.**

**What to do:**
- In `app/post-project/page.tsx`, add a photo upload step (can be a simple component within Step 3 or a separate sub-step):
  - Use `@vercel/blob` client-side upload: `import { put } from "@vercel/blob";` — actually use the upload pattern from Vercel Blob docs: create a client-side file input, when files are selected, upload to a temporary API route `POST /api/upload`, get back URLs, store them in form state.
- Create `app/api/upload/route.ts`:
  - `POST` handler that accepts multipart form data
  - Uses `put()` from `@vercel/blob` to upload to Vercel Blob
  - Returns `{ url: string }` for each file
  - Accept up to 5 files, max 5MB each
- In `app/post-project/page.tsx`, add a file input:
  - `<input type="file" accept="image/*" multiple max={5} />`
  - On change, upload files via `fetch('/api/upload', { method: 'POST', body: formData })`
  - Store returned URLs in `formData.photos`
  - Show thumbnail previews of uploaded photos
- Pass `photos` array through to the `POST /api/projects` API (already accepts it in the schema)

### 3. Contractor Signup Flow (CRITICAL — marketplace is empty without this)

**Contractors need a way to create their profile.**

**What to do:**

#### A. Create `app/become-a-contractor/page.tsx`
- Multi-step form (3 steps):
  - **Step 1: Business Info**
    - Business name (text, required)
    - Contact name (text, required)
    - Email (email, required) — pre-fill from Clerk user if available
    - Phone (text, required)
    - WhatsApp (text, optional)
    - Islands served (multi-select checkboxes: New Providence, Abaco, Exuma, Eleuthera, Andros, Long Island, Bimini, Grand Bahama, Other)
    - Trades (multi-select checkboxes: General, Electrical, Plumbing, Masonry, Roofing, Carpentry, Painting, HVAC)
  - **Step 2: Verification**
    - Tier selection: Free / Verified / Builder
    - License upload (file input, optional for Free, required for Verified/Builder) — upload to Vercel Blob via `/api/upload`
    - Insurance upload (file input, optional for Free, required for Verified/Builder) — upload to Vercel Blob
    - Portfolio photos (file input, up to 5, optional) — upload to Vercel Blob
    - Portfolio descriptions (textarea for each photo, optional)
  - **Step 3: Review & Submit**
    - Summary of all info entered
    - If Builder tier selected, show Stripe checkout button (create subscription)
    - Submit button
- On submit, `POST` to `app/api/contractors/signup/route.ts`

#### B. Create `app/api/contractors/signup/route.ts`
```typescript
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const signupSchema = z.object({
  businessName: z.string().min(1),
  contactName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  whatsapp: z.string().optional(),
  islandsServed: z.array(z.string()),
  trades: z.array(z.string()),
  tier: z.enum(["FREE", "VERIFIED", "BUILDER"]),
  licenseUrl: z.string().optional(),
  insuranceUrl: z.string().optional(),
  portfolio: z.array(z.object({ url: z.string(), description: z.string() })).optional(),
});

export async function POST(request: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = signupSchema.parse(body);

    // Check if contractor already exists
    const existing = await prisma.contractor.findFirst({
      where: { userId },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Contractor profile already exists" },
        { status: 400 }
      );
    }

    const contractor = await prisma.contractor.create({
      data: {
        userId,
        businessName: validated.businessName,
        contactName: validated.contactName,
        email: validated.email,
        phone: validated.phone,
        whatsapp: validated.whatsapp,
        islandsServed: validated.islandsServed,
        trades: validated.trades,
        tier: validated.tier,
        licenseUrl: validated.licenseUrl,
        insuranceUrl: validated.insuranceUrl,
        portfolio: validated.portfolio,
        status: "ACCEPTING_LEADS",
      },
    });

    return NextResponse.json({ success: true, contractorId: contractor.id });
  } catch (error) {
    console.error("Error creating contractor:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create contractor profile" },
      { status: 500 }
    );
  }
}
```

#### C. Update `app/pricing/page.tsx` CTA links
- Change tier CTA `href` from `/sign-up` to `/become-a-contractor?tier=FREE` etc. (pass tier as query param)
- In `become-a-contractor/page.tsx`, read `tier` from URL params and pre-select it

#### D. Update `app/contractor-dashboard/page.tsx`
- If contractor profile doesn't exist (404 from `/api/contractors/leads`), show a CTA: "Complete your contractor profile to start receiving leads" with a link to `/become-a-contractor`

### 4. Wire Contractor Directory to Real Database

**`app/contractors/page.tsx` currently shows static demo data. Wire it to real API.**

**What to do:**
- In `app/contractors/page.tsx`, replace the static `contractors` array with a `useEffect` + `fetch('/api/contractors')` call
- The API already exists and works: `GET /api/contractors` returns real contractors from the database with filtering by `island` and `trade` query params
- Keep the existing UI structure, just load data dynamically
- Add loading state with `Loader2` spinner
- Handle empty state: "No contractors found yet. Be the first!" with a link to `/become-a-contractor`

### 5. Contractor Public Profile Pages

**Create individual contractor profile pages.**

**What to do:**

#### A. Create `app/api/contractors/[id]/route.ts`
```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const contractor = await prisma.contractor.findUnique({
      where: { id },
      include: {
        reviews: {
          include: { user: { select: { firstName: true, lastName: true } } },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!contractor) {
      return NextResponse.json(
        { error: "Contractor not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(contractor);
  } catch (error) {
    console.error("Error fetching contractor:", error);
    return NextResponse.json(
      { error: "Failed to fetch contractor" },
      { status: 500 }
    );
  }
}
```

#### B. Create `app/contractors/[id]/page.tsx`
- Public profile page showing:
  - Business name, contact name
  - Tier badge (Free / Verified / Builder)
  - Islands served, trades
  - Portfolio photos with descriptions (if any)
  - Reviews list (if any)
  - "Contact" button — if logged in as homeowner, show contact details; otherwise prompt to sign in
  - Link to "View Leads" if logged in as this contractor
- Use `useParams` to get `id`, fetch from `/api/contractors/[id]`
- Handle loading and not-found states

### 6. Stripe Subscription Checkout for Builder Tier

**When a contractor selects Builder tier, they need to pay $49/month via Stripe.**

**What to do:**

#### A. Create `app/api/stripe/create-subscription/route.ts`
```typescript
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

export async function POST(request: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { priceId } = body; // e.g., "price_1Q..." for Builder tier

    // Get or create Stripe customer
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    let customerId = user?.email; // You'll need to store stripeCustomerId on User model — see note below

    // Actually, create a Stripe customer if not exists
    const contractor = await prisma.contractor.findFirst({
      where: { userId },
    });

    let stripeCustomerId = contractor?.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: contractor?.email || user?.email,
        name: contractor?.businessName,
        metadata: { userId },
      });
      stripeCustomerId = customer.id;

      await prisma.contractor.update({
        where: { id: contractor!.id },
        data: { stripeCustomerId },
      });
    }

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [{ price: priceId }],
      payment_behavior: "default_incomplete",
      expand: ["latest_invoice.payment_intent"],
    });

    const latestInvoice = subscription.latest_invoice as Stripe.Invoice;
    const paymentIntent = latestInvoice.payment_intent as Stripe.PaymentIntent;

    return NextResponse.json({
      subscriptionId: subscription.id,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error("Error creating subscription:", error);
    return NextResponse.json(
      { error: "Failed to create subscription" },
      { status: 500 }
    );
  }
}
```

**IMPORTANT:** The `User` model does NOT have a `stripeCustomerId` field. The `Contractor` model already has `stripeCustomerId`. Use that. The `User` lookup above is for email — you can get the email from the contractor record if they filled it in, or from `auth()` via Clerk if needed. Actually, just use the contractor's email from the signup form.

#### B. In `app/become-a-contractor/page.tsx`, if Builder tier is selected:
- After creating the contractor profile (POST to `/api/contractors/signup`), call `POST /api/stripe/create-subscription` with the Builder price ID
- Use Stripe Elements to collect payment details
- On success, redirect to `/contractor-dashboard`

**For testing, use a hardcoded Stripe test price ID** like `price_test_builder` or instruct the user to set `NEXT_PUBLIC_STRIPE_BUILDER_PRICE_ID` in `.env.local`. The actual Stripe price ID can be configured later.

### 7. Seed Data

**Create `prisma/seed.ts` so the marketplace has demo contractors for testing.**

The file already exists but may be empty. Populate it:

```typescript
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Seed demo contractors
  const demoContractors = [
    {
      businessName: "Ron Williams Construction",
      contactName: "Ron Williams",
      email: "ron@example.com",
      phone: "(242) 555-0100",
      whatsapp: "(242) 555-0100",
      islandsServed: ["New Providence", "Grand Bahama"],
      trades: ["General"],
      tier: "BUILDER" as const,
      status: "ACCEPTING_LEADS" as const,
      portfolio: [
        { url: "/placeholder.jpg", description: "Luxury villa renovation, Paradise Island" },
      ],
    },
    {
      businessName: "Bahamas Electrical Co.",
      contactName: "John Smith",
      email: "john@example.com",
      phone: "(242) 555-0200",
      islandsServed: ["Grand Bahama"],
      trades: ["Electrical"],
      tier: "VERIFIED" as const,
      status: "ACCEPTING_LEADS" as const,
    },
    {
      businessName: "Island Masonry Ltd",
      contactName: "Marcus Johnson",
      email: "marcus@example.com",
      phone: "(242) 555-0300",
      islandsServed: ["Abaco"],
      trades: ["Masonry"],
      tier: "VERIFIED" as const,
      status: "ACCEPTING_LEADS" as const,
    },
    {
      businessName: "Coastal Plumbing",
      contactName: "David Miller",
      email: "david@example.com",
      phone: "(242) 555-0400",
      islandsServed: ["New Providence", "Exuma"],
      trades: ["Plumbing"],
      tier: "FREE" as const,
      status: "ACCEPTING_LEADS" as const,
    },
    {
      businessName: "Abaco Roofing Experts",
      contactName: "Sarah Brown",
      email: "sarah@example.com",
      phone: "(242) 555-0500",
      islandsServed: ["Abaco", "Eleuthera"],
      trades: ["Roofing"],
      tier: "VERIFIED" as const,
      status: "ACCEPTING_LEADS" as const,
    },
  ];

  for (const contractor of demoContractors) {
    await prisma.contractor.create({
      data: contractor,
    });
  }

  console.log(`Seeded ${demoContractors.length} contractors`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### 8. Update Header Navigation

In `components/layout/header.tsx`:
- Add a link to "Become a Contractor" (`/become-a-contractor`) in the nav
- If user is signed in and has a contractor profile, show "Contractor Dashboard" link
- If user is signed in and has posted projects, show "My Projects" link

### 9. Environment Variables Check

Make sure `.env.local` exists with these variables (already in `.env.local.example`):
- `DATABASE_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY`
- `BLOB_READ_WRITE_TOKEN`

## File List to Create / Modify

### New Files
1. `app/become-a-contractor/page.tsx` — contractor signup flow
2. `app/api/contractors/signup/route.ts` — contractor signup API
3. `app/api/contractors/[id]/route.ts` — public contractor profile API
4. `app/contractors/[id]/page.tsx` — public contractor profile page
5. `app/api/stripe/create-subscription/route.ts` — Builder tier checkout
6. `app/api/upload/route.ts` — file upload to Vercel Blob

### Modify Files
1. `app/api/projects/route.ts` — add Resend email notifications after match creation
2. `app/post-project/page.tsx` — add photo upload step
3. `app/contractors/page.tsx` — wire to real API instead of static data
4. `app/contractor-dashboard/page.tsx` — add "create profile" CTA if no profile
5. `app/pricing/page.tsx` — update CTA links to `/become-a-contractor`
6. `components/layout/header.tsx` — add contractor nav links
7. `prisma/seed.ts` — populate demo contractors

## Build Order (Do in this order)

1. **Email notifications** — one file change, highest impact
2. **Photo upload** — `app/api/upload/route.ts` + `app/post-project/page.tsx` changes
3. **Contractor signup** — `app/api/contractors/signup/route.ts` + `app/become-a-contractor/page.tsx`
4. **Wire directory** — `app/contractors/page.tsx` to real API
5. **Public profiles** — `app/api/contractors/[id]/route.ts` + `app/contractors/[id]/page.tsx`
6. **Stripe checkout** — `app/api/stripe/create-subscription/route.ts` + integrate into signup flow
7. **Seed data** — `prisma/seed.ts`
8. **Navigation** — `components/layout/header.tsx`

## Important Notes

- **NEVER** hardcode real API keys in code. Use `process.env.*` always.
- **NEVER** modify the Prisma schema unless absolutely necessary — the existing schema supports everything needed.
- **ALWAYS** use `try/catch` around external API calls (Resend, Stripe, Vercel Blob) so failures don't crash the request.
- **ALWAYS** validate input with Zod before writing to database.
- Use the existing utility classes (`btn-primary`, `card`, `input-field`, etc.) for consistent styling.
- Use Framer Motion for page transitions where appropriate (already used throughout).
- Use Lucide icons (already imported throughout).

## After Building

1. Run `npx prisma db seed` to populate demo contractors
2. Run `npm run dev` to test locally
3. Test the full flow: homeowner posts project → contractors get email → contractor signs up → contractor purchases lead → contractor sees full project details

## Ready to Start

Build all the above. Work through the build order. Make each piece functional before moving to the next. Ask if you hit any blockers.
