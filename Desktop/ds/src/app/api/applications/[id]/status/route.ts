import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const statusSchema = z.object({
  status: z.enum(["SENT", "OPENED", "REPLIED", "ARCHIVED"]),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json();
  const parsed = statusSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { id } = await params;

  const application = await prisma.application.findUnique({
    where: { id },
    include: { profile: true },
  });

  if (!application || application.profile.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const data: Record<string, unknown> = {
    status: parsed.data.status,
  };

  if (parsed.data.status === "OPENED" && !application.openedAt) {
    data.openedAt = new Date();
  }

  if (parsed.data.status === "REPLIED") {
    data.repliedAt = new Date();
  }

  const updated = await prisma.application.update({
    where: { id: application.id },
    data,
  });

  return NextResponse.json({ ok: true, application: updated });
}


