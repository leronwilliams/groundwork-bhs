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

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    // Get contractor
    const contractor = await prisma.contractor.findFirst({
      where: { userId },
    });

    if (!contractor) {
      return NextResponse.json(
        { error: "Contractor profile not found" },
        { status: 404 }
      );
    }

    // Get match/project
    const match = await prisma.match.findFirst({
      where: {
        id,
        contractorId: contractor.id,
      },
      include: {
        project: true,
      },
    });

    if (!match) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // Check if already purchased
    const existingLead = await prisma.lead.findFirst({
      where: {
        projectId: match.projectId,
        contractorId: contractor.id,
      },
    });

    if (existingLead) {
      return NextResponse.json(
        { error: "Lead already purchased" },
        { status: 400 }
      );
    }

    const price = LEAD_PRICES[match.project.budgetRange] || 25;
    const isBuilder = contractor.tier === "BUILDER";

    // Calculate builder discount
    let finalPrice = price;
    if (isBuilder) {
      // Check free leads used this month
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const freeLeadsUsed = await prisma.lead.count({
        where: {
          contractorId: contractor.id,
          purchaseDate: {
            gte: monthStart,
          },
          purchasePrice: {
            lte: 0,
          },
        },
      });

      if (freeLeadsUsed < 3) {
        finalPrice = 0; // Free lead
      } else {
        finalPrice = price * 0.5; // 50% off
      }
    }

    // Create payment intent if price > 0
    let paymentIntent;
    if (finalPrice > 0) {
      paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(finalPrice * 100), // cents
        currency: "usd",
        customer: contractor.stripeCustomerId || undefined,
        metadata: {
          matchId: match.id,
          projectId: match.projectId,
          contractorId: contractor.id,
        },
      });
    }

    // Create lead record
    const lead = await prisma.lead.create({
      data: {
        projectId: match.projectId,
        contractorId: contractor.id,
        purchasePrice: finalPrice,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    // Update match
    await prisma.match.update({
      where: { id: match.id },
      data: { purchasedAt: new Date() },
    });

    // Create order record
    await prisma.order.create({
      data: {
        userId,
        stripePaymentId: paymentIntent?.id,
        amount: finalPrice,
        status: finalPrice > 0 ? "PENDING" : "COMPLETED",
        type: "LEAD_PURCHASE",
        description: `Lead purchase for project ${match.projectId}`,
      },
    });

    return NextResponse.json({
      success: true,
      lead,
      clientSecret: paymentIntent?.client_secret,
      price: finalPrice,
    });
  } catch (error) {
    console.error("Error purchasing lead:", error);
    return NextResponse.json(
      { error: "Failed to purchase lead" },
      { status: 500 }
    );
  }
}
