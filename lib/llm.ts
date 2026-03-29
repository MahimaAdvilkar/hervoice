import { AnthropicClient } from "@/lib/anthropic";
import { MiniMaxClient } from "@/lib/minimax";

export type LLMProvider = "minimax" | "claude";
export type LLMClient = { chat: (messages: { role: "system" | "user" | "assistant"; content: string }[]) => Promise<string> };

export function resolveProvider(): LLMProvider {
  const provider = (process.env.LLM_PROVIDER ?? "minimax").toLowerCase();
  return provider === "claude" || provider === "anthropic" ? "claude" : "minimax";
}

export function createLLMClient(): LLMClient {
  const provider = resolveProvider();
  if (provider === "claude") return new AnthropicClient();
  return new MiniMaxClient();
}

export function providerEnvStatus() {
  const provider = resolveProvider();
  if (provider === "claude") {
    const apiKey = process.env.ANTHROPIC_API_KEY ?? "";
    return {
      provider,
      has_api_key: !!apiKey,
      api_key_masked: apiKey ? `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}` : null,
      base_url: process.env.ANTHROPIC_BASE_URL ?? "https://api.anthropic.com/v1",
      model: process.env.ANTHROPIC_MODEL ?? "claude-3-5-sonnet-latest",
    };
  }

  const apiKey = process.env.MINIMAX_API_KEY ?? "";
  return {
    provider,
    has_api_key: !!apiKey,
    api_key_masked: apiKey ? `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}` : null,
    base_url: process.env.MINIMAX_BASE_URL ?? "https://api.minimax.io/v1",
    model: process.env.MINIMAX_MODEL ?? "MiniMax-M2.5",
    has_group_id: !!process.env.MINIMAX_GROUP_ID,
  };
}
