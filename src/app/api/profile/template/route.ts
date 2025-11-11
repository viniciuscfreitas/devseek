import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const templateSchema = z.object({
  name: z.string().min(1).default("Default"),
  subject: z.string().min(3),
  body: z.string().min(20),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await request.json();
  const parsed = templateSchema.safeParse(data);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const profile = await prisma.profile.findFirst({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
    include: { emailTemplates: true },
  });

  if (!profile) {
    return NextResponse.json(
      { error: "Profile not found" },
      { status: 404 },
    );
  }

  const { name, subject, body } = parsed.data;

  const template = profile.emailTemplates[0];

  if (template) {
    await prisma.emailTemplate.update({
      where: { id: template.id },
      data: { name, subject, body },
    });
  } else {
    await prisma.emailTemplate.create({
      data: {
        profileId: profile.id,
        name,
        subject,
        body,
      },
    });
  }

  return NextResponse.json({ ok: true });
}


