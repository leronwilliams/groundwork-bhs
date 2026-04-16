import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding Groundwork BHS database…')

  // ──────────────────────────────────────────────
  // GUIDES
  // ──────────────────────────────────────────────
  const guides = [
    {
      slug: 'understanding-land-titles-bahamas',
      title: 'Understanding Land Titles in the Bahamas',
      category: 'legal',
      island: 'all',
      excerpt: 'Land titles in the Bahamas can be complex. This guide explains root of title, quiet title, and the conveyancing process.',
      content: `Land title in the Bahamas operates under a different system than most people expect.\n\nROOT OF TITLE\nBahamian property law requires a clear root of title going back at least 30 years. This means you need a chain of conveyances, wills, probate records, or other legal instruments showing continuous ownership for three decades.\n\nQUIET TITLE\nMany properties — especially in the Family Islands — have clouded or undocumented title. In these cases, a Quiet Title Action must be filed in the Supreme Court to establish legal ownership. This process typically takes 12-24 months and requires a Bahamian attorney.\n\nTITLE SEARCH\nBefore purchasing any property, conduct a thorough title search at the Registrar General's Department in Nassau. The search should cover all interests, encumbrances, mortgages, and restrictions registered against the property.\n\nSTAMP DUTY\nProperty transactions attract stamp duty: 2.5% by the buyer and 2.5% by the seller on transactions above $100,000. This is in addition to attorney's fees.\n\nFOREIGN BUYERS\nNon-Bahamians purchasing property above certain thresholds may require Investment Board Authority (IBA) approval. Consult a Bahamian attorney before any purchase.\n\nALWAYS consult a licensed Bahamian attorney and a registered surveyor before completing any property transaction.`,
      imageUrl: 'https://images.pexels.com/photos/8962487/pexels-photo-8962487.jpeg?auto=compress&cs=tinysrgb&w=800',
      featured: true,
      order: 1,
    },
    {
      slug: 'how-to-finance-construction-project-bahamas',
      title: 'How to Finance a Construction Project in the Bahamas',
      category: 'finance',
      island: 'all',
      excerpt: 'From BMC mortgages to bank construction loans — a practical guide to financing your Bahamian build.',
      content: `Financing a construction project in the Bahamas differs from a standard home purchase mortgage.\n\nCONSTRUCTION LOANS\nMost Bahamian banks offer construction loans that release funds in stages as work progresses (called draw schedules). You will typically need:\n- Clear, unencumbered title to the land as collateral\n- Approved building plans and permits\n- A fixed-price contract with a licensed contractor\n- Proof of income sufficient to service the loan\n\nBAHAMAS MORTGAGE CORPORATION (BMC)\nThe BMC provides government-backed mortgages for eligible Bahamian citizens. Maximum loan amounts and terms vary. BMC rates are typically lower than commercial banks.\n\nCOMMERCIAL BANKS\nRBC, Scotiabank, Commonwealth Bank, and Fidelity Bank all offer construction financing. Expect:\n- 5-10% down payment minimum\n- Loan terms up to 30 years\n- Interest rates at prime + 1-3%\n- Full property inspection before each draw\n\nCOST ESTIMATES (Nassau, 2024)\n- Basic construction: $120-$180 per square foot\n- Quality finish: $200-$300 per square foot\n- Family Island premium: add 20-35% for materials transport and logistics\n\nNIB HOUSING LOANS\nThe National Insurance Board offers housing loans to contributing members. Check eligibility and terms directly with NIB.\n\nVENDOR FINANCING\nCommon in the Family Islands where bank financing may be harder to arrange. Get all terms in writing and have a Bahamian attorney review any vendor financing agreement.`,
      imageUrl: 'https://images.pexels.com/photos/7731337/pexels-photo-7731337.jpeg?auto=compress&cs=tinysrgb&w=800',
      featured: true,
      order: 2,
    },
    {
      slug: 'bahamas-building-code-basics',
      title: 'Bahamas Building Code Basics: What Every Owner Should Know',
      category: 'design',
      island: 'all',
      excerpt: 'The Bahamas Building Code sets standards for construction quality, hurricane resistance, and safety. Here is what matters most.',
      content: `The Bahamas Building Code (2003 and amendments) governs all construction in The Bahamas. Understanding the basics helps you work effectively with architects, engineers, and contractors.\n\nHURRICANE RESISTANCE\nAll new construction must meet Category 4/5 hurricane resistance standards. This means:\n- Reinforced concrete construction or engineered wood frame\n- Hurricane straps and clips at all roof-to-wall connections\n- Impact-resistant windows and doors, or functional shutters\n- Roof pitch, span, and fastening requirements specified in the Code\n\nFOUNDATIONS\nFoundation requirements vary by soil type and island. In Nassau:\n- Spread footings for stable ground\n- Piles or pilings for poor soil or coastal locations\n- Engineering certification required for any non-standard foundation\n\nINSPECTION STAGES\nThe Building Control Authority (BCA) requires inspections at:\n1. Foundation (before pour)\n2. Frame/structural work\n3. Rough mechanical (electrical, plumbing, HVAC)\n4. Final completion\n\nFailure to get inspections can result in stop-work orders and requirement to demolish non-compliant work.\n\nSEPTIC SYSTEMS\nWhere public sewerage is unavailable, septic systems must meet minimum sizing requirements based on bedrooms and lot size. WSC approval required.\n\nELECTRICAL\nAll electrical work must be done by a licensed electrician and inspected by BPL before connection. Bahamas follows modified UK electrical standards.`,
      imageUrl: 'https://images.pexels.com/photos/1078884/pexels-photo-1078884.jpeg?auto=compress&cs=tinysrgb&w=800',
      featured: false,
      order: 3,
    },
    {
      slug: 'getting-planning-permission-nassau',
      title: 'Step-by-Step: Getting Planning Permission in Nassau',
      category: 'permits',
      island: 'Nassau',
      excerpt: 'Planning permission is the first and most critical approval in any construction project. Here is exactly how to get it.',
      content: `Planning Permission from the Ministry of Works is the essential first step in any construction project in New Providence.\n\nSTEP 1: HIRE YOUR PROFESSIONAL TEAM\nYou will need a licensed Bahamian architect to prepare your drawings, and a registered surveyor to certify your site plan. Do not start drawings before confirming your land has clear title.\n\nSTEP 2: PREPARE YOUR DRAWINGS\nYour architect must prepare:\n- Site plan (showing property boundaries, setbacks, neighboring structures)\n- Floor plans (all levels)\n- Elevations (all four sides)\n- Roof plan\n- Sections\n- Structural drawings (for anything beyond basic residential)\n\nSTEP 3: SUBMIT YOUR APPLICATION\nSubmit to the Department of Physical Planning at the Ministry of Works. Include:\n- Completed application form\n- 4 sets of drawings\n- Site plan certified by registered surveyor\n- Proof of land ownership (title documents or deed)\n- Application fee (varies by project size)\n\nSTEP 4: AWAIT REVIEW\nTypical review time: 8-16 weeks. The department may issue:\n- Approval (with or without conditions)\n- Request for more information\n- Refusal (with grounds stated)\n\nCOMMON REASONS FOR REJECTION\n- Insufficient setbacks from property lines\n- Building height exceeds zone limits\n- Lot coverage exceeds maximum allowed\n- Inadequate parking provision\n- Environmental concerns (coastal, wetland proximity)\n\nSTEP 5: AFTER PLANNING APPROVAL\nWith planning permission in hand, you can apply for your Building Permit from the Building Control Authority (BCA). Planning permission is valid for a limited period — begin construction before it expires.`,
      imageUrl: 'https://images.pexels.com/photos/5668473/pexels-photo-5668473.jpeg?auto=compress&cs=tinysrgb&w=800',
      featured: true,
      order: 4,
    },
    {
      slug: 'how-to-vet-hire-contractor-bahamas',
      title: 'How to Vet and Hire a Contractor in the Bahamas',
      category: 'contractors',
      island: 'all',
      excerpt: 'Hiring the wrong contractor is the most common and costly mistake in Bahamian construction. Here is how to get it right.',
      content: `Finding and vetting a reliable contractor in the Bahamas requires more due diligence than in many other markets.\n\nFINDING CANDIDATES\n- Word of mouth from people who have recently completed a build\n- Ask your architect or engineer — they know who shows up and does quality work\n- Visit completed projects and speak directly with owners\n- Do not rely solely on online listings or advertising\n\nVETTING PROCESS\n1. Request references from at least 3 recent clients — and call them\n2. Visit a project they are currently working on\n3. Confirm they are licensed (if licensing is required for their trade)\n4. Ask for proof of liability insurance\n5. Review their contract terms carefully before signing\n\nCONTRACT ESSENTIALS\nA proper contractor agreement must include:\n- Detailed scope of work (what is and is not included)\n- Fixed price or clear unit rates\n- Payment schedule tied to completion milestones — NOT calendar dates\n- Start date and completion date with penalties for delay\n- Who supplies materials (contractor or owner)\n- Warranty on workmanship (minimum 1 year)\n- Dispute resolution process\n\nPAYMENT SCHEDULE RULES\n- Never pay more than 10% deposit upfront\n- Tie payments to specific, verifiable stages of completion\n- Retain at least 10% until final punch-list items are complete\n- Never pay in full until you are fully satisfied\n\nRED FLAGS\n- Requests for large upfront payments\n- No written contract offered\n- Cannot provide references\n- Significantly lowest bid (may mean corners will be cut)\n- No license or insurance`,
      imageUrl: 'https://images.pexels.com/photos/8961458/pexels-photo-8961458.jpeg?auto=compress&cs=tinysrgb&w=800',
      featured: false,
      order: 5,
    },
    {
      slug: 'real-property-tax-bahamas-rates-deadlines-appeals',
      title: 'Real Property Tax in the Bahamas: Rates, Deadlines, and Appeals',
      category: 'property-tax',
      island: 'all',
      excerpt: 'A complete guide to how Real Property Tax works in the Bahamas — rates, exemptions, deadlines, and how to appeal your assessment.',
      content: `Real Property Tax is an annual obligation for property owners in the Bahamas. Understanding how it works protects you from penalties and ensures you are not overpaying.\n\nWHO MUST PAY\nAll owners of property in the Bahamas, with the exception of:\n- Properties owned by the Government of the Bahamas\n- Properties of certain registered charities\n- Owner-occupied residential properties with assessed value below $300,000\n\nRATE SCHEDULE (Current)\nOwner-occupied residential:\n- $0 - $300,000: EXEMPT\n- $300,001 - $500,000: 0.625%\n- Above $500,000: 1.0%\n\nNon-owner-occupied residential:\n- First $500,000: 1.0%\n- Above $500,000: 1.5%\n\nCommercial property:\n- First $500,000: 1.0%\n- Above $500,000: 1.5%\n\nVacant land: 1.5% flat rate\n\nPAYMENT DEADLINE\nMarch 31 each year. A discount is available for early payment. Late payment attracts interest and eventually a lien on the property.\n\nCLEARANCE CERTIFICATE\nA Real Property Tax Clearance Certificate is required to complete any property sale. Apply at the Department of Inland Revenue.\n\nHOW TO APPEAL\nIf you believe your assessment is incorrect:\n1. File a formal objection within 30 days of receiving your assessment notice\n2. Submit to the Department of Inland Revenue\n3. Provide evidence supporting your valuation (comparable sales, professional valuation)\n4. If unsatisfied, appeal to the Property Tax Appeal Tribunal\n\nCONTACT\nDepartment of Inland Revenue: (242) 225-7280\nOnline payments: Bahamas.gov.bs`,
      imageUrl: 'https://images.pexels.com/photos/3760067/pexels-photo-3760067.jpeg?auto=compress&cs=tinysrgb&w=800',
      featured: false,
      order: 6,
    },
    {
      slug: 'construction-insurance-requirements-bahamas',
      title: 'Construction Insurance Requirements in the Bahamas',
      category: 'insurance',
      island: 'all',
      excerpt: 'What insurance coverage is required and recommended when building in the Bahamas — for owners and contractors.',
      content: `Insurance is a critical but often overlooked aspect of construction in the Bahamas. Inadequate coverage can leave you exposed to significant financial losses.\n\nCONTRACTOR'S ALL RISK (CAR) INSURANCE\nAlso called Construction All Risk, this policy covers the project itself against physical damage during construction. Your contractor should carry this, but verify it is in place before work begins.\n\nPUBLIC LIABILITY\nCovers third-party bodily injury and property damage arising from construction activities. Your contractor must carry this. Minimum recommended: $1 million per occurrence.\n\nWORKMAN'S COMPENSATION\nCovers injuries to workers on your project. Required by law for any business with employees. Your contractor must provide evidence of coverage.\n\nSTRUCTURAL WARRANTY\nSome developers and builders offer a structural warranty on completed construction, typically 10 years on structure. Not legally required but highly recommended to insist upon.\n\nHOMEOWNER'S INSURANCE\nOnce construction is complete, obtain comprehensive homeowner's insurance before occupation. In the Bahamas, this must include:\n- Hurricane coverage (wind and storm surge)\n- Fire and allied perils\n- Liability\n\nHURRICANE COVERAGE NOTE\nStandard homeowner's policies in the Bahamas include hurricane coverage, but check for sub-limits and deductibles carefully. Hurricane deductibles are often 2-5% of insured value, not a flat amount.\n\nKEY BAHAMIAN INSURERS\nColina Insurance, Insurance Management, RoyalStar, AssureCare, Bahamas First.`,
      imageUrl: 'https://images.pexels.com/photos/1546168/pexels-photo-1546168.jpeg?auto=compress&cs=tinysrgb&w=800',
      featured: false,
      order: 7,
    },
    {
      slug: 'building-family-islands-what-different',
      title: 'Building in the Family Islands: What\'s Different from Nassau',
      category: 'permits',
      island: 'Family Islands',
      excerpt: 'Permits, contractors, materials logistics, and local considerations for building outside Nassau. A comprehensive Family Island guide.',
      content: `Building in the Family Islands is a different experience from building in Nassau. Understanding these differences saves time, money, and frustration.\n\nPERMITTING DIFFERENCES\nIn most Family Islands, you must obtain approval from the Local Commissioner before applying for Planning Permission from the Ministry of Works. The Commissioner's role and process varies by island:\n- Abaco: Commissioner's Office in Marsh Harbour\n- Exuma: Commissioner's Office in George Town\n- Eleuthera: Commissioner's Offices at Governor's Harbour and Palmetto Point\n- Other islands: Check with the relevant Commissioner directly\n\nExpect permitting to take 20-30% longer than Nassau for the same project.\n\nCONTRACTOR AVAILABILITY\nMost licensed and experienced contractors are based in Nassau. For Family Island work:\n- Local contractors exist but may have limited capacity for larger projects\n- Nassau contractors will travel for significant projects — factor in accommodation, per diem, and travel costs\n- Word-of-mouth recommendations from local residents are essential\n\nMATERIALS LOGISTICS\nAll materials not locally available must be barged from Nassau. This means:\n- Lead times of 2-6 weeks for most materials\n- Barge schedules are irregular — plan carefully\n- Materials costs are 20-35% higher than Nassau prices\n- Order in bulk wherever possible to reduce barge trips\n\nUTILITIES\n- Electricity: BPL (Bahamas Power & Light) operates in many Family Islands but reliability varies. Generators are common backup.\n- Water: Municipal water supply is limited on most islands. Cisterns fed by rainwater are standard for drinking water.\n- Sewerage: Public sewerage is rare. Septic systems are the norm — design and size appropriately for your lot.\n\nSPECIFIC ISLAND NOTES\n- Abaco: Strong local building tradition. Post-Dorian reconstruction has improved local contractor capacity.\n- Exuma: Limited local contractors. Growing development demand. Excellent for beachfront builds.\n- Eleuthera: Long island means logistics vary by location. Active expat building market.\n- Andros: Most undeveloped major island. Very limited services. High barge costs to remote areas.\n\nALWAYS verify current local requirements with the island's Commissioner's office before beginning any project.`,
      imageUrl: 'https://images.pexels.com/photos/1450360/pexels-photo-1450360.jpeg?auto=compress&cs=tinysrgb&w=800',
      featured: true,
      order: 8,
    },
  ]

  for (const guide of guides) {
    await prisma.guide.upsert({
      where: { slug: guide.slug },
      update: guide,
      create: guide,
    })
    console.log(`  Guide: ${guide.title}`)
  }

  // ──────────────────────────────────────────────
  // CONTRACTORS
  // ──────────────────────────────────────────────
  const contractors = [
    {
      name: 'Nassau Build Co.',
      trade: 'contractors',
      island: 'New Providence',
      phone: '(242) 302-0100',
      email: 'info@nassaubuild.bs',
      verified: true,
      featuredTier: 'gold',
      description: 'Full-service general contractor specializing in residential and commercial construction in Nassau. 20+ years of experience.',
      imageUrl: 'https://images.pexels.com/photos/8961461/pexels-photo-8961461.jpeg?auto=compress&cs=tinysrgb&w=400',
    },
    {
      name: 'Island Masonry Works',
      trade: 'contractors',
      island: 'New Providence',
      phone: '(242) 302-0200',
      email: 'island.masonry@gmail.com',
      verified: true,
      featuredTier: 'silver',
      description: 'Specializing in reinforced concrete construction, retaining walls, and hurricane-resistant masonry.',
      imageUrl: null,
    },
    {
      name: 'Caribbean Electric Ltd.',
      trade: 'contractors',
      island: 'New Providence',
      phone: '(242) 302-0300',
      email: null,
      verified: true,
      featuredTier: null,
      description: 'Licensed electrical contractors for residential and commercial projects. BPL approved.',
      imageUrl: null,
    },
    {
      name: 'AbacoBuild',
      trade: 'contractors',
      island: 'Abaco',
      phone: '(242) 367-0100',
      email: 'info@acabobuild.bs',
      verified: true,
      featuredTier: null,
      description: 'Abaco-based general contractor with deep post-Dorian rebuild experience. Serving Marsh Harbour and surrounding areas.',
      imageUrl: null,
    },
    {
      name: 'Exuma Construction Services',
      trade: 'contractors',
      island: 'Exuma',
      phone: '(242) 336-0100',
      email: null,
      verified: false,
      featuredTier: null,
      description: 'Local Exuma contractor for residential projects. Specializes in beachfront construction and cistern installation.',
      imageUrl: null,
    },
    {
      name: 'Eleuthera Builders',
      trade: 'contractors',
      island: 'Eleuthera',
      phone: '(242) 332-0100',
      email: null,
      verified: false,
      featuredTier: null,
      description: 'Family-owned construction company serving North and Central Eleuthera. General contracting and renovation.',
      imageUrl: null,
    },
    {
      name: 'Nassau Plumbing Pro',
      trade: 'contractors',
      island: 'New Providence',
      phone: '(242) 302-0400',
      email: null,
      verified: true,
      featuredTier: null,
      description: 'Licensed plumbers for new construction and renovation. Cistern installation, WSC connections, and septic systems.',
      imageUrl: null,
    },
    {
      name: 'BHS Roofing & Waterproofing',
      trade: 'contractors',
      island: 'New Providence',
      phone: '(242) 302-0500',
      email: null,
      verified: true,
      featuredTier: null,
      description: 'Hurricane-rated roofing specialists. Metal roofing, concrete tile, and TPO membrane. Emergency tarping available.',
      imageUrl: null,
    },
  ]

  for (const contractor of contractors) {
    const existing = await prisma.contractor.findFirst({ where: { name: contractor.name } })
    if (!existing) {
      await prisma.contractor.create({ data: contractor })
      console.log(`  Contractor: ${contractor.name}`)
    }
  }

  console.log('\n✅ Seed complete.')
  console.log(`   Guides: ${guides.length}`)
  console.log(`   Contractors: ${contractors.length}`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
