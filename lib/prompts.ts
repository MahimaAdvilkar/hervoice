import { Intake } from "./schemas";

export const SYSTEM_JSON_ONLY = `
You are an expert startup advisor focused on women entrepreneurship.
Return ONLY valid JSON. No markdown. No commentary. No extra keys.
If you are unsure, still return JSON that matches the schema exactly.
`;

// Stage-aware instruction blocks
// Injected into every prompt so the LLM cannot ignore the founder's stage.

function stageGuide(stage: string): string {
  switch (stage) {
    case "ideation":
      return [
        "STAGE: IDEATION -- The founder has NO product yet. Everything is a hypothesis.",
        "RULES FOR THIS STAGE:",
        "- Problem statement must frame it as a hypothesis to be validated, not a confirmed fact.",
        "- Core features: max 2-3 truly essential MVP features only -- no feature creep.",
        "- Assumptions list must be long and explicit (at least 4-5 items) -- nothing is validated yet.",
        '- Risks must include "Problem may not be painful enough to pay for" and "Target customer segment may not exist at scale".',
        "- Do NOT suggest building anything extensive until the problem is validated.",
      ].join("\n");

    case "prototype":
      return [
        "STAGE: PROTOTYPE -- The founder has an early product or working mockup but no real users yet.",
        "RULES FOR THIS STAGE:",
        "- Problem statement should be grounded -- they have built something, so they have some conviction.",
        "- Core features should reflect what they have already built plus 1-2 critical gaps to close.",
        "- Assumptions should be partially validated -- distinguish confirmed vs still assumed.",
        '- Risks include "Users may not convert from free to paid" and "Prototype may not match real workflow".',
        "- Focus is on getting the prototype in front of 5-10 real users, not scaling.",
      ].join("\n");

    case "beta":
      return [
        "STAGE: BETA -- The founder has real users giving feedback. Some things are working, some are not.",
        "RULES FOR THIS STAGE:",
        "- Problem statement should be validated and specific -- cite the user pain they have confirmed.",
        "- Core features should reflect what users actually use, not what was originally planned.",
        "- Assumptions list should be short -- most are validated. Focus on growth-stage unknowns.",
        "- Risks are now about retention, churn, and product-market fit signals, not validation.",
        "- The founder should be thinking about first paid conversion, not discovery calls.",
      ].join("\n");

    case "launched":
      return [
        "STAGE: LAUNCHED -- The founder has paying customers and real traction.",
        "RULES FOR THIS STAGE:",
        "- Problem statement is proven -- frame it around the scale of the proven pain and market opportunity.",
        "- Core features should focus on what drives retention and differentiation at scale.",
        "- Assumptions list is minimal -- focus on scaling assumptions: unit economics, CAC, LTV.",
        "- Risks are about competition, burn rate, team gaps, and scaling bottlenecks.",
        "- The founder should be thinking about repeatable growth, not experimentation.",
      ].join("\n");

    default:
      return "";
  }
}

function stageFundingGuide(stage: string): string {
  switch (stage) {
    case "ideation":
      return [
        "FUNDING STAGE RULES -- IDEATION:",
        "- recommended_funding_path: Bootstrap + competitions + grants ONLY. Do NOT suggest VC.",
        "- top_3_next_steps: Must be validation-first (customer interviews, landing page test, waitlist) -- not fundraising yet.",
        "- accelerator_types: Only ideation-friendly programs (Antler, On Deck, founder residencies). No growth-stage accelerators.",
        "- bootstrap_strategy: Must be specific to zero-revenue, zero-product stage (consulting, services, keeping day job).",
        "- Do NOT mention Series A, seed rounds, or investor pitch decks -- this stage is too early.",
      ].join("\n");

    case "prototype":
      return [
        "FUNDING STAGE RULES -- PROTOTYPE:",
        "- recommended_funding_path: Friends and family, micro-angels, women-focused accelerators, small grants.",
        "- top_3_next_steps: Mix of getting first users AND funding outreach -- not just one.",
        "- accelerator_types: YC, Techstars, women-focused accelerators are appropriate here.",
        "- bootstrap_strategy: Keep burn low while building -- consulting, part-time work, no-code tools.",
        "- Seed rounds are possible but only if there is a clear prototype plus early user signal.",
      ].join("\n");

    case "beta":
      return [
        "FUNDING STAGE RULES -- BETA:",
        "- recommended_funding_path: Seed round ($250K-$1.5M) or angel syndicate. Traction is required to pitch credibly.",
        '- top_3_next_steps: Should include "prepare traction metrics for investor deck" and "get 2 design partner LOIs".',
        "- accelerator_types: Top accelerators (YC, Techstars) and sector-specific programs.",
        "- bootstrap_strategy: Revenue from beta users -- even $500/mo MRR strengthens the story.",
        "- Pitch deck focus: Lead with beta metrics, retention, and user quotes -- not just the problem.",
      ].join("\n");

    case "launched":
      return [
        "FUNDING STAGE RULES -- LAUNCHED:",
        "- recommended_funding_path: Series A or revenue-based financing if profitable. Strategic investors and corporate VCs are relevant.",
        '- top_3_next_steps: Should include "build investor pipeline", "prepare Series A deck with unit economics", "hire fractional CFO".',
        "- bootstrap_strategy: Focus on reinvesting revenue and optimizing CAC/LTV ratio.",
        "- Pitch deck focus: Lead with revenue growth, NRR, payback period, and market expansion plan.",
        "- Do NOT suggest ideation-stage activities like customer discovery -- this is a scaling business.",
      ].join("\n");

    default:
      return "";
  }
}

function stageGTMGuide(stage: string): string {
  switch (stage) {
    case "ideation":
      return [
        "GTM STAGE RULES -- IDEATION:",
        "- validation_experiments: MUST be hypothesis-testing experiments -- fake door tests, landing pages, cold outreach with mockups. No Product Hunt launch yet.",
        '- first_10_customers_plan: Frame as "first 10 people who will give me 30 minutes for an interview" -- not paying customers yet.',
        "- channels: Only zero-cost channels -- personal network, founder communities, LinkedIn, cold email.",
        "- success_metrics: Validation metrics ONLY -- interview completion rate, waitlist signups, reply rate. NOT revenue.",
        "- Do NOT suggest paid ads, sales teams, or growth hacking at this stage.",
      ].join("\n");

    case "prototype":
      return [
        "GTM STAGE RULES -- PROTOTYPE:",
        "- validation_experiments: Focus on getting the prototype in front of real users -- invite-only access, design partner outreach.",
        "- first_10_customers_plan: These should be design partners who give feedback in exchange for free or discounted access.",
        "- channels: Community-led, direct outreach, founder networks, relevant online communities.",
        "- success_metrics: Product engagement metrics -- DAU, session length, feature usage, NPS from early users.",
      ].join("\n");

    case "beta":
      return [
        "GTM STAGE RULES -- BETA:",
        "- validation_experiments: Conversion experiments -- pricing tests, onboarding funnel optimization, referral mechanics.",
        "- first_10_customers_plan: Focus on converting beta users to paying -- specific pricing tiers, upgrade triggers.",
        "- channels: Add referral/word-of-mouth, content marketing, partnerships -- still no heavy paid spend.",
        "- success_metrics: Retention, churn rate, MRR, conversion rate from free to paid.",
        "- Do NOT list customer discovery interviews -- that phase is over.",
      ].join("\n");

    case "launched":
      return [
        "GTM STAGE RULES -- LAUNCHED:",
        "- validation_experiments: Growth experiments -- new channel tests, expansion into adjacent segments, upsell campaigns.",
        '- first_10_customers_plan: Reframe as "next 100 customers plan" -- scalable acquisition, not one-by-one outreach.',
        "- channels: Mix of organic (that is already working) plus selective paid channels if CAC is justified. Partner channels.",
        "- success_metrics: CAC, LTV, NRR, payback period, logo retention -- business-level metrics.",
      ].join("\n");

    default:
      return "";
  }
}

function stageRoadmapGuide(stage: string): string {
  switch (stage) {
    case "ideation":
      return [
        "ROADMAP STAGE RULES -- IDEATION:",
        '- day_30: MUST be entirely about customer discovery -- "Run 10 problem interviews", "Set up landing page + waitlist", "Define 3 riskiest assumptions to test". NO product building in day 0-30.',
        "- day_60: First lightweight prototype or mockup based on what you learned. Still no full product.",
        "- day_90: Prototype in front of 5 target users. First feedback collected. Go/no-go decision on the idea.",
        '- milestones: "10 problem interviews completed", "3 riskiest assumptions tested", "Prototype built", "First user feedback received".',
        "- metrics_to_track: Interview completion rate, assumption validation rate, waitlist signups -- NOT revenue.",
      ].join("\n");

    case "prototype":
      return [
        "ROADMAP STAGE RULES -- PROTOTYPE:",
        "- day_30: Ship prototype to 5 real users. Collect structured feedback. Fix the top 3 bugs or friction points.",
        "- day_60: Iterate based on feedback. Get to 15-20 users. Start identifying who your best users are.",
        "- day_90: Clear product-market fit signal OR pivot decision. First paid experiment.",
        '- milestones: "5 users onboarded", "Feedback collected from all users", "PMF signal or pivot decision made".',
        "- metrics_to_track: User engagement rate, qualitative NPS, top requested features, retention after week 1.",
      ].join("\n");

    case "beta":
      return [
        "ROADMAP STAGE RULES -- BETA:",
        "- day_30: Fix top 3 retention or churn issues identified from beta data. Convert 1-2 beta users to paid.",
        "- day_60: Reach $1K-$5K MRR. Streamline onboarding. Build referral mechanism.",
        "- day_90: $5K-$10K MRR or clear path to it. One repeatable acquisition channel proven.",
        '- milestones: "First paid customer", "$1K MRR", "Referral loop active", "Onboarding time under 10 min".',
        "- metrics_to_track: MRR, churn rate, activation rate, NPS, CAC from primary channel.",
      ].join("\n");

    case "launched":
      return [
        "ROADMAP STAGE RULES -- LAUNCHED:",
        "- day_30: Double down on the acquisition channel with best ROI. Hire or contract 1 growth resource.",
        "- day_60: Expand to adjacent customer segment or geography. Optimize pricing.",
        "- day_90: Hit growth milestone (e.g. 2x MRR, 500 customers). Prepare fundraise if applicable.",
        '- milestones: "Repeatable acquisition channel proven", "First enterprise or larger contract", "Team hire made".',
        "- metrics_to_track: MRR growth rate, CAC, LTV:CAC ratio, NRR, payback period.",
      ].join("\n");

    default:
      return "";
  }
}

function stagePitchGuide(stage: string): string {
  switch (stage) {
    case "ideation":
      return [
        "PITCH STAGE RULES -- IDEATION:",
        '- The "Ask / Next Steps" slide must ask for: design partners (not money yet), introductions to target customers, or small angel checks ($25K-$100K pre-seed).',
        '- The "Product" slide should show a mockup or wireframe -- NOT a built product. Be honest: state it is the planned MVP.',
        '- The "Market" slide should emphasize the size of the problem and founder credibility -- not traction metrics (there are none).',
        "- Elevator pitch must mention that the founder is seeking validation partners, not scaling.",
        "- Tone: conviction on the problem, humility on the solution.",
      ].join("\n");

    case "prototype":
      return [
        "PITCH STAGE RULES -- PROTOTYPE:",
        '- The "Product" slide should show the actual prototype with 1-2 real user reactions or early quotes.',
        '- The "Ask" slide: Seeking seed funding ($100K-$500K) OR accelerator program OR 5 design partners.',
        "- Include at least one user insight or early signal in the deck -- even informal feedback counts.",
        "- Elevator pitch must mention the prototype and the early signal.",
      ].join("\n");

    case "beta":
      return [
        "PITCH STAGE RULES -- BETA:",
        '- The deck MUST include a Traction slide showing real beta metrics: active users, retention rate, NPS, any MRR.',
        '- The "Ask" slide: Seeking seed round ($500K-$2M) to reach $10K MRR and hire first 2 roles.',
        "- Include 1-2 direct user quotes as social proof.",
        '- Elevator pitch must lead with traction: state actual user count, retention, and NPS.',
      ].join("\n");

    case "launched":
      return [
        "PITCH STAGE RULES -- LAUNCHED:",
        '- The Traction slide must show: MRR, growth rate (MoM), churn rate, LTV:CAC, payback period.',
        '- The "Ask" slide: Series A ($2M-$10M) with specific use of funds tied to growth milestones.',
        '- The "Business Model" slide must show unit economics -- not just pricing tiers.',
        "- Elevator pitch must lead with revenue and growth rate numbers.",
      ].join("\n");

    default:
      return "";
  }
}

export function visionPrompt(intake: Intake) {
  const schemaBlock = `Return JSON matching EXACTLY this schema:
{
  "problem_statement": "string",
  "target_customer": "string",
  "value_proposition": "string",
  "unique_angle": "string",
  "core_features": ["string"],
  "risks": ["string"],
  "assumptions": ["string"]
}`;
  const context = {
    startup_idea: intake.idea,
    industry: intake.industry,
    stage: intake.stage,
    location: intake.region,
    target_customer: intake.targetCustomer,
    goals: intake.goals || "",
    constraints: intake.constraints || "",
    biggest_challenge: intake.challenge || "",
  };
  return {
    system: SYSTEM_JSON_ONLY,
    user: [
      schemaBlock,
      "",
      "FOUNDER CONTEXT:",
      JSON.stringify(context, null, 2),
      "",
      stageGuide(intake.stage),
      "",
      "ADDITIONAL RULES:",
      "- Women-entrepreneurship aware, but not preachy.",
      "- Be specific to THIS idea, industry, and region -- not generic startup advice.",
    ].join("\n"),
  };
}

export function fundingPrompt(intake: Intake) {
  const schemaBlock = `Return JSON matching EXACTLY this schema:
{
  "recommended_funding_path": "string",
  "top_3_next_steps": ["string"],
  "grants_and_programs": ["string"],
  "accelerator_types": ["string"],
  "bootstrap_strategy": "string",
  "pitch_focus": ["string"],
  "risks_and_mitigations": ["string"]
}`;
  const context = {
    startup_idea: intake.idea,
    industry: intake.industry,
    stage: intake.stage,
    region: intake.region,
    target_customer: intake.targetCustomer,
    goals: intake.goals || "",
    constraints: intake.constraints || "",
  };
  return {
    system: SYSTEM_JSON_ONLY,
    user: [
      schemaBlock,
      "",
      "FOUNDER CONTEXT:",
      JSON.stringify(context, null, 2),
      "",
      stageFundingGuide(intake.stage),
      "",
      "ADDITIONAL RULES:",
      "- Do NOT invent specific grant names with fake URLs.",
      "- Suggest real categories: women founder accelerators, state small business grants, university incubators.",
      `- All advice must be realistic for the founder's region (${intake.region}) and stage (${intake.stage}).`,
    ].join("\n"),
  };
}

export function gtmPrompt(intake: Intake) {
  const schemaBlock = `Return JSON matching EXACTLY this schema:
{
  "positioning_statement": "string",
  "ideal_early_adopters": ["string"],
  "validation_experiments": ["string"],
  "first_10_customers_plan": ["string"],
  "channels": ["string"],
  "partnership_ideas": ["string"],
  "success_metrics": ["string"]
}`;
  const context = {
    startup_idea: intake.idea,
    industry: intake.industry,
    stage: intake.stage,
    region: intake.region,
    target_customer: intake.targetCustomer,
    goals: intake.goals || "",
    constraints: intake.constraints || "",
  };
  return {
    system: SYSTEM_JSON_ONLY,
    user: [
      schemaBlock,
      "",
      "FOUNDER CONTEXT:",
      JSON.stringify(context, null, 2),
      "",
      stageGTMGuide(intake.stage),
      "",
      "ADDITIONAL RULES:",
      `- Positioning statement must be specific to ${intake.industry} in ${intake.region} -- not generic.`,
      `- Channels must be realistic for ${intake.stage} stage -- match budget and team size implied by constraints.`,
    ].join("\n"),
  };
}

export function roadmapPrompt(intake: Intake) {
  const schemaBlock = `Return JSON matching EXACTLY this schema:
{
  "day_30": ["string"],
  "day_60": ["string"],
  "day_90": ["string"],
  "milestones": ["string"],
  "metrics_to_track": ["string"]
}`;
  const context = {
    startup_idea: intake.idea,
    industry: intake.industry,
    stage: intake.stage,
    region: intake.region,
    target_customer: intake.targetCustomer,
    goals: intake.goals || "",
    constraints: intake.constraints || "",
    biggest_challenge: intake.challenge || "",
  };
  return {
    system: SYSTEM_JSON_ONLY,
    user: [
      schemaBlock,
      "",
      "FOUNDER CONTEXT:",
      JSON.stringify(context, null, 2),
      "",
      stageRoadmapGuide(intake.stage),
      "",
      "ADDITIONAL RULES:",
      "- Each phase must build on the previous -- day_60 assumes day_30 was completed.",
      "- Each list: 4-7 items. Tasks must have a concrete verb (build, run, ship, interview, measure, convert).",
      `- Adjust for constraints: "${intake.constraints || "none specified"}". Do not suggest hiring if they are solo with no budget.`,
    ].join("\n"),
  };
}

export function pitchPrompt(intake: Intake) {
  const schemaBlock = `Return JSON matching EXACTLY this schema:
{
  "one_sentence_vision": "string",
  "elevator_pitch": "string",
  "slides": [
    { "title": "string", "bullets": ["string"] }
  ],
  "demo_script_30s": ["string"]
}`;
  const context = {
    startup_idea: intake.idea,
    industry: intake.industry,
    stage: intake.stage,
    region: intake.region,
    target_customer: intake.targetCustomer,
    goals: intake.goals || "",
    constraints: intake.constraints || "",
  };
  return {
    system: SYSTEM_JSON_ONLY,
    user: [
      schemaBlock,
      "",
      "FOUNDER CONTEXT:",
      JSON.stringify(context, null, 2),
      "",
      stagePitchGuide(intake.stage),
      "",
      "SLIDE STRUCTURE -- must be exactly 8 slides:",
      "  1) Problem",
      "  2) Solution",
      "  3) Why Now",
      "  4) Market",
      "  5) Product",
      "  6) Go-To-Market",
      "  7) Business Model",
      "  8) Ask / Next Steps",
      "",
      "RULES:",
      "- Each slide: 3-5 bullets. First bullet = the single most important point for that slide.",
      "- Bullets must be specific to THIS idea, region, and stage -- not boilerplate startup advice.",
      `- Elevator pitch must honestly reflect the stage (${intake.stage}) -- do not overclaim.`,
    ].join("\n"),
  };
}

export function refinePrompt(
  section: "blueprint" | "funding" | "gtm" | "roadmap" | "pitch",
  intake: Intake,
  currentOutput: object,
  feedback: string,
) {
  const schemaMap: Record<string, string> = {
    blueprint: `{"problem_statement":"string","target_customer":"string","value_proposition":"string","unique_angle":"string","core_features":["string"],"risks":["string"],"assumptions":["string"]}`,
    funding: `{"recommended_funding_path":"string","top_3_next_steps":["string"],"grants_and_programs":["string"],"accelerator_types":["string"],"bootstrap_strategy":"string","pitch_focus":["string"],"risks_and_mitigations":["string"]}`,
    gtm: `{"positioning_statement":"string","ideal_early_adopters":["string"],"validation_experiments":["string"],"first_10_customers_plan":["string"],"channels":["string"],"partnership_ideas":["string"],"success_metrics":["string"]}`,
    roadmap: `{"day_30":["string"],"day_60":["string"],"day_90":["string"],"milestones":["string"],"metrics_to_track":["string"]}`,
    pitch: `{"one_sentence_vision":"string","elevator_pitch":"string","slides":[{"title":"string","bullets":["string"]}],"demo_script_30s":["string"]}`,
  };
  return {
    system: SYSTEM_JSON_ONLY,
    user: [
      `You are regenerating the ${section} section of a startup plan based on founder feedback.`,
      "",
      "FOUNDER CONTEXT:",
      JSON.stringify(intake, null, 2),
      "",
      "CURRENT OUTPUT (the version to improve):",
      JSON.stringify(currentOutput, null, 2),
      "",
      "FOUNDER FEEDBACK:",
      `"${feedback}"`,
      "",
      `Regenerate the ${section} section incorporating the feedback above. Keep what was good; improve or replace what the founder flagged.`,
      "Return ONLY valid JSON matching EXACTLY this schema:",
      schemaMap[section],
    ].join("\n"),
  };
}

export function competitorPrompt(intake: Intake) {
  const schema = `{
  "direct_competitors": [
    {
      "name": "string",
      "description": "string",
      "target_market": "string",
      "your_edge_over_them": "string",
      "their_edge_over_you": "string"
    }
  ],
  "indirect_competitors": [
    {
      "name": "string",
      "description": "string",
      "target_market": "string",
      "your_edge_over_them": "string",
      "their_edge_over_you": "string"
    }
  ],
  "whitespace_opportunity": "string",
  "competitive_moat": "string",
  "watch_out_for": ["string"]
}`;
  return {
    system: "You are a competitive intelligence analyst. Return ONLY valid JSON -- no markdown, no commentary.",
    user: [
      "Analyze the competitive landscape for this startup idea and return a structured analysis.",
      "",
      `STARTUP IDEA: ${intake.idea}`,
      `INDUSTRY: ${intake.industry}`,
      `STAGE: ${intake.stage}`,
      `REGION: ${intake.region}`,
      `TARGET CUSTOMER: ${intake.targetCustomer}`,
      "",
      "Instructions:",
      "- direct_competitors: 3-4 real companies that solve the same problem for the same customer",
      "- indirect_competitors: 2-3 companies that solve it differently or partially",
      "- For each competitor, be specific about their actual edge vs this founder's edge",
      "- whitespace_opportunity: the specific market gap this founder can own",
      "- competitive_moat: 1-2 durable advantages this founder can build",
      "- watch_out_for: 3-4 concrete competitive risks (e.g. big players pivoting, pricing pressure)",
      "",
      "Return ONLY valid JSON matching EXACTLY:",
      schema,
    ].join("\n"),
  };
}

export function fixJsonPrompt(badText: string, schemaHint?: string) {
  const header = "The previous output was NOT valid JSON or did not match the required schema.";
  const schemaLine = schemaHint
    ? `\n\nReturn ONLY corrected valid JSON that matches EXACTLY this schema:\n${schemaHint}`
    : "\n\nReturn ONLY corrected valid JSON that matches the expected schema.";
  const body = `\n\nBad output:\n${badText}`;
  return `${header}${schemaLine}${body}`;
}
