import { v4 as uuidv4 } from "uuid";
import { getOpenAIClient, isOpenAIConfigured } from "../openai";
import { getDb, getUnprocessedArticles, updateProcessedArticle, getArticleCount } from "../db";
import { CATEGORIES } from "../utils";

const DIGEST_SYSTEM_PROMPT = `You are an AI news editor for "The Pulse," a publication that explains AI advancements to a general audience. Your job is to take raw AI news articles and produce clear, honest, jargon-free summaries.

Rules:
- Write in active voice, present tense where possible
- Never use hype words: "revolutionary," "groundbreaking," "game-changing," "unleash," "supercharge"
- Never use corporate speak: "leverage," "synergy," "ecosystem," "paradigm"
- Explain technical concepts in plain language with brief parenthetical clarifications when needed
- Be specific about what happened, who did it, and why it matters
- If something is incremental, say so honestly — not everything is a breakthrough
- Keep the digest to 60-80 words maximum
- The "Why This Matters" line should be concrete, not vague — connect it to something the reader cares about`;

const CATEGORY_SLUGS: string[] = CATEGORIES.map((c) => c.slug);

export async function processUnprocessedArticles(): Promise<{
  processed: number;
  errors: string[];
}> {
  if (!isOpenAIConfigured()) {
    return { processed: 0, errors: ["OpenAI API key not configured"] };
  }

  const articles = getUnprocessedArticles();
  let processed = 0;
  const errors: string[] = [];

  for (const article of articles) {
    try {
      const result = await processArticle(article.raw_title, article.source_name);
      updateProcessedArticle(article.id, result);
      processed++;
    } catch (err) {
      errors.push(
        `Failed to process "${article.raw_title}": ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  return { processed, errors };
}

async function processArticle(
  rawTitle: string,
  sourceName: string
): Promise<{
  processed_title: string;
  digest: string;
  why_it_matters: string;
  primary_category: string;
  secondary_tags: string[];
  trending_score: number;
}> {
  const client = getOpenAIClient();

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.3,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: DIGEST_SYSTEM_PROMPT },
      {
        role: "user",
        content: `Process this AI news article:

Title: "${rawTitle}"
Source: ${sourceName}

Respond in JSON with these exact fields:
{
  "processed_title": "A plain-English, informative title (not clickbait, not a question)",
  "digest": "60-80 word summary for a general audience",
  "why_it_matters": "One line, 15 words max, explaining why a regular person should care",
  "primary_category": "one of: ${CATEGORY_SLUGS.join(", ")}",
  "secondary_tags": ["up to 2 additional category slugs from the same list, or empty array"],
  "trending_score": <number 1-10 based on likely impact, novelty, and recency>
}`,
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("Empty response from OpenAI");

  const parsed = JSON.parse(content);

  if (!CATEGORY_SLUGS.includes(parsed.primary_category)) {
    parsed.primary_category = "research";
  }
  parsed.secondary_tags = (parsed.secondary_tags || []).filter((t: string) =>
    CATEGORY_SLUGS.includes(t)
  );

  parsed.trending_score = Math.max(1, Math.min(10, Number(parsed.trending_score) || 5));

  return parsed;
}

// Seed the database with sample articles when no OpenAI key is available or DB is empty
export async function seedSampleArticles(): Promise<void> {
  if (getArticleCount() > 0) return;

  if (isOpenAIConfigured()) {
    await seedWithOpenAI();
  } else {
    seedWithFallback();
  }
}

async function seedWithOpenAI(): Promise<void> {
  const client = getOpenAIClient();

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.7,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: DIGEST_SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: `Generate 18 realistic AI news articles that might appear in February 2026. Cover all these categories: ${CATEGORY_SLUGS.join(", ")}.

For each article provide:
- raw_title: realistic headline from a tech publication
- source_name: one of "MIT Technology Review", "ArXiv CS.AI", "The Verge", "TechCrunch", "Wired", "OpenAI Blog", "Ars Technica", "Hugging Face", "Google DeepMind", "Anthropic"
- processed_title: plain-English informative title
- digest: 60-80 word summary
- why_it_matters: one line, 15 words max
- primary_category: one of the category slugs
- secondary_tags: up to 2 additional slugs
- trending_score: 1-10
- hours_ago: how many hours ago this was published (1-72)

Respond as JSON: { "articles": [...] }`,
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) return;

  const { articles } = JSON.parse(content);
  const db = getDb();

  const insert = db.prepare(
    `INSERT OR IGNORE INTO articles (id, source_url, source_name, raw_title, processed_title, digest, why_it_matters, primary_category, secondary_tags, trending_score, published_at, processed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
  );

  for (const a of articles) {
    const publishedAt = new Date(
      Date.now() - (a.hours_ago || 12) * 60 * 60 * 1000
    ).toISOString();

    insert.run(
      uuidv4(),
      `https://example.com/article/${uuidv4().slice(0, 8)}`,
      a.source_name,
      a.raw_title,
      a.processed_title,
      a.digest,
      a.why_it_matters,
      a.primary_category,
      JSON.stringify(a.secondary_tags || []),
      a.trending_score,
      publishedAt
    );
  }
}

function seedWithFallback(): void {
  const db = getDb();

  const sampleArticles = [
    {
      source_name: "MIT Technology Review",
      raw_title: "New reasoning model achieves state-of-the-art on graduate-level math benchmarks",
      processed_title: "Latest Reasoning Model Matches PhD-Level Math Performance",
      digest: "A new AI model from a leading research lab now solves graduate-level mathematics problems with 92% accuracy, up from 78% just six months ago. The model uses a chain-of-thought approach that breaks complex proofs into smaller steps, similar to how human mathematicians work. Independent researchers confirmed the results across multiple university-level exam sets.",
      why_it_matters: "AI can now reliably solve problems that challenge most graduate students.",
      primary_category: "models",
      secondary_tags: ["research"],
      trending_score: 9,
      hours_ago: 3,
    },
    {
      source_name: "The Verge",
      raw_title: "Google announces Gemini 3.0 with real-time multimodal understanding",
      processed_title: "Google's Gemini 3.0 Processes Text, Images, and Video Simultaneously",
      digest: "Google released Gemini 3.0, which can analyze text, images, audio, and video together in real time. During a live demo, the model described what was happening in a video feed while answering spoken questions about it. The model is available now through Google's API and will roll out to consumer products over the coming weeks.",
      why_it_matters: "AI assistants can now see, hear, and understand context all at once.",
      primary_category: "models",
      secondary_tags: ["products"],
      trending_score: 9,
      hours_ago: 5,
    },
    {
      source_name: "ArXiv CS.AI",
      raw_title: "Efficient fine-tuning with 90% less compute using structured sparse attention",
      processed_title: "New Method Cuts AI Training Costs by 90 Percent",
      digest: "Researchers published a technique called structured sparse attention that lets developers fine-tune large AI models using just 10% of the usual computing power. The method works by focusing training only on the most relevant connections in the neural network, skipping redundant ones. Early adopters report similar quality to full fine-tuning at a fraction of the cost.",
      why_it_matters: "Smaller companies and researchers can now afford to customize powerful AI.",
      primary_category: "research",
      secondary_tags: ["open-source"],
      trending_score: 8,
      hours_ago: 8,
    },
    {
      source_name: "TechCrunch",
      raw_title: "Anthropic raises $5B Series E at $80B valuation",
      processed_title: "Anthropic Raises Five Billion Dollars, Now Valued at Eighty Billion",
      digest: "AI safety company Anthropic closed a five-billion-dollar funding round, bringing its valuation to eighty billion dollars. The company, which makes the Claude AI assistant, said the money will fund new research into making AI systems more reliable and trustworthy. The round was led by existing investors with participation from several sovereign wealth funds.",
      why_it_matters: "The largest AI companies are now valued like major tech corporations.",
      primary_category: "industry",
      secondary_tags: ["policy"],
      trending_score: 8,
      hours_ago: 6,
    },
    {
      source_name: "OpenAI Blog",
      raw_title: "Introducing GPT-5: Our most capable model yet",
      processed_title: "OpenAI Releases GPT-5 with Stronger Reasoning and Longer Memory",
      digest: "OpenAI launched GPT-5, its newest AI model, which can handle longer conversations, follow complex instructions more accurately, and make fewer factual errors than its predecessor. The model now remembers context across a full workday of conversation. Pricing starts at the same level as GPT-4o, making the upgrade free for existing subscribers.",
      why_it_matters: "AI assistants now remember full conversations and make fewer mistakes.",
      primary_category: "models",
      secondary_tags: ["products"],
      trending_score: 10,
      hours_ago: 2,
    },
    {
      source_name: "Wired",
      raw_title: "EU AI Act enforcement begins with first compliance audits",
      processed_title: "European Union Begins Enforcing AI Safety Rules with Company Audits",
      digest: "The European Union started its first compliance audits under the AI Act, reviewing how major tech companies classify and test their AI systems. Auditors visited offices in Dublin and Amsterdam, focusing on how companies assess risk in AI products that interact with the public. Companies face fines up to six percent of global revenue for violations.",
      why_it_matters: "AI companies now face real penalties for deploying unsafe systems in Europe.",
      primary_category: "policy",
      secondary_tags: ["industry"],
      trending_score: 7,
      hours_ago: 10,
    },
    {
      source_name: "Hugging Face",
      raw_title: "Community releases open-source GPT-4 equivalent model with Apache 2.0 license",
      processed_title: "Open Source Community Releases Free Model That Rivals GPT-4",
      digest: "A consortium of independent researchers released an open-source AI model that matches GPT-4's performance on standard benchmarks. The model is free to use, modify, and deploy commercially under an Apache 2.0 license. It runs on consumer hardware with 48GB of RAM, making it accessible to individual developers and small teams for the first time.",
      why_it_matters: "Top-tier AI is no longer locked behind corporate paywalls.",
      primary_category: "open-source",
      secondary_tags: ["models"],
      trending_score: 9,
      hours_ago: 4,
    },
    {
      source_name: "Ars Technica",
      raw_title: "AI video generation tool creates photorealistic 60-second clips from text",
      processed_title: "New AI Tool Generates Realistic One-Minute Videos from Text Descriptions",
      digest: "A startup released an AI video generator that creates photorealistic 60-second clips from written descriptions. The tool handles complex scenes with multiple people, consistent lighting, and realistic physics. It costs roughly two dollars per minute of generated video. Filmmakers and advertisers have already started using it for storyboarding and concept visualization.",
      why_it_matters: "Anyone can now create professional-looking video without cameras or crews.",
      primary_category: "creative",
      secondary_tags: ["products"],
      trending_score: 8,
      hours_ago: 12,
    },
    {
      source_name: "MIT Technology Review",
      raw_title: "Autonomous AI agents complete multi-step tasks without human oversight",
      processed_title: "AI Agents Now Complete Complex Tasks Independently Across Multiple Apps",
      digest: "Several companies demonstrated AI agents that can independently complete multi-step tasks like researching topics, booking travel, and managing project workflows across different applications. The agents use a protocol called MCP (Model Context Protocol) to connect with various software tools. Early users report the agents handle routine administrative work that previously took hours.",
      why_it_matters: "AI can now do your busywork across multiple apps without supervision.",
      primary_category: "agents",
      secondary_tags: ["products"],
      trending_score: 9,
      hours_ago: 7,
    },
    {
      source_name: "Google DeepMind",
      raw_title: "AlphaProtein predicts protein interactions with 95% accuracy",
      processed_title: "DeepMind's New Model Predicts How Proteins Interact with Near-Perfect Accuracy",
      digest: "Google DeepMind's AlphaProtein system now predicts how proteins interact with each other at 95% accuracy, a significant jump from the previous 67%. This matters for drug discovery because most diseases involve proteins that malfunction or interact incorrectly. Several pharmaceutical companies have already begun using the system to identify potential drug targets.",
      why_it_matters: "Faster protein predictions could speed up drug development by years.",
      primary_category: "research",
      secondary_tags: ["models"],
      trending_score: 8,
      hours_ago: 15,
    },
    {
      source_name: "TechCrunch",
      raw_title: "Microsoft integrates AI copilot into every Office application",
      processed_title: "Microsoft Adds AI Assistant to All Office Apps, No Extra Cost for Business Users",
      digest: "Microsoft announced that its AI Copilot feature is now included in all Microsoft 365 business subscriptions at no additional charge. The AI assistant can draft documents, analyze spreadsheets, create presentations, and summarize email threads. Previously available only as a thirty-dollar-per-month add-on, the move brings AI tools to an estimated 400 million Office users.",
      why_it_matters: "Hundreds of millions of office workers now have AI built into their daily tools.",
      primary_category: "products",
      secondary_tags: ["industry"],
      trending_score: 7,
      hours_ago: 18,
    },
    {
      source_name: "The Verge",
      raw_title: "AI music generators face first major copyright lawsuit from record labels",
      processed_title: "Major Record Labels Sue AI Music Generators Over Copyright",
      digest: "Three major record labels filed a joint lawsuit against two AI music generation companies, arguing their models were trained on copyrighted songs without permission. The labels seek damages and want courts to require explicit licensing before AI companies use copyrighted music for training. The outcome could set a precedent for how copyright law applies to all AI training data.",
      why_it_matters: "This lawsuit could define who owns content that AI learns from.",
      primary_category: "policy",
      secondary_tags: ["creative"],
      trending_score: 7,
      hours_ago: 20,
    },
    {
      source_name: "Anthropic",
      raw_title: "Claude now supports persistent memory across conversations",
      processed_title: "Anthropic's Claude AI Now Remembers Past Conversations",
      digest: "Anthropic rolled out persistent memory for Claude, allowing the AI assistant to remember user preferences, past conversations, and ongoing projects across sessions. Users can review and delete specific memories at any time. The feature works across all Claude interfaces including web, mobile, and API. It is opt-in and off by default.",
      why_it_matters: "AI assistants no longer start from scratch every time you talk to them.",
      primary_category: "products",
      secondary_tags: ["models"],
      trending_score: 8,
      hours_ago: 9,
    },
    {
      source_name: "ArXiv CS.AI",
      raw_title: "Self-improving AI systems demonstrate stable recursive learning without divergence",
      processed_title: "Researchers Show AI Can Safely Improve Its Own Performance",
      digest: "A team of researchers demonstrated an AI system that can improve its own capabilities through repeated self-evaluation without becoming unstable or producing worse results over time. The system uses a feedback mechanism that catches and corrects errors before they compound. This is notable because previous self-improvement attempts tended to degrade quality after several iterations.",
      why_it_matters: "AI that reliably improves itself could accelerate progress across every field.",
      primary_category: "research",
      secondary_tags: ["policy"],
      trending_score: 9,
      hours_ago: 11,
    },
    {
      source_name: "Wired",
      raw_title: "AI chip startup challenges Nvidia with 3x performance per watt",
      processed_title: "Startup's New AI Chip Runs Three Times More Efficiently Than Nvidia's Best",
      digest: "An AI chip startup unveiled a processor that delivers three times the performance per watt of Nvidia's current top chip for AI workloads. The company demonstrated the chip running standard AI benchmarks in a live test verified by independent engineers. If the claims hold in production, it could lower the cost of running AI systems significantly.",
      why_it_matters: "Cheaper, more efficient chips would make AI services less expensive for everyone.",
      primary_category: "industry",
      secondary_tags: ["models"],
      trending_score: 7,
      hours_ago: 22,
    },
    {
      source_name: "Hugging Face",
      raw_title: "Open-source agent framework reaches 100k GitHub stars, becomes standard for AI automation",
      processed_title: "Popular Open Source AI Agent Framework Becomes Industry Standard",
      digest: "An open-source framework for building AI agents reached 100,000 stars on GitHub, making it one of the most popular AI projects in history. Major companies including several Fortune 500 firms now use it in production. The framework provides a standard way to connect AI models to external tools, databases, and APIs using the Model Context Protocol.",
      why_it_matters: "A shared standard for AI agents means they work together instead of in silos.",
      primary_category: "open-source",
      secondary_tags: ["agents"],
      trending_score: 7,
      hours_ago: 14,
    },
    {
      source_name: "MIT Technology Review",
      raw_title: "AI-generated scientific hypotheses lead to three confirmed discoveries",
      processed_title: "AI-Generated Hypotheses Lead to Three Real Scientific Discoveries",
      digest: "An AI system designed to generate scientific hypotheses produced three ideas that were later confirmed through laboratory experiments. The discoveries span materials science, biology, and chemistry. Researchers used the AI to analyze existing papers and identify overlooked connections between findings. Human scientists then designed and ran the experiments to verify the AI's predictions.",
      why_it_matters: "AI is now generating ideas that lead to actual scientific breakthroughs.",
      primary_category: "research",
      secondary_tags: ["models"],
      trending_score: 8,
      hours_ago: 16,
    },
    {
      source_name: "Ars Technica",
      raw_title: "Browser-based AI assistants can now control your computer with permission",
      processed_title: "AI Assistants Can Now Click, Type, and Navigate Your Computer for You",
      digest: "A new generation of AI assistants can now control a computer's mouse and keyboard to complete tasks on the user's behalf. With explicit permission, these agents navigate websites, fill out forms, and operate desktop applications. They show the user each step before executing and can be stopped at any time. Several browsers now support the feature natively.",
      why_it_matters: "Your AI assistant can now operate your computer, not just answer questions.",
      primary_category: "agents",
      secondary_tags: ["products"],
      trending_score: 8,
      hours_ago: 13,
    },
  ];

  const insert = db.prepare(
    `INSERT OR IGNORE INTO articles (id, source_url, source_name, raw_title, processed_title, digest, why_it_matters, primary_category, secondary_tags, trending_score, published_at, processed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
  );

  for (const a of sampleArticles) {
    const publishedAt = new Date(
      Date.now() - a.hours_ago * 60 * 60 * 1000
    ).toISOString();

    insert.run(
      uuidv4(),
      `https://example.com/article/${uuidv4().slice(0, 8)}`,
      a.source_name,
      a.raw_title,
      a.processed_title,
      a.digest,
      a.why_it_matters,
      a.primary_category,
      JSON.stringify(a.secondary_tags),
      a.trending_score,
      publishedAt
    );
  }
}
