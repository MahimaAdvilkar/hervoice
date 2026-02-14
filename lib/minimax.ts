type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export class MiniMaxClient {
  private apiKey: string;
  private groupId?: string;
  private baseUrl: string;
  private model: string;

  constructor(opts?: { apiKey?: string; groupId?: string; baseUrl?: string; model?: string }) {
    this.apiKey = opts?.apiKey ?? process.env.MINIMAX_API_KEY ?? "";
    this.groupId = opts?.groupId ?? process.env.MINIMAX_GROUP_ID;
    // Default to the newer MiniMax IO API; can be overridden via env
    this.baseUrl = opts?.baseUrl ?? process.env.MINIMAX_BASE_URL ?? "https://api.minimax.io/v1";
    this.model = opts?.model ?? process.env.MINIMAX_MODEL ?? "MiniMax-M2.5"; // default model name
    if (!this.apiKey) {
      throw new Error("Missing MINIMAX_API_KEY in environment");
    }
  }

  async chat(messages: ChatMessage[]): Promise<string> {
    // Use OpenAI/Anthropic-compatible MiniMax IO endpoint
    const url = `${this.baseUrl}/chat/completions`;
    const body = {
      model: this.model,
      messages,
      temperature: 0.2,
      stream: false,
      // Ensure sufficient budget to avoid truncated JSON
      max_tokens: 2500,
      extra_body: {
        reasoning_split: true,
      },
      response_format: { type: "json_object" },
    };

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`,
        ...(this.groupId ? { "Group-Id": this.groupId } : {}),
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`MiniMax API error: ${res.status} ${text}`);
    }

    const json = await res.json();

    // The minimax.io completions API returns choices; no base_resp

    // Attempt to extract assistant content robustly across possible shapes
    const tryExtract = (j: any): string | undefined => {
      const first = (v: unknown): string | undefined => {
        if (!v) return undefined;
        if (typeof v === "string") return v;
        if (Array.isArray(v)) {
          const joined = v.filter(x => typeof x === "string").join("");
          return joined || undefined;
        }
        return undefined;
      };

      // Common chat shapes
      const c0 = j?.choices?.[0];
      const msgContent = c0?.message?.content;
      if (typeof msgContent === "string" && msgContent) return msgContent;

      const messagesArr = c0?.messages ?? j?.messages;
      if (Array.isArray(messagesArr)) {
        const assistantMsg = messagesArr.find((m: any) => m?.role === "assistant" && typeof m?.content === "string");
        if (assistantMsg?.content) return assistantMsg.content;
        const anyContent = messagesArr.find((m: any) => typeof m?.content === "string");
        if (anyContent?.content) return anyContent.content;
      }

      // Other likely fields
      const fields = [
        j?.reply,
        j?.text,
        j?.result,
        j?.output_text,
        j?.output,
        c0?.content,
        c0?.text,
        j?.data?.[0]?.completion,
        j?.data?.[0]?.text,
      ];
      for (const f of fields) {
        const s = first(f);
        if (s) return s;
      }

      // Fallback: search shallow string fields that look like JSON/text
      for (const [k, v] of Object.entries(j)) {
        if (typeof v === "string" && v.trim()) {
          return v;
        }
      }
      return undefined;
    };

    const content = tryExtract(json);
    if (!content || typeof content !== "string") {
      const keys = Object.keys(json ?? {});
      throw new Error(`MiniMax response did not contain text content. Keys: ${keys.join(", ")}`);
    }
    const stripThinking = (s: string): string => {
      let t = s.trim();
      // Remove <think>...</think> blocks if present
      const thinkOpen = t.indexOf("<think>");
      const thinkClose = t.indexOf("</think>");
      if (thinkOpen !== -1) {
        if (thinkClose !== -1) {
          t = (t.slice(0, thinkOpen) + t.slice(thinkClose + 8)).trim();
        } else {
          t = t.slice(thinkOpen + 7).trim();
        }
      }
      // Also remove lines starting with "Thinking:" prefix
      t = t
        .split("\n")
        .filter(line => !/^\s*Thinking:/i.test(line))
        .join("\n")
        .trim();
      return t;
    };

    const extractJson = (s: string): string | undefined => {
      // Try direct parse first; if it fails, extract from first '{' to last '}'
      const trimmed = s.trim();
      try {
        JSON.parse(trimmed);
        return trimmed;
      } catch {}

      const start = trimmed.indexOf("{");
      const end = trimmed.lastIndexOf("}");
      if (start === -1 || end === -1 || end <= start) return undefined;

      const candidate = trimmed.slice(start, end + 1);
      try {
        JSON.parse(candidate);
        return candidate;
      } catch {}

      // Fallback to balanced parsing from first '{'
      let depth = 0;
      let inString = false;
      let escaped = false;
      for (let i = start; i < trimmed.length; i++) {
        const ch = trimmed[i];
        if (inString) {
          if (!escaped && ch === '"') inString = false;
          escaped = !escaped && ch === '\\';
        } else {
          if (ch === '"') inString = true;
          else if (ch === '{') depth++;
          else if (ch === '}') {
            depth--;
            if (depth === 0) {
              const cand = trimmed.slice(start, i + 1);
              try {
                JSON.parse(cand);
                return cand;
              } catch {}
            }
          }
        }
      }
      return undefined;
    };

    const cleaned = stripThinking(content);
    const jsonCandidate = extractJson(cleaned);
    return (jsonCandidate ?? cleaned).trim();
  }
}
