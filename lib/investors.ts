import type { InvestorMatch } from "@/lib/schemas";

// ── Investor database ─────────────────────────────────────────────────────────
// Each entry tagged with regions, stages, and industries for matching.
// regions: ISO country codes or broad geo labels ("global", "us", "europe", "india", "latam", "apac", "africa", "mena")
// stages: subset of ["ideation", "prototype", "beta", "launched"]
// industries: broad categories — "general" means any

interface InvestorEntry {
  name: string;
  type: "vc" | "accelerator" | "grant" | "angel_network" | "government";
  focus: string;
  check_range: string;
  regions: string[];
  stages: string[];
  industries: string[];
  apply_info: string;
  women_focused: boolean;
}

const DB: InvestorEntry[] = [
  // ── Women-focused (global) ──────────────────────────────────────────────────
  {
    name: "Coralus (formerly SheEO)",
    type: "grant",
    focus: "Radical generosity funding for women & non-binary founders",
    check_range: "$10K–$100K (0% interest loan)",
    regions: ["global"],
    stages: ["prototype", "beta", "launched"],
    industries: ["general"],
    apply_info: "Annual application at coralus.world — cohort-based, community-driven",
    women_focused: true,
  },
  {
    name: "Cartier Women's Initiative",
    type: "grant",
    focus: "Impact-driven women entrepreneurs with scalable ventures",
    check_range: "$30K–$100K grant",
    regions: ["global"],
    stages: ["beta", "launched"],
    industries: ["general"],
    apply_info: "Annual application at cartierwomensinitiative.com — 8 regional awards",
    women_focused: true,
  },
  {
    name: "She Loves Tech",
    type: "accelerator",
    focus: "Women-led tech startups — world's largest women+tech competition",
    check_range: "$1M investment prize (winners)",
    regions: ["global"],
    stages: ["prototype", "beta", "launched"],
    industries: ["tech", "health", "education", "sustainability"],
    apply_info: "Annual competition at shelovestech.com — apply through local partners",
    women_focused: true,
  },
  {
    name: "Female Founders Fund",
    type: "vc",
    focus: "Pre-seed/seed consumer internet led by women",
    check_range: "$250K–$1M",
    regions: ["us"],
    stages: ["prototype", "beta"],
    industries: ["consumer", "tech", "saas"],
    apply_info: "Warm intro or apply at femalefoundersfund.com",
    women_focused: true,
  },
  {
    name: "Golden Seeds",
    type: "angel_network",
    focus: "Early-stage women-led companies — one of the most active angel networks",
    check_range: "$100K–$2M",
    regions: ["us"],
    stages: ["prototype", "beta", "launched"],
    industries: ["general"],
    apply_info: "Apply at goldenseeds.com/apply — quarterly screening",
    women_focused: true,
  },
  {
    name: "Astia Angels",
    type: "angel_network",
    focus: "Ventures with women in senior leadership roles",
    check_range: "$50K–$500K",
    regions: ["us", "europe"],
    stages: ["prototype", "beta"],
    industries: ["tech", "health", "saas"],
    apply_info: "Apply at astia.org — pitching events 4x/year",
    women_focused: true,
  },
  {
    name: "IFundWomen",
    type: "grant",
    focus: "Grants + coaching for women entrepreneurs",
    check_range: "$1K–$50K (grants)",
    regions: ["us"],
    stages: ["ideation", "prototype", "beta"],
    industries: ["general"],
    apply_info: "Apply at ifundwomen.com — brand partnership grants + coaching",
    women_focused: true,
  },
  {
    name: "Springboard Enterprises",
    type: "accelerator",
    focus: "Women-led tech + life sciences growth-stage companies",
    check_range: "$500K–$5M (introductions)",
    regions: ["us"],
    stages: ["beta", "launched"],
    industries: ["tech", "health", "saas"],
    apply_info: "Apply at sb.co — cohort-based, highly selective",
    women_focused: true,
  },
  {
    name: "Pipeline Angels",
    type: "angel_network",
    focus: "Women and non-binary femme social entrepreneurs",
    check_range: "$25K–$100K",
    regions: ["us"],
    stages: ["ideation", "prototype"],
    industries: ["general"],
    apply_info: "Apply at pipelineangels.com — pitch summits twice/year",
    women_focused: true,
  },
  {
    name: "GingerBread Capital",
    type: "vc",
    focus: "Women-led consumer and brand businesses in UK/Europe",
    check_range: "£100K–£500K",
    regions: ["europe", "uk"],
    stages: ["beta", "launched"],
    industries: ["consumer", "retail"],
    apply_info: "Apply at gingerbreadcapital.com — rolling applications",
    women_focused: true,
  },

  // ── Global accelerators ─────────────────────────────────────────────────────
  {
    name: "Y Combinator",
    type: "accelerator",
    focus: "Best startup program in the world — any sector",
    check_range: "$500K for 7%",
    regions: ["global"],
    stages: ["prototype", "beta"],
    industries: ["general"],
    apply_info: "Apply at ycombinator.com — 2 batches/year (W and S)",
    women_focused: false,
  },
  {
    name: "Techstars",
    type: "accelerator",
    focus: "Sector-specific programs in 50+ cities worldwide",
    check_range: "$120K for 6%",
    regions: ["global"],
    stages: ["prototype", "beta"],
    industries: ["general"],
    apply_info: "Apply at techstars.com — find your city/vertical program",
    women_focused: false,
  },
  {
    name: "Antler",
    type: "accelerator",
    focus: "Ideation-stage company builder — helps co-founders find each other",
    check_range: "$100K–$200K for 10–20%",
    regions: ["global"],
    stages: ["ideation", "prototype"],
    industries: ["general"],
    apply_info: "Apply at antler.co — cohort-based, 30+ cities",
    women_focused: false,
  },
  {
    name: "500 Global",
    type: "accelerator",
    focus: "Seed-stage tech companies globally, strong in emerging markets",
    check_range: "$150K for 6%",
    regions: ["global"],
    stages: ["prototype", "beta"],
    industries: ["tech", "saas", "fintech", "health"],
    apply_info: "Apply at 500.co — rolling applications",
    women_focused: false,
  },
  {
    name: "Seedcamp",
    type: "accelerator",
    focus: "Pre-seed/seed tech in Europe — strong network",
    check_range: "€200K–€500K",
    regions: ["europe"],
    stages: ["prototype", "beta"],
    industries: ["tech", "saas", "fintech"],
    apply_info: "Apply at seedcamp.com — rolling basis + events",
    women_focused: false,
  },

  // ── India ───────────────────────────────────────────────────────────────────
  {
    name: "Startup India Seed Fund Scheme",
    type: "government",
    focus: "Government grant + funding for Indian early-stage startups",
    check_range: "₹20L–₹50L grant / ₹50L–₹5Cr convertible note",
    regions: ["india"],
    stages: ["ideation", "prototype"],
    industries: ["general"],
    apply_info: "Apply at startupindia.gov.in/seed-fund-scheme — DPIIT registration required",
    women_focused: false,
  },
  {
    name: "T-Hub (Hyderabad)",
    type: "accelerator",
    focus: "India's largest startup incubator — strong government backing",
    check_range: "Equity-free support + grants",
    regions: ["india"],
    stages: ["ideation", "prototype", "beta"],
    industries: ["general"],
    apply_info: "Apply at t-hub.co — cohort applications open periodically",
    women_focused: false,
  },
  {
    name: "Social Alpha",
    type: "accelerator",
    focus: "Social impact tech for underserved communities in India",
    check_range: "$25K–$150K",
    regions: ["india"],
    stages: ["prototype", "beta"],
    industries: ["health", "education", "sustainability"],
    apply_info: "Apply at socialalpha.com — sector-specific programs",
    women_focused: false,
  },
  {
    name: "WEHub (Telangana Women Entrepreneurs)",
    type: "accelerator",
    focus: "India's first state-led incubator exclusively for women entrepreneurs",
    check_range: "Equity-free incubation + grants",
    regions: ["india"],
    stages: ["ideation", "prototype"],
    industries: ["general"],
    apply_info: "Apply at wehub.telangana.gov.in — rolling applications",
    women_focused: true,
  },
  {
    name: "Villgro Innovations",
    type: "accelerator",
    focus: "Social enterprise incubation in health and rural India",
    check_range: "$30K–$100K",
    regions: ["india"],
    stages: ["prototype", "beta"],
    industries: ["health", "education", "sustainability"],
    apply_info: "Apply at villgro.org — annual cohort",
    women_focused: false,
  },

  // ── Europe ──────────────────────────────────────────────────────────────────
  {
    name: "Innovate UK Smart Grants",
    type: "government",
    focus: "R&D and innovation grants for UK-based businesses",
    check_range: "£25K–£500K (non-dilutive)",
    regions: ["uk"],
    stages: ["prototype", "beta"],
    industries: ["tech", "health", "sustainability", "saas"],
    apply_info: "Apply at apply-for-innovation-funding.service.gov.uk — quarterly rounds",
    women_focused: false,
  },
  {
    name: "Octopus Ventures",
    type: "vc",
    focus: "Early-stage UK/European tech — health, deep tech, fintech",
    check_range: "£250K–£5M",
    regions: ["uk", "europe"],
    stages: ["prototype", "beta", "launched"],
    industries: ["health", "fintech", "tech", "saas"],
    apply_info: "Warm intro preferred — apply at octopusventures.com",
    women_focused: false,
  },
  {
    name: "EIC Accelerator (EU)",
    type: "government",
    focus: "Deep tech and innovation for European companies — top EU program",
    check_range: "€2.5M grant + €15M equity (blended)",
    regions: ["europe"],
    stages: ["beta", "launched"],
    industries: ["tech", "health", "sustainability", "saas"],
    apply_info: "Apply at eic.ec.europa.eu — highly competitive, 3 rounds/year",
    women_focused: false,
  },

  // ── Latin America ───────────────────────────────────────────────────────────
  {
    name: "CORFO (Chile)",
    type: "government",
    focus: "Startup Chile — world-renowned equity-free accelerator",
    check_range: "$40K–$80K (equity-free)",
    regions: ["latam"],
    stages: ["prototype", "beta"],
    industries: ["general"],
    apply_info: "Apply at startupchile.org — S Factory program for women-led teams",
    women_focused: false,
  },
  {
    name: "IDB Lab",
    type: "grant",
    focus: "Innovation for social and economic inclusion in Latin America",
    check_range: "$100K–$1M",
    regions: ["latam"],
    stages: ["prototype", "beta"],
    industries: ["health", "education", "fintech", "sustainability"],
    apply_info: "Apply at idblab.org — thematic challenges throughout the year",
    women_focused: false,
  },

  // ── Africa & MENA ───────────────────────────────────────────────────────────
  {
    name: "Tony Elumelu Foundation",
    type: "grant",
    focus: "African entrepreneurs — $5K seed + mentoring",
    check_range: "$5K non-dilutive + $5K business plan award",
    regions: ["africa"],
    stages: ["ideation", "prototype"],
    industries: ["general"],
    apply_info: "Apply at tefconnect.com — annual application, 10,000 selected/year",
    women_focused: false,
  },
  {
    name: "Wamda Capital",
    type: "vc",
    focus: "MENA entrepreneurs — tech, e-commerce, fintech",
    check_range: "$500K–$5M",
    regions: ["mena"],
    stages: ["beta", "launched"],
    industries: ["tech", "fintech", "consumer"],
    apply_info: "Apply at wamda.com/capital — warm intro preferred",
    women_focused: false,
  },

  // ── US broad ────────────────────────────────────────────────────────────────
  {
    name: "SBA Women's Business Centers",
    type: "government",
    focus: "Free counseling, training, and micro-grants for women entrepreneurs",
    check_range: "Equity-free support + micro-grants ($500–$5K)",
    regions: ["us"],
    stages: ["ideation", "prototype", "beta"],
    industries: ["general"],
    apply_info: "Find your local WBC at sba.gov/wbc — no application required for counseling",
    women_focused: true,
  },
  {
    name: "SBIR / STTR (NSF, NIH, DOD)",
    type: "government",
    focus: "R&D grants for US tech/deep tech startups — non-dilutive",
    check_range: "$150K–$1M Phase I, up to $2M Phase II",
    regions: ["us"],
    stages: ["prototype", "beta"],
    industries: ["health", "tech", "sustainability", "saas"],
    apply_info: "Apply at sbir.gov — multiple agencies, quarterly deadlines",
    women_focused: false,
  },
  {
    name: "First Round Capital",
    type: "vc",
    focus: "Pre-seed/seed US tech — strong founder community",
    check_range: "$500K–$3M",
    regions: ["us"],
    stages: ["prototype", "beta"],
    industries: ["tech", "saas", "consumer", "fintech"],
    apply_info: "Apply at firstround.com/apply — rolling basis",
    women_focused: false,
  },

  // ── APAC ────────────────────────────────────────────────────────────────────
  {
    name: "Alibaba Entrepreneurs Fund",
    type: "grant",
    focus: "Hong Kong & Taiwan entrepreneurs — equity-free funding + Alibaba ecosystem",
    check_range: "HKD 1M–5M",
    regions: ["apac"],
    stages: ["prototype", "beta"],
    industries: ["ecommerce", "tech", "fintech"],
    apply_info: "Apply at alibabaentrepreneursfund.com — annual rounds",
    women_focused: false,
  },
];

// ── Region normalizer ─────────────────────────────────────────────────────────
function normalizeRegion(region: string): string[] {
  const r = region.toLowerCase();
  if (/india/.test(r))                                     return ["india", "apac"];
  if (/uk|england|britain|scotland|wales/.test(r))         return ["uk", "europe"];
  if (/europe|eu |germany|france|spain|netherlands|sweden|ireland|portugal/.test(r)) return ["europe"];
  if (/latam|latin|brazil|mexico|colombia|chile|argentina/.test(r)) return ["latam"];
  if (/africa|nigeria|kenya|ghana|south africa/.test(r))   return ["africa"];
  if (/mena|uae|dubai|saudi|egypt|jordan/.test(r))         return ["mena"];
  if (/apac|asia|singapore|australia|japan|korea|china/.test(r)) return ["apac"];
  if (/us|usa|united states|america/.test(r))              return ["us"];
  return ["global"];
}

function industryBucket(industry: string): string[] {
  const i = industry.toLowerCase();
  const map: [RegExp, string][] = [
    [/health|med|pharma|biotech|wellnes/,    "health"],
    [/edu|learning|training|school/,          "education"],
    [/fin|bank|payment|insurance|wealth/,     "fintech"],
    [/ecommerce|retail|shop|market/,          "ecommerce"],
    [/saas|software|b2b|enterprise|crm/,      "saas"],
    [/food|restaurant|agri|farm/,             "food"],
    [/sustain|green|climate|clean|energy/,    "sustainability"],
    [/consumer|lifestyle|fashion|beauty/,     "consumer"],
    [/impact|social|ngo|nonprofit/,           "social-impact"],
    [/prop|real estate|housing/,              "proptech"],
  ];
  const matched: string[] = [];
  for (const [re, bucket] of map) {
    if (re.test(i)) matched.push(bucket);
  }
  return matched.length ? [...matched, "tech", "general"] : ["tech", "general"];
}

// ── Matching engine ───────────────────────────────────────────────────────────
export function matchInvestors(
  region: string,
  stage: string,
  industry: string,
  womenFocusedFirst = true,
): InvestorMatch[] {
  const founderRegions = normalizeRegion(region);
  const founderIndustries = industryBucket(industry);

  const scored = DB.map((inv) => {
    let score = 0;

    // Region match
    if (inv.regions.includes("global")) score += 2;
    else if (inv.regions.some((r) => founderRegions.includes(r))) score += 3;

    // Stage match
    if (inv.stages.includes(stage)) score += 2;

    // Industry match
    if (inv.industries.includes("general")) score += 1;
    else if (inv.industries.some((ind) => founderIndustries.includes(ind))) score += 2;

    // Women-focused bonus
    if (womenFocusedFirst && inv.women_focused) score += 1;

    return { inv, score };
  });

  const top = scored
    .filter(({ score }) => score >= 3)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(({ inv, score }) => ({
      name: inv.name,
      type: inv.type,
      focus: inv.focus,
      check_range: inv.check_range,
      regions: inv.regions,
      why_matched: buildWhyMatched(inv, founderRegions, founderIndustries, stage, score),
      apply_info: inv.apply_info,
    } satisfies InvestorMatch));

  return top;
}

function buildWhyMatched(
  inv: InvestorEntry,
  founderRegions: string[],
  founderIndustries: string[],
  stage: string,
  score: number,
): string {
  const reasons: string[] = [];
  if (inv.regions.includes("global")) reasons.push("global scope");
  else if (inv.regions.some((r) => founderRegions.includes(r))) reasons.push(`active in your region`);
  if (inv.stages.includes(stage)) reasons.push(`invests at ${stage} stage`);
  if (inv.women_focused) reasons.push("women-founder focused");
  if (inv.industries.some((ind) => founderIndustries.includes(ind))) reasons.push("matches your industry");
  return reasons.length ? reasons.join(", ") : `strong match (score ${score})`;
}
