import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const filtersSchema = z.object({
  techStack: z.array(z.string()).max(12),
  seniority: z.string().optional(),
  salaryRange: z
    .object({
      min: z.number().int().nonnegative().optional(),
      max: z.number().int().nonnegative().optional(),
      currency: z.string().default("USD"),
    })
    .optional(),
  locations: z.array(z.string()).max(10).optional(),
});

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = filtersSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { techStack, seniority, salaryRange, locations } = parsed.data;

  const profile = await prisma.profile.findFirst({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
  });

  if (!profile) {
    return NextResponse.json(
      { error: "Profile not found" },
      { status: 404 },
    );
  }

  await prisma.profile.update({
    where: { id: profile.id },
    data: {
      filters: {
        techStack,
        seniority,
        salaryRange,
        locations,
      },
    },
  });

  return NextResponse.json({ ok: true });
}


