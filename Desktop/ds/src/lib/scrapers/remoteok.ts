type ScrapeFilters = {
  techStack: string[];
  locations?: string[];
  seniority?: string;
};

type RemoteOkJob = {
  id: number;
  date: string;
  company: string;
  position: string;
  description: string;
  url: string;
};

export const scrapeRemoteOkJobs = async (
  filters: ScrapeFilters,
): Promise<
  Array<{
    externalId: string;
    title: string;
    company?: string;
    location?: string;
    description?: string;
    url: string;
  }>
> => {
  const response = await fetch("https://remoteok.com/api");
  if (!response.ok) {
    throw new Error(`Remote OK request failed with status ${response.status}`);
  }

  const data = (await response.json()) as RemoteOkJob[];
  const keywords = new Set(filters.techStack.map((item) => item.toLowerCase()));

  return data
    .slice(1) // API includes metadata entry at index 0
    .filter((job) => {
      const haystack = `${job.position} ${job.description}`.toLowerCase();
      return Array.from(keywords).some((keyword) => haystack.includes(keyword));
    })
    .slice(0, 20)
    .map((job) => ({
      externalId: job.id.toString(),
      title: job.position,
      company: job.company,
      location: "Remote",
      description: job.description,
      url: job.url.startsWith("http") ? job.url : `https://remoteok.com${job.url}`,
    }));
};

