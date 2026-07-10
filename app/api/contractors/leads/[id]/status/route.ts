import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const statusSchema = z.object({
  status: z.enum(["CONTACTED", "QUOTED", "WON", "LOST", "EXPIRED"]),
});

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { status } = statusSchema.parse(body);

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

    // Update lead status
    const lead = await prisma.lead.updateMany({
      where: {
        id,
        contractorId: contractor.id,
      },
      data: {
        status,
      },
    });

    if (lead.count === 0) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error("Error updating lead status:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid status", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update lead status" },
      { status: 500 }
    );
  }
}
