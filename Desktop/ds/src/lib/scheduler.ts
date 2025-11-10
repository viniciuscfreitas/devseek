import cron from "node-cron";

import { prisma } from "./prisma";
import { runScrapeForProfile } from "./jobs";
import { logger } from "./logger";

declare global {
  var __DEVSCOUT_CRON_INITIALISED__: boolean | undefined;
}

export function initialiseCron() {
  if (globalThis.__DEVSCOUT_CRON_INITIALISED__) {
    return;
  }

  cron.schedule("0 */6 * * *", async () => {
    try {
      const profiles = await prisma.profile.findMany({
        where: { onboardingCompleted: true },
        select: { id: true },
      });

      for (const profile of profiles) {
        await runScrapeForProfile(profile.id);
      }

      logger.info("Cron scrape completed", { count: profiles.length });
    } catch (error) {
      logger.error("Cron scrape failed", { error: String(error) });
    }
  });

  globalThis.__DEVSCOUT_CRON_INITIALISED__ = true;
  logger.info("Cron scheduler initialised");
}

