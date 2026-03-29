import { NextResponse } from "next/server";
import { getRunById } from "@/lib/runStore";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const run = await getRunById(params.id);
    if (!run) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }
    return NextResponse.json(run);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Failed to load run" }, { status: 500 });
  }
}
