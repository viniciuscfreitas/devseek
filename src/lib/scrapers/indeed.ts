import * as cheerio from "cheerio";

type ScrapeFilters = {
  techStack: string[];
  locations?: string[];
  seniority?: string;
};

type ScrapedJob = {
  externalId: string;
  title: string;
  company?: string;
  location?: string;
  description?: string;
  url: string;
};

const INDEED_BASE = "https://www.indeed.com";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function scrapeIndeedJobs(filters: ScrapeFilters): Promise<ScrapedJob[]> {
  const searchTerm = filters.techStack.join(" ") || "software engineer";
  const locationQuery = filters.locations?.[0] ?? "remote";
  const url = `${INDEED_BASE}/jobs?q=${encodeURIComponent(searchTerm)}&l=${encodeURIComponent(locationQuery)}&fromage=7`;

  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.8",
    },
  });

  if (!response.ok) {
    throw new Error(`Indeed request failed with status ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  const jobs: ScrapedJob[] = [];

  $(".job_seen_beacon").each((_, element) => {
    const link = $(element).find("a").first();
    const href = link.attr("href");
    if (!href) return;

    const title = $(element).find("h2 span").first().text().trim();
    const company = $(element).find(".css-1q5v67i a").first().text().trim() || $(element).find(".css-1q5v67i span").first().text().trim();
    const location = $(element).find(".css-1p0sjhy").first().text().trim();
    const description = $(element).find(".job-snippet").text().trim();
    const externalId = $(element).attr("data-jk") ?? href.split("?")[0].split("/").pop() ?? crypto.randomUUID();

    jobs.push({
      externalId,
      title: title || "Opportunity",
      company: company || undefined,
      location: location || undefined,
      description: description || undefined,
      url: href.startsWith("http") ? href : `${INDEED_BASE}${href}`,
    });
  });

  // Gentle delay to avoid rapid successive requests if cron loops.
  await delay(1000);

  return jobs.slice(0, 25);
}


