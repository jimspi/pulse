import OpenAI from "openai";

let client: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (client) return client;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === "your-openai-api-key-here") {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  client = new OpenAI({ apiKey });
  return client;
}

export function isOpenAIConfigured(): boolean {
  const apiKey = process.env.OPENAI_API_KEY;
  return !!apiKey && apiKey !== "your-openai-api-key-here";
}
