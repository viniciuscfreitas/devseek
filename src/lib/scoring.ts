export type MatchInput = {
  requiredKeywords: string[];
  preferredKeywords?: string[];
  jobDescription: string;
};

const normalize = (value: string) => value.trim().toLowerCase();

export const calculateBaselineMatch = ({
  requiredKeywords,
  preferredKeywords = [],
  jobDescription,
}: MatchInput) => {
  if (!jobDescription) {
    return 0;
  }

  const description = normalize(jobDescription);
  const allRequired = requiredKeywords.map(normalize);
  const allPreferred = preferredKeywords.map(normalize);

  const requiredHits = allRequired.filter((keyword) =>
    description.includes(keyword),
  ).length;

  if (allRequired.length === 0) {
    return Math.min(100, allPreferred.length * 10);
  }

  const requiredScore = (requiredHits / allRequired.length) * 70;
  const preferredHits = allPreferred.filter((keyword) =>
    description.includes(keyword),
  ).length;
  const preferredScore =
    allPreferred.length === 0
      ? 0
      : Math.min((preferredHits / allPreferred.length) * 30, 30);

  return Math.round(requiredScore + preferredScore);
};

