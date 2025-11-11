import { env } from "./env";
import { logger } from "./logger";

type AiJobContext = {
  jobTitle: string;
  description?: string | null;
  company?: string | null;
  techStack: string[];
};

type AiEmailContext = AiJobContext & {
  profileName: string;
};

const AI_DISABLED_MESSAGE =
  "AI assist disabled. Provide AI_PROVIDER and API key to enable.";

const aiEnabled = env.AI_ENABLED && Boolean(env.AI_PROVIDER);

const getApiKey = () => {
  if (env.AI_PROVIDER === "openai") {
    return env.OPENAI_API_KEY;
  }
  if (env.AI_PROVIDER === "groq") {
    return env.GROQ_API_KEY;
  }
  return undefined;
};

const buildPrompt = (context: AiJobContext) => {
  return `
You are a job matching assistant.
- Job title: ${context.jobTitle}
- Company: ${context.company ?? "Unknown"}
- Description: ${context.description ?? "No description"}
- Candidate tech stack: ${context.techStack.join(", ")}

Return JSON with keys:
- score: integer 0-100
- reasons: array of 2 short bullet strings
`;
};

export const getAiMatchInsights = async (context: AiJobContext) => {
  if (!aiEnabled) {
    logger.debug(AI_DISABLED_MESSAGE, context);
    return null;
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    logger.warn("AI provider configured but API key missing");
    return null;
  }

  try {
    if (env.AI_PROVIDER === "openai") {
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4.1-mini",
          input: buildPrompt(context),
          response_format: { type: "json_schema", json_schema: { name: "MatchInsight", schema: { type: "object", properties: { score: { type: "number" }, reasons: { type: "array", items: { type: "string" } } }, required: ["score", "reasons"] } } },
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI request failed with ${response.status}`);
      }

      const data = await response.json();
      const parsed = JSON.parse(data.output[0].content[0].text);
      return parsed as { score: number; reasons: string[] };
    }

    if (env.AI_PROVIDER === "groq") {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.2-90b-text-preview",
          messages: [
            { role: "system", content: "You are a JSON emitting assistant." },
            { role: "user", content: buildPrompt(context) },
          ],
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        throw new Error(`Groq request failed with ${response.status}`);
      }

      const data = await response.json();
      const parsed = JSON.parse(data.choices[0].message.content);
      return parsed as { score: number; reasons: string[] };
    }
  } catch (error) {
    logger.error("AI match scoring failed", { error });
  }

  return null;
};

export const getAiEmailSuggestion = async (context: AiEmailContext) => {
  if (!aiEnabled) {
    return null;
  }

  const insights = await getAiMatchInsights(context);

  if (!insights) {
    return null;
  }

  const whyFit = insights.reasons?.join(" | ") ?? "";

  return {
    subject: `Candidatura: ${context.jobTitle} - ${context.profileName}`,
    whyFit,
  };
};


