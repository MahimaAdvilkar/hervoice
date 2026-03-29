import { NextResponse } from "next/server";
import PptxGenJS from "pptxgenjs";
import { FinalResponseSchema } from "@/lib/schemas";

export const runtime = "nodejs"; // force Node runtime for server-only libs

type TxtOpts = Partial<{
  x: number; y: number; w: number; h: number; fontSize: number; bold: boolean; color: string; bullet: boolean;
}>;

function addTitle(slide: any, text: string, opts?: TxtOpts) {
  slide.addText(text, { x: 0.6, y: 0.6, w: 9, fontSize: 32, bold: true, color: "#222", ...(opts || {}) });
}

function addBullets(slide: any, title: string, bullets: string[], opts?: TxtOpts) {
  slide.addText(title, { x: 0.6, y: 1.3, w: 9, fontSize: 20, bold: true, color: "#7c4dff" });
  const list = (bullets || []).slice(0, 8);
  slide.addText(list.map(b => `• ${b}`).join("\n"), { x: 0.9, y: 1.9, w: 8.4, fontSize: 18, color: "#333", ...(opts || {}) });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const title = body?.title ?? "SheLaunch Pitch";
  const final = body?.final;
  const intake = body?.intake ?? {};

  const pptx = new PptxGenJS();

  // Define a simple branded slide master with accent bars and footer
  const brandAccent = "#7c4dff";
  const footerText = `SheLaunch • Stage: ${intake?.stage ?? "Ideation"}`;
  pptx.defineSlideMaster({
    title: "SHELAUNCH_MASTER",
    background: { color: "#ffffff" },
    objects: [
      { rect: { x: 0, y: 0, w: '100%', h: 0.35, fill: brandAccent } },
      { rect: { x: 0, y: 6.8, w: '100%', h: 0.35, fill: "#f3f4f7" } },
      { text: { text: footerText, options: { x: 0.5, y: 6.85, w: 9, h: 0.3, fontSize: 12, color: "#666" } } },
    ],
    slideNumber: { x: 10.0, y: 6.9, color: brandAccent, fontSize: 12 },
  });

  // Cover
  {
    const slide = pptx.addSlide({ masterName: "SHELAUNCH_MASTER" });
    addTitle(slide, title);
    const vision = final?.pitch_deck?.one_sentence_vision ?? "Agentic startup copilot";
    const elevator = final?.pitch_deck?.elevator_pitch ?? "Generate structured plans fast";
    slide.addText(`Vision: ${vision}`, { x: 0.6, y: 1.4, w: 9, fontSize: 18 });
    slide.addText("Elevator:", { x: 0.6, y: 2.0, w: 9, fontSize: 18, bold: true });
    slide.addText(elevator, { x: 0.6, y: 2.5, w: 9, fontSize: 16 });
  }

  // Blueprint
  if (final?.blueprint) {
    const s1 = pptx.addSlide({ masterName: "SHELAUNCH_MASTER" });
    addTitle(s1, "Founder Blueprint");
    s1.addText(`Problem: ${final.blueprint.problem_statement}`, { x: 0.6, y: 1.3, w: 9, fontSize: 18 });
    s1.addText(`Target: ${final.blueprint.target_customer}`, { x: 0.6, y: 1.9, w: 9, fontSize: 18 });
    s1.addText(`Value: ${final.blueprint.value_proposition}`, { x: 0.6, y: 2.5, w: 9, fontSize: 18 });
    s1.addText(`Angle: ${final.blueprint.unique_angle}`, { x: 0.6, y: 3.1, w: 9, fontSize: 18 });
    const s2 = pptx.addSlide({ masterName: "SHELAUNCH_MASTER" });
    addTitle(s2, "Blueprint — Details");
    addBullets(s2, "Core Features", final.blueprint.core_features);
    addBullets(s2, "Risks", final.blueprint.risks, { y: 3.9 });
  }

  // Funding
  if (final?.funding) {
    const s1 = pptx.addSlide({ masterName: "SHELAUNCH_MASTER" });
    addTitle(s1, "Funding Strategy");
    s1.addText(`Recommended: ${final.funding.recommended_funding_path}`, { x: 0.6, y: 1.3, w: 9, fontSize: 18 });
    addBullets(s1, "Top 3 Next Steps", final.funding.top_3_next_steps, { y: 2.1 });
    const s2 = pptx.addSlide({ masterName: "SHELAUNCH_MASTER" });
    addTitle(s2, "Funding — Programs & Risks");
    addBullets(s2, "Grants & Programs", final.funding.grants_and_programs);
    addBullets(s2, "Risks & Mitigations", final.funding.risks_and_mitigations, { y: 3.9 });
  }

  // GTM
  if (final?.gtm) {
    const s1 = pptx.addSlide({ masterName: "SHELAUNCH_MASTER" });
    addTitle(s1, "Go-To-Market");
    s1.addText(`Positioning: ${final.gtm.positioning_statement}`, { x: 0.6, y: 1.3, w: 9, fontSize: 18 });
    addBullets(s1, "Ideal Early Adopters", final.gtm.ideal_early_adopters, { y: 2.1 });
    const s2 = pptx.addSlide({ masterName: "SHELAUNCH_MASTER" });
    addTitle(s2, "GTM — Plan");
    addBullets(s2, "Validation Experiments", final.gtm.validation_experiments);
    addBullets(s2, "First 10 Customers", final.gtm.first_10_customers_plan, { y: 3.9 });
    const s3 = pptx.addSlide({ masterName: "SHELAUNCH_MASTER" });
    addTitle(s3, "GTM — Channels & Partnerships");
    addBullets(s3, "Channels", final.gtm.channels);
    addBullets(s3, "Partnership Ideas", final.gtm.partnership_ideas, { y: 3.9 });
  }

  // Roadmap
  if (final?.roadmap) {
    const s1 = pptx.addSlide({ masterName: "SHELAUNCH_MASTER" });
    addTitle(s1, "30 / 60 / 90");
    addBullets(s1, "30 Days", final.roadmap.day_30);
    addBullets(s1, "60 Days", final.roadmap.day_60, { y: 3.9 });
    const s2 = pptx.addSlide({ masterName: "SHELAUNCH_MASTER" });
    addTitle(s2, "Roadmap — Milestones & Metrics");
    addBullets(s2, "Milestones", final.roadmap.milestones);
    addBullets(s2, "Metrics to Track", final.roadmap.metrics_to_track, { y: 3.9 });
  }

  // Pitch Deck (8 slides)
  const deckSlides = final?.pitch_deck?.slides || [];
  deckSlides.forEach((s: any, idx: number) => {
    const slide = pptx.addSlide({ masterName: "SHELAUNCH_MASTER" });
    addTitle(slide, `${idx + 1}. ${s.title}`);
    addBullets(slide, "", s.bullets);
  });

  // Optional demo script
  if (final?.pitch_deck?.demo_script_30s?.length) {
    const slide = pptx.addSlide({ masterName: "SHELAUNCH_MASTER" });
    addTitle(slide, "30s Demo Script");
    addBullets(slide, "", final.pitch_deck.demo_script_30s);
  }

  // Validate shape lightly to name the file
  const parsed = FinalResponseSchema.safeParse(final);
  const filenameBase = parsed.success ? "SheLaunch-Deck" : "deck";

  const buffer = await pptx.write({ outputType: "nodebuffer" });

  return new NextResponse(buffer as any, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "Content-Disposition": `attachment; filename="${filenameBase}.pptx"`,
    },
  });
}
