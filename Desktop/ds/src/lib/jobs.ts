import { performance } from "node:perf_hooks";

import { getAiMatchInsights } from "./ai";
import { logger } from "./logger";
import { prisma } from "./prisma";
import { calculateBaselineMatch } from "./scoring";
import { scrapeIndeedJobs } from "./scrapers/indeed";
import { scrapeRemoteOkJobs } from "./scrapers/remoteok";

const SOURCES = [
  {
    slug: "indeed",
    name: "Indeed",
    baseUrl: "https://www.indeed.com",
    scrape: scrapeIndeedJobs,
  },
  {
    slug: "remoteok",
    name: "Remote OK",
    baseUrl: "https://remoteok.com",
    scrape: scrapeRemoteOkJobs,
  },
] as const;

async function ensureSources() {
  await Promise.all(
    SOURCES.map((source) =>
      prisma.jobSource.upsert({
        where: { slug: source.slug },
        create: {
          slug: source.slug,
          name: source.name,
          baseUrl: source.baseUrl,
        },
        update: {},
      }),
    ),
  );
}

export async function runScrapeForProfile(profileId: string) {
  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
  });

  if (!profile) {
    throw new Error("Profile not found");
  }

  const filters = (profile.filters as Record<string, unknown> | null) ?? {};
  const techStack = (filters.techStack as string[] | undefined) ?? ["javascript"];
  const locations = (filters.locations as string[] | undefined) ?? ["remote"];
  const seniority = filters.seniority as string | undefined;

  await ensureSources();

  let totalSaved = 0;

  for (const source of SOURCES) {
    const jobSource = await prisma.jobSource.findUniqueOrThrow({
      where: { slug: source.slug },
    });

    const startTime = performance.now();
    let saved = 0;
    let status: "SUCCESS" | "FAILURE" = "SUCCESS";
    let errorMessage: string | null = null;

    try {
      const jobs = await source.scrape({
        techStack,
        locations,
        seniority,
      });

      for (const job of jobs) {
        const matchScore = calculateBaselineMatch({
          requiredKeywords: techStack,
          jobDescription: job.description ?? "",
          preferredKeywords: seniority ? [seniority] : [],
        });

        let aiScore: number | null = null;
        let aiSummary: string | null = null;

        const insights = await getAiMatchInsights({
          jobTitle: job.title,
          description: job.description,
          company: job.company,
          techStack,
        });

        if (insights) {
          aiScore = Math.round(insights.score ?? matchScore);
          aiSummary = insights.reasons?.join(" • ") ?? null;
        }

        try {
          await prisma.jobPosting.upsert({
            where: {
              jobSourceId_externalId: {
                jobSourceId: jobSource.id,
                externalId: job.externalId,
              },
            },
            create: {
              jobSourceId: jobSource.id,
              externalId: job.externalId,
              title: job.title,
              company: job.company,
              location: job.location,
              description: job.description,
              url: job.url,
              matchScore,
              aiScore,
              aiSummary,
              metadata: {
                techStack,
                locations,
                seniority,
              },
            },
            update: {
              title: job.title,
              company: job.company,
              location: job.location,
              description: job.description,
              url: job.url,
              matchScore,
              aiScore,
              aiSummary,
            },
          });
          saved += 1;
        } catch (error) {
          logger.warn("Failed to upsert job posting", {
            error,
            job,
            source: source.slug,
          });
        }
      }
    } catch (error) {
      status = "FAILURE";
      errorMessage = error instanceof Error ? error.message : String(error);
      logger.error("Scrape source failed", {
        source: source.slug,
        error: errorMessage,
      });
    }

    const duration = Math.round(performance.now() - startTime);
    totalSaved += saved;

    await prisma.scrapeLog.create({
      data: {
        jobSourceId: jobSource.id,
        profileId,
        status,
        durationMs: duration,
        itemsFound: saved,
        errorMessage: errorMessage ?? undefined,
        metadata: {
          techStack,
          locations,
          seniority,
        },
      },
    });
  }

  return totalSaved;
}

