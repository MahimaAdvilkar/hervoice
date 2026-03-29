import type { ChatMessage } from "@/lib/minimax";

export class AnthropicClient {
  private apiKey: string;
  private model: string;
  private baseUrl: string;

  constructor(opts?: { apiKey?: string; model?: string; baseUrl?: string }) {
    this.apiKey = opts?.apiKey ?? process.env.ANTHROPIC_API_KEY ?? "";
    this.model = opts?.model ?? process.env.ANTHROPIC_MODEL ?? "claude-3-5-sonnet-latest";
    this.baseUrl = opts?.baseUrl ?? process.env.ANTHROPIC_BASE_URL ?? "https://api.anthropic.com/v1";

    if (!this.apiKey) {
      throw new Error("Missing ANTHROPIC_API_KEY in environment");
    }
  }

  async chat(messages: ChatMessage[]): Promise<string> {
    const systemMessages = messages.filter((m) => m.role === "system").map((m) => m.content);
    const nonSystem = messages.filter((m) => m.role !== "system");
    const userContent = nonSystem.map((m) => `${m.role.toUpperCase()}:\n${m.content}`).join("\n\n");

    const url = `${this.baseUrl}/messages`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 2500,
        temperature: 0.2,
        system: systemMessages.join("\n\n"),
        messages: [{ role: "user", content: userContent }],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Anthropic API error: ${res.status} ${text}`);
    }

    const json = await res.json();
    const textParts = Array.isArray(json?.content)
      ? json.content.filter((p: any) => p?.type === "text" && typeof p?.text === "string").map((p: any) => p.text)
      : [];
    const content = textParts.join("\n").trim();

    if (!content) {
      throw new Error("Anthropic response did not contain text content");
    }
    return content;
  }
}
