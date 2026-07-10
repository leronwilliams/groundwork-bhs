import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

const LEAD_PRICES: Record<string, number> = {
  "Under $50k": 15,
  "$50k–$100k": 25,
  "$100k–$250k": 35,
  "$250k–$500k": 50,
  "$500k+": 75,
  "Prefer not to say": 25,
};

export async function GET(request: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get contractor profile
    const contractor = await prisma.contractor.findFirst({
      where: { userId },
    });

    if (!contractor) {
      return NextResponse.json(
        { error: "Contractor profile not found" },
        { status: 404 }
      );
    }

    // Get matches for this contractor
    const matches = await prisma.match.findMany({
      where: {
        contractorId: contractor.id,
      },
      include: {
        project: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Get purchased leads
    const leads = await prisma.lead.findMany({
      where: {
        contractorId: contractor.id,
      },
      include: {
        project: true,
      },
    });

    return NextResponse.json({
      matches: matches.map((match) => ({
        ...match,
        purchasePrice: LEAD_PRICES[match.project.budgetRange] || 25,
        isPurchased: leads.some((l) => l.projectId === match.projectId),
      })),
      leads,
    });
  } catch (error) {
    console.error("Error fetching leads:", error);
    return NextResponse.json(
      { error: "Failed to fetch leads" },
      { status: 500 }
    );
  }
}
