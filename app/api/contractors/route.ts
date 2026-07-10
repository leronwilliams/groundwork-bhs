import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const island = searchParams.get("island");
    const trade = searchParams.get("trade");
    const search = searchParams.get("search");

    const where: any = {
      status: "ACCEPTING_LEADS",
    };

    if (island && island !== "All Islands") {
      where.islandsServed = {
        has: island,
      };
    }

    if (trade && trade !== "All Trades") {
      where.trades = {
        has: trade,
      };
    }

    if (search) {
      where.OR = [
        {
          businessName: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          trades: {
            has: search,
          },
        },
      ];
    }

    const contractors = await prisma.contractor.findMany({
      where,
      select: {
        id: true,
        businessName: true,
        contactName: true,
        islandsServed: true,
        trades: true,
        tier: true,
        portfolio: true,
      },
      orderBy: {
        tier: "asc",
      },
    });

    return NextResponse.json(contractors);
  } catch (error) {
    console.error("Error fetching contractors:", error);
    return NextResponse.json(
      { error: "Failed to fetch contractors" },
      { status: 500 }
    );
  }
}
