import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { renderEmail } from "@/lib/templates";
import { getAiEmailSuggestion } from "@/lib/ai";

const createSchema = z.object({
  jobId: z.string().cuid(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json();
  const parsed = createSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { jobId } = parsed.data;

  const profile = await prisma.profile.findFirst({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
    include: {
      emailTemplates: true,
      user: true,
    },
  });

  if (!profile) {
    return NextResponse.json(
      { error: "Profile not found" },
      { status: 404 },
    );
  }

  const job = await prisma.jobPosting.findUnique({
    where: { id: jobId },
  });

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const template = profile.emailTemplates[0] ?? null;
  const filters = (profile.filters as Record<string, unknown> | null) ?? {};
  const techStack = (filters.techStack as string[] | undefined) ?? [];

  const aiSuggestion = await getAiEmailSuggestion({
    jobTitle: job.title,
    description: job.description,
    company: job.company,
    techStack,
    profileName: profile.user?.name ?? profile.userId,
  });

  const rendered = renderEmail(template, {
    jobTitle: job.title,
    company: job.company,
    myName: profile.user?.name ?? profile.userId,
    mySkills: techStack,
    whyFit: aiSuggestion?.whyFit,
  });

  const finalSubject = aiSuggestion?.subject ?? rendered.subject;
  const finalBody = rendered.body;

  const application = await prisma.application.upsert({
    where: {
      jobId_profileId: {
        jobId: job.id,
        profileId: profile.id,
      },
    },
    create: {
      jobId: job.id,
      profileId: profile.id,
      status: "DRAFT",
      generatedEmail: finalBody,
      emailTemplateId: template?.id,
      notes: "",
    },
    update: {
      generatedEmail: finalBody,
      emailTemplateId: template?.id,
    },
    include: {
      emailTemplate: true,
    },
  });

  return NextResponse.json({
    application: {
      id: application.id,
      status: application.status,
      generatedEmail: application.generatedEmail,
      subject: finalSubject,
      aiSuggestion,
    },
  });
}


