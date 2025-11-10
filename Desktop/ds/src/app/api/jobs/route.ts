import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  const [jobs, applications] = await Promise.all([
    prisma.jobPosting.findMany({
      orderBy: { fetchedAt: "desc" },
      take: 50,
      include: {
        source: true,
      },
    }),
    prisma.application.findMany({
      where: { profileId: profile.id },
      include: {
        emailTemplate: true,
      },
    }),
  ]);

  const applicationByJob = new Map(
    applications.map(
      (
        application: (typeof applications)[number],
      ): [string, (typeof applications)[number]] => [
        application.jobId,
        application,
      ],
    ),
  );

  return NextResponse.json({
    jobs: jobs.map((job: (typeof jobs)[number]) => ({
      id: job.id,
      title: job.title,
      company: job.company,
      location: job.location,
      description: job.description,
      url: job.url,
      matchScore: job.matchScore ?? 0,
      aiScore: job.aiScore ?? null,
      aiSummary: job.aiSummary ?? null,
      source: job.source?.name ?? "Unknown",
      application: applicationByJob.get(job.id) ?? null,
    })),
  });
}


