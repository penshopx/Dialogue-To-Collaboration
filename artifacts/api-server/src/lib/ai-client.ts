import OpenAI from "openai";

export type AIProvider = "openai" | "deepseek" | "gemini" | "qwen";

export interface ModelOption {
  value: string;
  label: string;
  provider: AIProvider;
  desc: string;
}

export const MODEL_CATALOG: ModelOption[] = [
  // ── OpenAI ────────────────────────────────────────────────────────────────
  { value: "gpt-4o-mini",   label: "GPT-4o mini",  provider: "openai",   desc: "Cepat & hemat" },
  { value: "gpt-4o",        label: "GPT-4o",        provider: "openai",   desc: "Akurat & kuat" },
  { value: "gpt-4-turbo",   label: "GPT-4 Turbo",   provider: "openai",   desc: "Konteks panjang" },
  // ── DeepSeek ─────────────────────────────────────────────────────────────
  { value: "deepseek-chat",      label: "DeepSeek Chat",      provider: "deepseek", desc: "Analitik & coding" },
  { value: "deepseek-reasoner",  label: "DeepSeek Reasoner",  provider: "deepseek", desc: "Penalaran mendalam" },
  // ── Gemini ────────────────────────────────────────────────────────────────
  { value: "gemini-2.0-flash",      label: "Gemini 2.0 Flash",   provider: "gemini",   desc: "Paling cepat" },
  { value: "gemini-1.5-flash",      label: "Gemini 1.5 Flash",   provider: "gemini",   desc: "Cepat & murah" },
  { value: "gemini-1.5-pro",        label: "Gemini 1.5 Pro",     provider: "gemini",   desc: "Paling canggih" },
  // ── Qwen (Alibaba) ────────────────────────────────────────────────────────
  { value: "qwen-turbo",    label: "Qwen Turbo",    provider: "qwen",    desc: "Cepat & efisien" },
  { value: "qwen-plus",     label: "Qwen Plus",     provider: "qwen",    desc: "Seimbang" },
  { value: "qwen-max",      label: "Qwen Max",      provider: "qwen",    desc: "Paling kuat" },
  { value: "qwen3-235b-a22b", label: "Qwen3 235B",  provider: "qwen",    desc: "Open-source flagship" },
];

const PROVIDER_LABELS: Record<AIProvider, string> = {
  openai:   "OpenAI",
  deepseek: "DeepSeek",
  gemini:   "Gemini",
  qwen:     "Qwen",
};

export function getProviderLabel(provider: AIProvider): string {
  return PROVIDER_LABELS[provider];
}

function detectProvider(model: string): AIProvider {
  if (model.startsWith("gpt-") || model.startsWith("o1") || model.startsWith("o3")) return "openai";
  if (model.startsWith("deepseek")) return "deepseek";
  if (model.startsWith("gemini")) return "gemini";
  if (model.startsWith("qwen")) return "qwen";
  return "openai";
}

export function resolveAIClient(model: string): OpenAI {
  const provider = detectProvider(model);

  switch (provider) {
    case "deepseek":
      return new OpenAI({
        apiKey: process.env.DEEPSEEK_API_KEY ?? "",
        baseURL: "https://api.deepseek.com/v1",
      });

    case "gemini":
      return new OpenAI({
        apiKey: process.env.GEMINI_API_KEY ?? "",
        baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
      });

    case "qwen":
      return new OpenAI({
        apiKey: process.env.DASHSCOPE_API_KEY ?? "",
        baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
      });

    case "openai":
    default:
      return new OpenAI({
        apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY ?? process.env.OPENAI_API_KEY ?? "",
        baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL ?? "https://api.openai.com/v1",
      });
  }
}

export function isProviderConfigured(model: string): { ok: boolean; missing: string } {
  const provider = detectProvider(model);
  switch (provider) {
    case "deepseek":
      return process.env.DEEPSEEK_API_KEY
        ? { ok: true, missing: "" }
        : { ok: false, missing: "DEEPSEEK_API_KEY" };
    case "gemini":
      return process.env.GEMINI_API_KEY
        ? { ok: true, missing: "" }
        : { ok: false, missing: "GEMINI_API_KEY" };
    case "qwen":
      return process.env.DASHSCOPE_API_KEY
        ? { ok: true, missing: "" }
        : { ok: false, missing: "DASHSCOPE_API_KEY" };
    case "openai":
    default:
      return (process.env.AI_INTEGRATIONS_OPENAI_API_KEY ?? process.env.OPENAI_API_KEY)
        ? { ok: true, missing: "" }
        : { ok: false, missing: "OPENAI_API_KEY" };
  }
}
