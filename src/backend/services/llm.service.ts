import "server-only";

import OpenAI from "openai";

// ── Types ─────────────────────────────────────────────

export interface AiBodyRequest {
  templateId: string;
  promptVersion: string;
  systemPrompt: string;
  userPrompt: string;
  maxParagraphs: number;
  maxCharsPerParagraph: number;
}

export interface AiBodyResult {
  paragraphs: string[];
  aiUsed: true;
  model: string;
  promptVersion: string;
}

export interface AiFallbackResult {
  aiUsed: false;
  fallbackReason: string;
}

export type AiResult = AiBodyResult | AiFallbackResult;

// ── Configuration ─────────────────────────────────────

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY ?? "";
const DEEPSEEK_BASE_URL =
  process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com";
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL ?? "deepseek-chat";
const LLM_TIMEOUT_MS = 15_000;
const LLM_TEMPERATURE = 0.3;

function isConfigured(): boolean {
  return DEEPSEEK_API_KEY.length > 0 || DEEPSEEK_BASE_URL !== "https://api.deepseek.com";
}

function getClient(): OpenAI {
  return new OpenAI({
    apiKey: DEEPSEEK_API_KEY || "local",
    baseURL: DEEPSEEK_BASE_URL,
    timeout: LLM_TIMEOUT_MS,
  });
}

// ── Validation ────────────────────────────────────────

function validateParagraphs(
  raw: unknown,
  maxParagraphs: number,
  maxChars: number
): string[] | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  if (!Array.isArray(obj.paragraphs)) return null;

  const paragraphs = obj.paragraphs as unknown[];
  if (paragraphs.length === 0 || paragraphs.length > maxParagraphs + 2) {
    return null;
  }

  const validated: string[] = [];
  for (const p of paragraphs) {
    if (typeof p !== "string" || p.trim().length === 0) return null;
    const trimmed = p.trim();
    if (trimmed.length > maxChars * 1.5) return null;
    validated.push(trimmed);
  }

  return validated;
}

// ── Public API ────────────────────────────────────────

export const LlmService = {
  isConfigured,

  async generateBody(req: AiBodyRequest): Promise<AiResult> {
    if (!isConfigured()) {
      return { aiUsed: false, fallbackReason: "DEEPSEEK_API_KEY not configured" };
    }

    try {
      const client = getClient();

      const completion = await client.chat.completions.create({
        model: DEEPSEEK_MODEL,
        temperature: LLM_TEMPERATURE,
        max_tokens: 1200,
        messages: [
          { role: "system", content: req.systemPrompt },
          { role: "user", content: req.userPrompt },
        ],
        response_format: { type: "json_object" },
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        return { aiUsed: false, fallbackReason: "Empty LLM response" };
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(content);
      } catch {
        return {
          aiUsed: false,
          fallbackReason: "LLM returned invalid JSON",
        };
      }

      const paragraphs = validateParagraphs(
        parsed,
        req.maxParagraphs,
        req.maxCharsPerParagraph
      );

      if (!paragraphs) {
        return {
          aiUsed: false,
          fallbackReason: "LLM output failed validation (structure or length)",
        };
      }

      return {
        paragraphs,
        aiUsed: true,
        model: DEEPSEEK_MODEL,
        promptVersion: req.promptVersion,
      };
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Unknown LLM error";
      console.error("[LlmService] Generation failed:", message);
      return {
        aiUsed: false,
        fallbackReason: `LLM error: ${message}`,
      };
    }
  },
};
