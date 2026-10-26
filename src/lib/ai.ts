import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { CvContent } from "./types";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5";

export function aiEnabled() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

function client() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

export interface ExtractedCv {
  full_name: string | null;
  headline: string | null;
  location: string | null;
  summary: string | null;
  methodologies: string[];
  tools: string[];
  positions: {
    company: string;
    title: string;
    start_date: string;
    end_date: string | null;
    segment: "smb" | "mid_market" | "enterprise" | null;
    description: string | null;
    stated_metrics: {
      year: number | null;
      attainment_pct: number | null;
      closed_revenue: number | null;
      quota: number | null;
      ranking: string | null;
    }[];
  }[];
  achievements: {
    company: string | null;
    kind: "award" | "deal" | "promotion" | "milestone";
    title: string;
    year: number | null;
    deal_value: number | null;
  }[];
}

const nullable = (type: string) => ({ anyOf: [{ type }, { type: "null" }] });

const EXTRACT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["full_name", "headline", "location", "summary", "methodologies", "tools", "positions", "achievements"],
  properties: {
    full_name: nullable("string"),
    headline: nullable("string"),
    location: nullable("string"),
    summary: nullable("string"),
    methodologies: { type: "array", items: { type: "string" } },
    tools: { type: "array", items: { type: "string" } },
    positions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["company", "title", "start_date", "end_date", "segment", "description", "stated_metrics"],
        properties: {
          company: { type: "string" },
          title: { type: "string" },
          start_date: { type: "string", description: "YYYY-MM-01; use January if only the year is known" },
          end_date: { anyOf: [{ type: "string" }, { type: "null" }], description: "YYYY-MM-01, or null if current" },
          segment: { anyOf: [{ type: "string", enum: ["smb", "mid_market", "enterprise"] }, { type: "null" }] },
          description: nullable("string"),
          stated_metrics: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["year", "attainment_pct", "closed_revenue", "quota", "ranking"],
              properties: {
                year: nullable("integer"),
                attainment_pct: nullable("number"),
                closed_revenue: nullable("number"),
                quota: nullable("number"),
                ranking: nullable("string"),
              },
            },
          },
        },
      },
    },
    achievements: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["company", "kind", "title", "year", "deal_value"],
        properties: {
          company: nullable("string"),
          kind: { type: "string", enum: ["award", "deal", "promotion", "milestone"] },
          title: { type: "string" },
          year: nullable("integer"),
          deal_value: nullable("number"),
        },
      },
    },
  },
} as const;

function textOf(res: Anthropic.Message) {
  if (res.stop_reason === "refusal") throw new Error("The model declined to process this document.");
  if (res.stop_reason === "max_tokens") throw new Error("The CV was too long to process in one pass.");
  const block = res.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") throw new Error("No response from the model.");
  return block.text;
}

/** Extract structured career data from a CV PDF. Output is for user review, never saved directly. */
export async function extractCvFromPdf(pdfBase64: string): Promise<ExtractedCv> {
  const res = await client().messages.create({
    model: MODEL,
    max_tokens: 8000,
    system:
      "You extract career data from a salesperson's CV. Only record what the document states. " +
      "Never estimate or invent numbers: if a metric is not explicitly written, use null. " +
      "Percentages like '127% of quota' go in attainment_pct as 127. Amounts like '€1.2M' become 1200000. " +
      "Put awards (President's Club, top performer), promotions, notable deal wins and milestones in achievements.",
    messages: [
      {
        role: "user",
        content: [
          { type: "document", source: { type: "base64", media_type: "application/pdf", data: pdfBase64 } },
          { type: "text", text: "Extract this CV into the schema." },
        ],
      },
    ],
    output_config: { format: { type: "json_schema", schema: EXTRACT_SCHEMA } },
  });
  return JSON.parse(textOf(res)) as ExtractedCv;
}

const POLISH_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "experience"],
  properties: {
    summary: { type: "string" },
    experience: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["bullets"],
        properties: { bullets: { type: "array", items: { type: "string" } } },
      },
    },
  },
} as const;

/** Rephrase summary and bullets for the target role. Must not add facts or numbers. */
export async function polishCv(cv: CvContent, targetRoleLabel: string, emphasisLabel: string): Promise<CvContent> {
  const res = await client().messages.create({
    model: MODEL,
    max_tokens: 4000,
    system:
      "You edit sales CVs. Rewrite the summary and bullets to be concise, results-first and suited to the target role. " +
      "Strict rules: keep every number exactly as given; do not add any metric, company, award, client name or claim " +
      "that is not in the input; keep the same number of experience entries in the same order; at most 5 bullets each; " +
      "British English; no first person.",
    messages: [
      {
        role: "user",
        content:
          `Target role: ${targetRoleLabel}\nEmphasis: ${emphasisLabel}\n\n` +
          JSON.stringify({ summary: cv.summary, experience: cv.experience.map((e) => ({ title: e.title, company: e.company, bullets: e.bullets })) }),
      },
    ],
    output_config: { format: { type: "json_schema", schema: POLISH_SCHEMA } },
  });
  const out = JSON.parse(textOf(res)) as { summary: string; experience: { bullets: string[] }[] };
  if (out.experience.length !== cv.experience.length) return cv;
  if (introducesNewNumbers(cv, out)) return cv;
  return {
    ...cv,
    summary: out.summary,
    experience: cv.experience.map((e, i) => ({ ...e, bullets: out.experience[i].bullets })),
  };
}

/** Guardrail: reject a polish that contains numbers not present in the original. */
function introducesNewNumbers(before: CvContent, after: { summary: string; experience: { bullets: string[] }[] }) {
  const nums = (s: string) => new Set((s.match(/\d+(?:[.,]\d+)?/g) ?? []).map((n) => n.replace(",", ".")));
  const original = nums(JSON.stringify(before));
  const updated = nums(JSON.stringify(after));
  for (const n of updated) if (!original.has(n)) return true;
  return false;
}
