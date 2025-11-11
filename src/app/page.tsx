export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 px-6 py-24 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 md:px-16">
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-16">
        <section className="space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-3 py-1 text-sm font-medium text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900">
            DevScout Clone MVP
          </span>

          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Your personal job-hunting agent that ships in weeks, not months.
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-300">
            Automate discovery, prioritise high-fit roles, and send polished
            outreach without living inside job boards. This MVP focuses on
            onboarding, scraping a single source, and delivering personalised
            email drafts you control.
          </p>
        </section>

        <section className="grid gap-6 sm:grid-cols-3">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-zinc-900 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <h2 className="text-lg font-medium">{feature.title}</h2>
              <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">
                {feature.description}
              </p>
            </div>
          ))}
        </section>

        <section className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-100/60 p-6 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-300">
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            What&apos;s next?
          </h3>
          <p className="mt-2">
            Check the README for setup instructions and follow the backlog to
            deliver the remaining epics. Each phase builds on this foundation,
            so keep the slices thin and value-driven.
          </p>
        </section>
      </div>
    </div>
  );
}

const FEATURES = [
  {
    title: "Typed Monolith",
    description:
      "Next.js 15 + Prisma + PostgreSQL, fully containerised for local dev and VPS deployments.",
  },
  {
    title: "Job Intelligence",
    description:
      "Baseline scoring helpers and data models for job sources, applications, and scrape logs.",
  },
  {
    title: "Ready for Growth",
    description:
      "Vitest, Zod, and Docker Compose baked in so future AI, workers, and analytics drop in cleanly.",
  },
] as const;
