import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seed() {
  console.log("🌱 Seeding database...");

  // Seed sample contractors
  const contractors = [
    {
      userId: "user_1",
      businessName: "Ron Williams Construction",
      contactName: "Ron Williams",
      email: "ron@example.com",
      phone: "+1-242-555-0101",
      whatsapp: "+1-242-555-0101",
      islandsServed: ["New Providence", "Grand Bahama"],
      trades: ["General"],
      tier: "BUILDER",
      status: "ACCEPTING_LEADS",
      stripeCustomerId: null,
    },
    {
      userId: "user_2",
      businessName: "Bahamas Electrical Co.",
      contactName: "John Smith",
      email: "john@example.com",
      phone: "+1-242-555-0102",
      islandsServed: ["Grand Bahama"],
      trades: ["Electrical"],
      tier: "VERIFIED",
      status: "ACCEPTING_LEADS",
      stripeCustomerId: null,
    },
    {
      userId: "user_3",
      businessName: "Island Masonry Ltd",
      contactName: "Marcus Johnson",
      email: "marcus@example.com",
      phone: "+1-242-555-0103",
      islandsServed: ["Abaco", "Eleuthera"],
      trades: ["Masonry"],
      tier: "VERIFIED",
      status: "ACCEPTING_LEADS",
      stripeCustomerId: null,
    },
    {
      userId: "user_4",
      businessName: "Coastal Plumbing",
      contactName: "David Miller",
      email: "david@example.com",
      phone: "+1-242-555-0104",
      islandsServed: ["New Providence", "Exuma"],
      trades: ["Plumbing"],
      tier: "FREE",
      status: "ACCEPTING_LEADS",
      stripeCustomerId: null,
    },
    {
      userId: "user_5",
      businessName: "Abaco Roofing Experts",
      contactName: "Sarah Brown",
      email: "sarah@example.com",
      phone: "+1-242-555-0105",
      islandsServed: ["Abaco", "Eleuthera"],
      trades: ["Roofing"],
      tier: "VERIFIED",
      status: "ACCEPTING_LEADS",
      stripeCustomerId: null,
    },
    {
      userId: "user_6",
      businessName: "Paradise Painting",
      contactName: "James Wilson",
      email: "james@example.com",
      phone: "+1-242-555-0106",
      islandsServed: ["New Providence"],
      trades: ["Painting"],
      tier: "FREE",
      status: "ACCEPTING_LEADS",
      stripeCustomerId: null,
    },
    {
      userId: "user_7",
      businessName: "Family Islands HVAC",
      contactName: "Robert Taylor",
      email: "robert@example.com",
      phone: "+1-242-555-0107",
      islandsServed: ["Exuma", "Long Island", "Andros"],
      trades: ["HVAC"],
      tier: "BUILDER",
      status: "ACCEPTING_LEADS",
      stripeCustomerId: null,
    },
  ];

  for (const contractor of contractors) {
    await prisma.contractor.upsert({
      where: { userId: contractor.userId },
      update: contractor,
      create: contractor,
    });
  }

  console.log(`✅ Seeded ${contractors.length} contractors`);

  // Seed sample projects (for demo purposes)
  const projects = [
    {
      projectType: "Renovation",
      island: "New Providence",
      area: "Paradise Island",
      propertyType: "Residential",
      budgetRange: "$250k–$500k",
      squareFootage: 3500,
      description: "Complete kitchen and bathroom renovation for a waterfront property. Looking for modern finishes, open concept kitchen, and updated master bath. Timeline is flexible within 3 months.",
      startTimeline: "1–3 months",
      hasPermit: "Yes",
      needFinancing: "No",
      photos: [],
      status: "OPEN",
    },
    {
      projectType: "New build",
      island: "Abaco",
      area: "Hope Town",
      propertyType: "Residential",
      budgetRange: "$500k+",
      squareFootage: 2800,
      description: "Building a vacation home near the marina. Need full construction from foundation to finish. Hurricane-resistant construction required. Ready to start ASAP.",
      startTimeline: "ASAP",
      hasPermit: "Need help with this",
      needFinancing: "Already secured",
      photos: [],
      status: "OPEN",
    },
    {
      projectType: "Repair",
      island: "Grand Bahama",
      area: "Freeport",
      propertyType: "Commercial",
      budgetRange: "$50k–$100k",
      squareFootage: 5000,
      description: "Roof repair and exterior painting for commercial office building. Some water damage from last hurricane season. Need insurance-compliant work.",
      startTimeline: "Within 1 month",
      hasPermit: "No",
      needFinancing: null,
      photos: [],
      status: "MATCHED",
    },
  ];

  for (const project of projects) {
    await prisma.project.create({ data: project as any });
  }

  console.log(`✅ Seeded ${projects.length} projects`);
  console.log("🎉 Seed complete!");
}

seed()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
