import { NextResponse } from "next/server";
import { createLLMClient, providerEnvStatus, resolveProvider } from "@/lib/llm";

export async function GET() {
  const env = providerEnvStatus();

  if (!env.has_api_key) {
    const provider = resolveProvider();
    const missingKey = provider === "claude" ? "ANTHROPIC_API_KEY" : "MINIMAX_API_KEY";
    return NextResponse.json({ status: "error", env, error: `Missing ${missingKey}` }, { status: 400 });
  }

  try {
    const client = createLLMClient();
    // Minimal ping test
    const reply = await client.chat([
      { role: "system", content: "You are a health check. Return only valid JSON." },
      { role: "user", content: "{\"ok\":true}" },
    ]);
    // Try JSON.parse; ignore content details
    try {
      JSON.parse(reply);
    } catch {
      // Even if content isn't JSON, reaching here means auth works; mark ok
    }
    return NextResponse.json({ status: "ok", env });
  } catch (error: any) {
    return NextResponse.json({ status: "error", env, error: error?.message ?? "Unknown error" }, { status: 500 });
  }
}
