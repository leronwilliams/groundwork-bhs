import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const projectSchema = z.object({
  projectType: z.string().min(1),
  island: z.string().min(1),
  area: z.string().min(1),
  propertyType: z.string().min(1),
  budgetRange: z.string().min(1),
  squareFootage: z.number().optional(),
  description: z.string().min(10),
  startTimeline: z.string().min(1),
  hasPermit: z.string().min(1),
  needFinancing: z.string().optional(),
  homeownerName: z.string().min(1),
  homeownerEmail: z.string().email(),
  homeownerPhone: z.string().min(1),
  bestContactMethod: z.string().min(1),
  photos: z.array(z.string()).optional(),
});

export async function POST(request: Request) {
  try {
    const { userId } = auth();
    const body = await request.json();
    
    const validated = projectSchema.parse(body);

    // Create project
    const project = await prisma.project.create({
      data: {
        ...(userId ? { userId } : {}),
        projectType: validated.projectType,
        island: validated.island,
        area: validated.area,
        propertyType: validated.propertyType,
        budgetRange: validated.budgetRange,
        squareFootage: validated.squareFootage,
        description: validated.description,
        startTimeline: validated.startTimeline,
        hasPermit: validated.hasPermit,
        needFinancing: validated.needFinancing,
        photos: validated.photos || [],
      },
    });

    // Find matching contractors
    const contractors = await prisma.contractor.findMany({
      where: {
        status: "ACCEPTING_LEADS",
        islandsServed: {
          has: validated.island,
        },
      },
    });

    // Create matches and send notifications
    for (const contractor of contractors) {
      await prisma.match.create({
        data: {
          projectId: project.id,
          contractorId: contractor.id,
          notificationMethod: "EMAIL",
        },
      });
    }

    // TODO: Send email notifications via Resend
    // TODO: Send WhatsApp notifications if opted in

    return NextResponse.json({ success: true, projectId: project.id });
  } catch (error) {
    console.error("Error creating project:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projects = await prisma.project.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        leads: {
          include: {
            contractor: true,
          },
        },
      },
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}
