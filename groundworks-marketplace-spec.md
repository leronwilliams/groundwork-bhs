# Groundwork BHS — Contractor Marketplace Spec
## Phase 1 Feature: Project Posting & Lead Matching System

### Overview
Build a simple homeowner-to-contractor project posting system. Homeowners submit project details → contractors get notified → contractors pay per lead to view/contact. This is the core revenue engine for the platform.

---

## 1. Homeowner Flow (Project Posting)

### Step 1: Project Intake Form
A multi-step form collecting:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Project Type | Select | Yes | New build, Renovation, Extension, Repair, Commercial, Other |
| Island | Select | Yes | New Providence, Abaco, Exuma, Eleuthera, Andros, Long Island, Bimini, Grand Bahama, Other |
| Area/Settlement | Text | Yes | Free text (e.g., "Paradise Island", "George Town", "Hope Town") |
| Property Type | Select | Yes | Residential, Commercial, Multi-family, Land only |
| Estimated Budget | Select | Yes | Under $50k, $50k–$100k, $100k–$250k, $250k–$500k, $500k+, Prefer not to say |
| Square Footage | Number | No | Approximate |
| Description | Textarea | Yes | What needs doing, timeline, any special requirements |
| Start Timeline | Select | Yes | ASAP, Within 1 month, 1–3 months, 3–6 months, Just exploring |
| Has Permit? | Select | Yes | Yes, No, Not sure, Need help with this |
| Need Financing? | Select | No | Yes, No, Already secured |
| Name | Text | Yes | |
| Email | Email | Yes | |
| Phone | Text | Yes | WhatsApp preferred |
| Best Contact Method | Select | Yes | WhatsApp, Email, Phone |
| Photo Upload | File (up to 5) | No | Site photos, existing plans, inspiration images |
| Consent | Checkbox | Yes | I agree to share my project details with verified contractors |

### Step 2: Confirmation Screen
- "Thank you! Your project has been posted."
- Estimated response time: "Verified contractors in your area will review your project within 24 hours."
- Option to create account (optional — save projects, get updates)
- Link to browse contractor directory while waiting

### Step 3: Contractor Matching (Backend)
System matches project to contractors based on:
1. **Island match** — contractor serves that island
2. **Trade match** — contractor's verified trades include project type
3. **Availability** — contractor status is "Accepting leads"
4. **Budget fit** — contractor's typical project range aligns
5. **Priority** — verified/Builder-tier contractors get first notification

Match notification sent via:
- Email (instant)
- WhatsApp/SMS (if opted in) — "New project in [Area]: [Project Type]. Budget: [Range]. View: [link]"
- In-app notification (if contractor logged in)

---

## 2. Contractor Flow (Lead Viewing & Purchase)

### Step 1: New Lead Notification
Contractor receives notification with **blurred/summary details**:
- Project type, island, budget range, timeline
- **NOT shown yet**: homeowner name, phone, email, exact location, photos, description
- CTA: "View Full Lead — $X" (price varies by project size/budget)

### Step 2: Lead Purchase
Contractor clicks to purchase. Payment via Stripe (card saved on file for Builder tier, or one-time for free tier).

**Pricing tiers per lead:**
| Project Budget | Lead Price | Why |
|----------------|-----------|-----|
| Under $50k | $15 | Small job, lower margin |
| $50k–$100k | $25 | Standard residential |
| $100k–$250k | $35 | Mid-size project |
| $250k–$500k | $50 | High-value project |
| $500k+ | $75 | Premium/commercial |
| Prefer not to say | $25 | Default |

**Builder tier ($49/mo)**: 3 free leads/month, then 50% off additional leads.

### Step 3: Full Lead Details (After Purchase)
Contractor now sees:
- Full project description
- Homeowner name, email, phone, WhatsApp
- Exact area/settlement
- Uploaded photos
- Start timeline
- Has permit status
- Need financing status
- "Contact Homeowner" button (pre-filled WhatsApp/email)
- "I'm Interested" button → sends notification to homeowner
- "Not Interested" button → provides feedback, lead goes to next contractor

### Step 4: Lead Follow-Up
Contractor status tracking:
- **New** — just purchased, not yet contacted
- **Contacted** — clicked contact button or sent message
- **Quoted** — contractor submitted quote
- **Won** — homeowner hired them
- **Lost** — homeowner chose someone else
- **Expired** — 30 days, no action

Contractor gets reminded to follow up at 24h, 7d, 14d if status is still "New".

---

## 3. Homeowner Dashboard (Optional Account)

If homeowner creates account:
- View all posted projects
- See which contractors viewed their project
- See contractor profiles (name, photo, verified badges, reviews)
- Accept/decline contractor interest
- Rate contractor after project completion (triggers review request)
- Re-post expired project

---

## 4. Contractor Profile Requirements

To be eligible to receive leads, contractors must have:

**Minimum (Free tier):**
- Business name
- Contact info (phone, email)
- Islands served (select from list)
- Trades (masonry, electrical, plumbing, general, roofing, etc.)
- Minimum 1 project photo

**Verified (Recommended):**
- All free tier info
- Business license upload (Ministry of Works or BCA)
- Insurance certificate upload
- Minimum 3 portfolio photos with descriptions
- Minimum 1 client review (from Groundwork project or verified external)
- Background check consent (optional, premium badge)

**Builder tier ($49/mo):**
- All verified info
- Priority in lead matching
- 3 free leads/month
- 50% off additional leads
- Profile featured in directory
- "Builder" badge on profile
- Access to BOQ tool
- Dedicated account support

---

## 5. Database Schema (Simplified)

```
projects
  id (UUID)
  homeowner_name
  homeowner_email
  homeowner_phone
  project_type
  island
  area
  property_type
  budget_range
  square_footage
  description
  start_timeline
  has_permit
  need_financing
  photos[] (S3 URLs)
  status: open | matched | closed | expired
  created_at
  matched_contractors[] (contractor IDs)

contractors
  id (UUID)
  business_name
  contact_name
  email
  phone
  whatsapp
  islands_served[]
  trades[]
  tier: free | verified | builder
  status: accepting_leads | paused
  license_url (S3)
  insurance_url (S3)
  portfolio[] (S3 URLs + descriptions)
  stripe_customer_id
  subscription_status
  created_at

leads
  id (UUID)
  project_id
  contractor_id
  status: purchased | contacted | quoted | won | lost | expired
  purchase_price
  purchase_date
  expires_at (purchase_date + 30 days)
  created_at

reviews
  id (UUID)
  contractor_id
  project_id (nullable)
  reviewer_name
  rating (1-5)
  text
  verified (boolean — from actual Groundwork project)
  created_at

matches
  id (UUID)
  project_id
  contractor_id
  notification_sent
  notification_method: email | sms | in_app
  opened_at
  purchased_at
  created_at
```

---

## 6. API Endpoints (Backend)

```
POST /api/projects
  → Create project, trigger matching, send notifications

GET /api/projects/:id
  → Full project details (contractor must have purchased)

GET /api/contractors/leads
  → List leads for logged-in contractor (summary view, no contact details until purchased)

POST /api/contractors/leads/:id/purchase
  → Charge contractor, unlock full details, update lead status

POST /api/contractors/leads/:id/status
  → Update lead status (contacted, quoted, won, lost)

POST /api/reviews
  → Submit review (homeowner only, after project)

GET /api/contractors
  → Public directory (filter by island, trade, tier)
```

---

## 7. UI/UX Notes

### Homeowner project form
- **Progress indicator** (Step 1/3, Step 2/3, etc.)
- **Auto-save** — if they leave and come back, data is saved
- **Mobile-first** — most Bahamian users are on mobile
- **WhatsApp integration** — primary communication channel in Bahamas
- **File upload** — max 5 photos, 5MB each, auto-compressed

### Contractor lead list
- **Card-based layout** — each lead is a card with summary
- **New leads badge** — red dot with count
- **Filter** — by island, project type, budget
- **Purchase button** — one-click with saved card (Builder tier)
- **Expiration countdown** — "Expires in 23 days" creates urgency

### Trust elements
- "Verified" badge next to contractor name
- "Homeowner verified this project" on lead details
- "No contractors spammed" guarantee — homeowners choose who contacts them
- Refund policy — if homeowner cancels within 24h of posting, contractor gets credit

---

## 8. Revenue Model (First 6 Months Projection)

| Metric | Month 1 | Month 3 | Month 6 |
|--------|---------|---------|---------|
| Projects posted | 20 | 80 | 200 |
| Match rate | 60% | 70% | 75% |
| Leads purchased | 12 | 56 | 150 |
| Avg lead price | $28 | $30 | $32 |
| Lead revenue | $336 | $1,680 | $4,800 |
| Builder subscriptions | 5 | 15 | 35 |
| Builder revenue | $245 | $735 | $1,715 |
| Verification revenue | $0 | $200 | $500 |
| **Total monthly** | **$581** | **$2,615** | **$7,015** |
| **Annual run rate** | **$7K** | **$31K** | **$84K** |

---

## 9. Tech Stack Recommendations

If you're building from scratch:
- **Frontend**: Next.js or React (you're already on something modern)
- **Backend**: Node.js/Express or Next.js API routes
- **Database**: PostgreSQL (relational data, good for complex queries)
- **Auth**: Supabase Auth or Auth0
- **Payments**: Stripe (handles subscriptions + one-time purchases)
- **File storage**: AWS S3 or Cloudflare R2
- **Notifications**: Resend (email) + Twilio (SMS/WhatsApp)
- **Hosting**: Vercel (frontend) + Railway/Render (backend)
- **AI Advisor**: Keep existing, integrate into project flow ("Ask AI about this project type before posting")

---

## 10. MVP Scope (Build This First)

Cut everything to the bone. Get this live in 2–4 weeks:

1. **Homeowner project form** (Step 1 above, simplified to 5 fields: type, island, budget, description, contact)
2. **Contractor lead list** (blurred view → purchase → full view)
3. **Stripe checkout** for lead purchases ($25 flat price to start)
4. **Email notifications** to contractors when new project matches
5. **Simple contractor profiles** (name, trade, island, photo)
6. **Manual matching** (you review and assign initially, automate later)

**Don't build yet:**
- User accounts (start with email-only, no password)
- Subscription tiers (start with one-time lead purchases)
- Mobile app
- Reviews system
- Complex matching algorithm
- WhatsApp integration
- Photo uploads (add later)

---

## Next Steps

1. **Confirm this spec** — tell me what to adjust
2. **Tech stack** — are you using existing framework or building fresh?
3. **Stripe account** — do you have one set up?
4. **Database** — what's your current setup?
5. **Contractor list** — do you have existing contractors to seed the marketplace?

Want me to write the actual code for any of these pieces? Or do you want the permit expediting service spec instead?
