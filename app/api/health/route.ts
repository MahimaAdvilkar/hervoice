import { NextResponse } from "next/server";
import { MiniMaxClient } from "@/lib/minimax";

export async function GET() {
  const apiKey = process.env.MINIMAX_API_KEY ?? "";
  const groupId = process.env.MINIMAX_GROUP_ID ?? undefined;
  const baseUrl = process.env.MINIMAX_BASE_URL ?? "https://api.minimax.io/v1";
  const model = process.env.MINIMAX_MODEL ?? "MiniMax-M2.5";

  const env = {
    has_api_key: !!apiKey,
    api_key_masked: apiKey ? `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}` : null,
    has_group_id: !!groupId,
    base_url: baseUrl,
    model,
  };

  if (!apiKey) {
    return NextResponse.json({ status: "error", env, error: "Missing MINIMAX_API_KEY" }, { status: 400 });
  }

  try {
    const client = new MiniMaxClient({ apiKey, groupId, baseUrl, model });
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
