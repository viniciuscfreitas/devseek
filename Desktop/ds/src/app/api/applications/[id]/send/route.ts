import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mailer";
import { renderEmail } from "@/lib/templates";
import { getAiEmailSuggestion } from "@/lib/ai";

const sendSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(3).optional(),
  body: z.string().min(10).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json();
  const parsed = sendSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { id } = await params;

  const application = await prisma.application.findUnique({
    where: { id },
    include: {
      job: true,
      profile: {
        include: {
          user: true,
          emailTemplates: true,
        },
      },
    },
  });

  if (!application || application.profile.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const template = application.profile.emailTemplates[0] ?? null;
  const filters =
    (application.profile.filters as Record<string, unknown> | null) ?? {};
  const techStack = (filters.techStack as string[] | undefined) ?? [];

  const aiSuggestion = await getAiEmailSuggestion({
    jobTitle: application.job.title,
    description: application.job.description,
    company: application.job.company,
    techStack,
    profileName: application.profile.user?.name ?? application.profile.userId,
  });

  const rendered = renderEmail(template, {
    jobTitle: application.job.title,
    company: application.job.company,
    myName: application.profile.user?.name ?? application.profile.userId,
    mySkills: techStack,
    whyFit: aiSuggestion?.whyFit,
  });

  const emailBody =
    parsed.data.body ?? application.generatedEmail ?? rendered.body;
  const emailSubject =
    parsed.data.subject ?? aiSuggestion?.subject ?? rendered.subject;

  await sendMail({
    to: parsed.data.to,
    subject: emailSubject,
    html: emailBody
      .split("\n")
      .map((line: string) => `<p>${line}</p>`)
      .join(""),
    text: emailBody,
  });

  const updated = await prisma.application.update({
    where: { id: application.id },
    data: {
      status: "SENT",
      sentAt: new Date(),
      generatedEmail: emailBody,
    },
  });

  return NextResponse.json({ ok: true, application: updated });
}


