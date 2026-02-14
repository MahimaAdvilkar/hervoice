import { Intake } from "./schemas";

export const SYSTEM_JSON_ONLY = `
You are an expert startup advisor focused on women entrepreneurship.
Return ONLY valid JSON. No markdown. No commentary. No extra keys.
If you are unsure, still return JSON that matches the schema exactly.
`;

export function visionPrompt(intake: Intake) {
  const schemaBlock = `Return JSON matching EXACTLY this schema:\n{\n  "problem_statement": "string",\n  "target_customer": "string",\n  "value_proposition": "string",\n  "unique_angle": "string",\n  "core_features": ["string"],\n  "risks": ["string"],\n  "assumptions": ["string"]\n}`;
  const context = {
    startup_idea: intake.idea,
    industry: intake.industry,
    stage: intake.stage,
    location: intake.region,
    target_customer: intake.targetCustomer,
    biggest_challenge: intake.challenge || intake.constraints || "",
  };
  const constraints = `\n\nCONSTRAINTS:\n- Keep it concise and actionable.\n- Women-entrepreneurship aware, but not preachy.`;
  return {
    system: SYSTEM_JSON_ONLY,
    user: `${schemaBlock}\n\nCONTEXT:\n${JSON.stringify(context)}${constraints}`,
  };
}

export function fundingPrompt(intake: Intake) {
  const schemaBlock = `Return JSON matching EXACTLY this schema:\n{\n  "recommended_funding_path": "string",\n  "top_3_next_steps": ["string"],\n  "grants_and_programs": ["string"],\n  "accelerator_types": ["string"],\n  "bootstrap_strategy": "string",\n  "pitch_focus": ["string"],\n  "risks_and_mitigations": ["string"]\n}`;
  const context = { intake };
  const constraints = `\n\nCONSTRAINTS:\n- Do NOT invent specific grant names with fake URLs.\n- Suggest categories and examples like: “women founder accelerators”, “state small business grants”, “university incubators”, “impact funds”.\n- Make it realistic for the stage.`;
  return {
    system: SYSTEM_JSON_ONLY,
    user: `${schemaBlock}\n\nCONTEXT:\n${JSON.stringify(context)}${constraints}`,
  };
}

export function gtmPrompt(intake: Intake) {
  const schemaBlock = `Return JSON matching EXACTLY this schema:\n{\n  "positioning_statement": "string",\n  "ideal_early_adopters": ["string"],\n  "validation_experiments": ["string"],\n  "first_10_customers_plan": ["string"],\n  "channels": ["string"],\n  "partnership_ideas": ["string"],\n  "success_metrics": ["string"]\n}`;
  const context = { intake };
  const constraints = `\n\nCONSTRAINTS:\n- Make steps concrete and testable within 2 weeks.\n- Prefer community + partnerships + low-cost channels.`;
  return {
    system: SYSTEM_JSON_ONLY,
    user: `${schemaBlock}\n\nCONTEXT:\n${JSON.stringify(context)}${constraints}`,
  };
}

export function roadmapPrompt(intake: Intake) {
  const schemaBlock = `Return JSON matching EXACTLY this schema:\n{\n  "day_30": ["string"],\n  "day_60": ["string"],\n  "day_90": ["string"],\n  "milestones": ["string"],\n  "metrics_to_track": ["string"]\n}`;
  const context = { intake };
  const constraints = `\n\nCONSTRAINTS:\n- Each list should be 4-7 items max.\n- Make it realistic for a small team.`;
  return {
    system: SYSTEM_JSON_ONLY,
    user: `${schemaBlock}\n\nCONTEXT:\n${JSON.stringify(context)}${constraints}`,
  };
}

export function pitchPrompt(intake: Intake) {
  const schemaBlock = `Return JSON matching EXACTLY this schema:\n{\n  "one_sentence_vision": "string",\n  "elevator_pitch": "string",\n  "slides": [\n    { "title": "string", "bullets": ["string"] }\n  ],\n  "demo_script_30s": ["string"]\n}`;
  const context = { intake };
  const constraints = `\n\nCONSTRAINTS:\n- Slides must be 8 slides total:\n  1) Problem\n  2) Solution\n  3) Why Now\n  4) Market\n  5) Product\n  6) Go-To-Market\n  7) Business Model\n  8) Ask / Next Steps\n- Each slide 3-5 bullets.`;
  return {
    system: SYSTEM_JSON_ONLY,
    user: `${schemaBlock}\n\nCONTEXT:\n${JSON.stringify(context)}${constraints}`,
  };
}

export function fixJsonPrompt(badText: string, schemaHint?: string) {
  const header = `The previous output was NOT valid JSON or didn't match the required schema.`;
  const schemaLine = schemaHint ? `\n\nReturn ONLY corrected valid JSON that matches EXACTLY this schema:\n${schemaHint}` : `\n\nReturn ONLY corrected valid JSON that matches the expected schema.`;
  const body = `\n\nBad output:\n${badText}`;
  return `${header}${schemaLine}${body}`;
}
