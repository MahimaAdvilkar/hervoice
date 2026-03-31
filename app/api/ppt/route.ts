import { NextResponse } from "next/server";
import PptxGenJS from "pptxgenjs";
import { FinalResponseSchema, type FinalResponse } from "@/lib/schemas";

export const runtime = "nodejs";

// ── Canvas constants ──────────────────────────────────────────────────────────
const W   = 13.33; // widescreen width  (inches)
const H   = 7.5;   // widescreen height (inches)
const LPW = 3.5;   // left panel width
const CX  = LPW + 0.38; // content start x
const CW  = W - CX - 0.42; // content width (~8.93")

type Sld = ReturnType<PptxGenJS["addSlide"]>;

// ── 5 brand themes ────────────────────────────────────────────────────────────
interface Theme {
  panel:    string; // left panel fill
  accentDk: string; // dark accent (hover / header)
  accentLt: string; // light tint background
  accentGh: string; // ghost / watermark
  coverBg:  string; // cover slide dark bg
  coverBg2: string; // cover slide secondary bg
  // Derived contrast colours
  onPanel:  string; // text on panel
  onAccent: string; // text on accent-filled surface
}

const THEMES: Theme[] = [
  // 0 – Electric Violet (original)
  { panel: "7C4DFF", accentDk: "5535C7", accentLt: "EDE9FE", accentGh: "A585FF",
    coverBg: "0F0820", coverBg2: "1C1240", onPanel: "FFFFFF", onAccent: "FFFFFF" },
  // 1 – Ocean Teal
  { panel: "0D9488", accentDk: "0A6B61", accentLt: "CCFBF1", accentGh: "3DBFB5",
    coverBg: "012422", coverBg2: "053430", onPanel: "FFFFFF", onAccent: "FFFFFF" },
  // 2 – Amber Forge
  { panel: "B45309", accentDk: "8B3E00", accentLt: "FEF3C7", accentGh: "D97706",
    coverBg: "1C0E00", coverBg2: "2D1800", onPanel: "FFFFFF", onAccent: "FFFFFF" },
  // 3 – Forest Emerald
  { panel: "15803D", accentDk: "0F5C2E", accentLt: "DCFCE7", accentGh: "22C55E",
    coverBg: "022012", coverBg2: "042E18", onPanel: "FFFFFF", onAccent: "FFFFFF" },
  // 4 – Indigo Night
  { panel: "4338CA", accentDk: "312E81", accentLt: "E0E7FF", accentGh: "6366F1",
    coverBg: "0C0B1F", coverBg2: "14123A", onPanel: "FFFFFF", onAccent: "FFFFFF" },
];

const C = {
  white:   "FFFFFF",
  bgLight: "F8FAFF",
  cardBg:  "F1F5F9",
  navy:    "0F172A",
  textDk:  "1E293B",
  textMd:  "475569",
  textLt:  "94A3B8",
  border:  "E2E8F0",
  divider: "CBD5E1",
  dangRd:  "DC2626",
  dangLt:  "FEF2F2",
  dangBd:  "FECACA",
  succGr:  "059669",
  succLt:  "ECFDF5",
  succBd:  "A7F3D0",
  warnYl:  "D97706",
  warnLt:  "FFFBEB",
  warnBd:  "FDE68A",
};

// ── Theme picker (deterministic per founder) ──────────────────────────────────
function pickTheme(intake: Record<string, any>): Theme {
  const seed = String(intake?.founderName ?? "") + String(intake?.industry ?? "");
  const hash = seed.split("").reduce((a, c) => (a * 31 + c.charCodeAt(0)) & 0xffff, 0);
  return THEMES[hash % THEMES.length];
}

// ── Semantic layout detector ──────────────────────────────────────────────────
function detectLayout(title: string): string {
  const t = title.toLowerCase();
  if (/problem|pain|challenge|gap|struggle/.test(t))              return "problem";
  if (/solution|how we|what we|our approach|introducing/.test(t)) return "solution";
  if (/why now|timing|trend|moment|tailwind/.test(t))             return "why-now";
  if (/market|tam|size|opportunit|landscape/.test(t))             return "market";
  if (/product|feature|how it|demo|platform|tool/.test(t))       return "product";
  if (/go.to.market|acquisition|gtm|growth/.test(t))             return "gtm-pitch";
  if (/business model|revenue|monetiz|pricing/.test(t))          return "biz-model";
  if (/ask|invest|fund|next step|raise|capital/.test(t))         return "ask";
  if (/traction|result|milestone|proof|customer|user/.test(t))   return "traction";
  if (/team|founder|who we|background/.test(t))                  return "team";
  return "default";
}

// ── Number extractor (for market slide big-stat callouts) ─────────────────────
function extractStat(text: string): { num: string; rest: string } | null {
  const m = text.match(/(\$[\d.,]+\s*[BMKTbmkt][\w]*|\d[\d.,]*\s*[BMKTbmkt][\w]*|\d[\d.,]*\s*%)/i);
  if (!m) return null;
  const num = m[0].trim();
  const rest = text.replace(m[0], "").replace(/^[\s\-–—:,]+|[\s,]+$/g, "");
  return { num, rest };
}

// ── Utility ───────────────────────────────────────────────────────────────────
function trunc(s: unknown, max = 300): string {
  const str = String(s ?? "");
  return str.length > max ? str.slice(0, max - 1) + "…" : str;
}

// ── Primitive wrappers ────────────────────────────────────────────────────────
function box(sl: Sld, x: number, y: number, w: number, h: number, fill: string) {
  sl.addShape("rect" as any, { x, y, w, h, fill: { color: fill }, line: { color: fill, width: 0 } });
}

function circle(sl: Sld, cx: number, cy: number, r: number, fill: string) {
  sl.addShape("ellipse" as any, {
    x: cx - r, y: cy - r, w: r * 2, h: r * 2,
    fill: { color: fill }, line: { color: fill, width: 0 },
  });
}

function card(sl: Sld, x: number, y: number, w: number, h: number, fill: string, border: string) {
  sl.addShape("rect" as any, { x, y, w, h, fill: { color: fill }, line: { color: border, width: 1 } });
}

function t(sl: Sld, raw: string, x: number, y: number, w: number, h: number, opts: Record<string, unknown> = {}) {
  const { _max = 300, ...rest } = opts;
  sl.addText(trunc(raw, _max as number), { x, y, w, h, ...rest } as any);
}

function lbl(sl: Sld, text: string, x: number, y: number, w: number, color = C.textLt) {
  sl.addText(text, { x, y, w, h: 0.26, fontSize: 8.5, bold: true, color, charSpacing: 1.8 });
}

// ── Shared slide chrome ───────────────────────────────────────────────────────

/** Left-panel + white content area + bottom accent strip */
function baseSlide(pptx: PptxGenJS, theme: Theme, slideNum: number): Sld {
  const sl = pptx.addSlide();

  // White full background
  box(sl, 0, 0, W, H, C.white);

  // Left panel
  box(sl, 0, 0, LPW, H, theme.panel);

  // Ghost slide number (decorative, very low opacity via ghost colour)
  sl.addText(String(slideNum).padStart(2, "0"), {
    x: 0, y: H - 3.2, w: LPW, h: 2.8,
    fontSize: 110, bold: true, color: theme.accentGh,
    align: "center", valign: "bottom", charSpacing: -2,
  });

  // Bottom accent strip
  box(sl, LPW, H - 0.07, W - LPW, 0.07, theme.panel);

  return sl;
}

/** Category micro-label at bottom of left panel */
function panelTag(sl: Sld, category: string, theme: Theme) {
  box(sl, 0.25, H - 1.10, LPW - 0.50, 0.04, theme.accentGh);
  lbl(sl, category, 0.25, H - 0.90, LPW - 0.30, theme.accentGh);
}

/** Content area heading + underline bar */
function sectionTitle(sl: Sld, title: string, theme: Theme, y = 0.50) {
  t(sl, title, CX, y, CW, 0.78, { fontSize: 30, bold: true, color: C.textDk, _max: 60 });
  box(sl, CX, y + 0.72, Math.min(title.length * 0.175 + 0.6, 5.5), 0.055, theme.panel);
}

// ── Semantic pitch slide builders ─────────────────────────────────────────────

/** PROBLEM – red tint hero quote + 3 pain cards with numbered circles */
function makeProblemSlide(sl: Sld, s: { title: string; bullets: string[] }, _theme: Theme) {
  const hero = s.bullets[0] ?? "";
  const pains = s.bullets.slice(1, 4);

  // Hero quote box
  card(sl, CX, 1.55, CW, 1.12, C.dangLt, C.dangBd);
  box(sl, CX, 1.55, 0.08, 1.12, C.dangRd);
  sl.addText(`"${trunc(hero, 110)}"`, {
    x: CX + 0.22, y: 1.60, w: CW - 0.32, h: 1.00,
    fontSize: 17, color: C.dangRd, italic: true, valign: "middle",
  });

  if (pains.length === 0) return;

  // Pain cards
  const cw = (CW - 0.22 * (pains.length - 1)) / pains.length;
  pains.forEach((p, i) => {
    const bx = CX + i * (cw + 0.22);
    const by = 2.90;
    card(sl, bx, by, cw, 3.90, C.dangLt, C.dangBd);
    box(sl, bx, by, 0.07, 3.90, C.dangRd);

    // Numbered circle
    circle(sl, bx + 0.46, by + 0.48, 0.28, C.dangRd);
    sl.addText(String(i + 1), {
      x: bx + 0.18, y: by + 0.20, w: 0.56, h: 0.56,
      fontSize: 15, bold: true, color: C.white, align: "center", valign: "middle",
    });

    t(sl, p, bx + 0.18, by + 0.92, cw - 0.28, 2.80,
      { fontSize: 15, color: C.textDk, _max: 100 });
  });
}

/** SOLUTION – hero statement + numbered feature cards in theme colour */
function makeSolutionSlide(sl: Sld, s: { title: string; bullets: string[] }, theme: Theme) {
  const hero = s.bullets[0] ?? "";
  const features = s.bullets.slice(1, 4);

  // Hero statement
  card(sl, CX, 1.55, CW, 1.05, theme.accentLt, theme.panel);
  box(sl, CX, 1.55, 0.08, 1.05, theme.panel);
  t(sl, hero, CX + 0.22, 1.60, CW - 0.32, 0.93,
    { fontSize: 17, bold: true, color: C.textDk, valign: "middle", _max: 130 });

  if (features.length === 0) return;

  // Feature cards
  const cw = (CW - 0.22 * (features.length - 1)) / features.length;
  features.forEach((f, i) => {
    const bx = CX + i * (cw + 0.22);
    const by = 2.80;
    card(sl, bx, by, cw, 4.00, C.bgLight, C.border);
    box(sl, bx, by, 0.07, 4.00, theme.panel);

    circle(sl, bx + 0.46, by + 0.48, 0.28, theme.panel);
    sl.addText(String(i + 1), {
      x: bx + 0.18, y: by + 0.20, w: 0.56, h: 0.56,
      fontSize: 15, bold: true, color: C.white, align: "center", valign: "middle",
    });

    t(sl, f, bx + 0.18, by + 0.92, cw - 0.28, 2.90,
      { fontSize: 15, color: C.textDk, _max: 110 });
  });
}

/** WHY NOW – 3 force cards with Roman numerals + horizontal arrows */
function makeWhyNowSlide(sl: Sld, s: { title: string; bullets: string[] }, theme: Theme) {
  const forces = s.bullets.slice(0, 3);
  const cw = (CW - 0.55) / Math.max(forces.length, 1);
  const romans = ["I", "II", "III"];

  forces.forEach((f, i) => {
    const bx = CX + i * (cw + 0.275);
    const by = 1.55;

    card(sl, bx, by, cw, 5.18, theme.accentLt, theme.panel);
    box(sl, bx, by, cw, 0.55, theme.panel); // header fill

    // Roman numeral in header
    sl.addText(romans[i] ?? String(i + 1), {
      x: bx, y: by + 0.06, w: cw, h: 0.42,
      fontSize: 20, bold: true, color: C.white, align: "center", valign: "middle",
    });

    t(sl, f, bx + 0.16, by + 0.72, cw - 0.28, 4.30,
      { fontSize: 15.5, color: C.textDk, _max: 120 });

    // Arrow between cards (not after last)
    if (i < forces.length - 1) {
      const arrowX = bx + cw + 0.035;
      sl.addText("→", {
        x: arrowX, y: by + 0.28 - 0.25, w: 0.20, h: 0.50,
        fontSize: 20, bold: true, color: theme.panel, align: "center",
      });
    }
  });

  // Fallback if no bullets
  if (forces.length === 0) {
    t(sl, "The time is right — market conditions, technology, and behaviour have aligned.",
      CX, 2.5, CW, 1.2, { fontSize: 20, color: C.textMd, valign: "middle", _max: 140 });
  }
}

/** MARKET – big number callouts for any stats found, else numbered cards */
function makeMarketSlide(sl: Sld, s: { title: string; bullets: string[] }, theme: Theme) {
  const items = s.bullets.slice(0, 3);

  const stats = items.map(extractStat);
  const hasStats = stats.some(Boolean);

  if (hasStats) {
    // Big number layout
    const cw = (CW - 0.22 * (items.length - 1)) / items.length;
    items.forEach((item, i) => {
      const bx = CX + i * (cw + 0.22);
      const by = 1.55;
      const stat = stats[i];

      card(sl, bx, by, cw, 5.18, C.bgLight, C.border);
      box(sl, bx, by, 0.07, 5.18, theme.panel);

      if (stat) {
        // Large stat number
        sl.addText(stat.num, {
          x: bx + 0.14, y: by + 0.50, w: cw - 0.24, h: 1.60,
          fontSize: 42, bold: true, color: theme.panel, align: "center", valign: "middle",
        });
        box(sl, bx + 0.22, by + 2.20, cw - 0.44, 0.04, C.divider);
        t(sl, stat.rest || item, bx + 0.16, by + 2.36, cw - 0.28, 2.60,
          { fontSize: 14, color: C.textMd, _max: 100 });
      } else {
        t(sl, item, bx + 0.16, by + 0.60, cw - 0.28, 4.30,
          { fontSize: 15, color: C.textDk, _max: 110 });
      }
    });
  } else {
    // Numbered callout cards fallback
    items.forEach((item, i) => {
      const bx = CX + i * ((CW - 0.22 * 2) / 3 + 0.22);
      const cw2 = (CW - 0.22 * 2) / 3;
      card(sl, bx, 1.55, cw2, 5.18, theme.accentLt, theme.panel);
      box(sl, bx, 1.55, 0.07, 5.18, theme.panel);
      circle(sl, bx + 0.44, 2.10, 0.28, theme.panel);
      sl.addText(String(i + 1), {
        x: bx + 0.16, y: 1.82, w: 0.56, h: 0.56,
        fontSize: 15, bold: true, color: C.white, align: "center", valign: "middle",
      });
      t(sl, item, bx + 0.16, 2.55, cw2 - 0.28, 3.90,
        { fontSize: 14, color: C.textDk, _max: 110 });
    });
  }
}

/** PRODUCT – hero feature + 2-col bullet grid */
function makeProductSlide(sl: Sld, s: { title: string; bullets: string[] }, theme: Theme) {
  const hero = s.bullets[0] ?? "";
  const features = s.bullets.slice(1, 5);

  // Hero bar
  card(sl, CX, 1.55, CW, 1.00, theme.accentLt, theme.panel);
  box(sl, CX, 1.55, 0.08, 1.00, theme.panel);
  t(sl, hero, CX + 0.22, 1.60, CW - 0.32, 0.88,
    { fontSize: 17, bold: true, color: C.textDk, valign: "middle", _max: 120 });

  // 2-col grid
  const half = (CW - 0.22) / 2;
  features.forEach((f, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const bx = CX + col * (half + 0.22);
    const by = 2.78 + row * 1.72;

    card(sl, bx, by, half, 1.55, C.bgLight, C.border);
    box(sl, bx, by, 0.07, 1.55, theme.panel);
    t(sl, f, bx + 0.18, by + 0.12, half - 0.28, 1.30,
      { fontSize: 14.5, color: C.textDk, _max: 90 });
  });
}

/** GTM PITCH – positioning hero + 3 channel/acquisition cards */
function makeGTMPitchSlide(sl: Sld, s: { title: string; bullets: string[] }, theme: Theme) {
  const hero = s.bullets[0] ?? "";
  const channels = s.bullets.slice(1, 4);

  // Positioning hero
  box(sl, CX, 1.55, CW, 1.00, theme.panel);
  t(sl, hero, CX + 0.22, 1.58, CW - 0.32, 0.93,
    { fontSize: 17, bold: true, color: C.white, valign: "middle", _max: 120 });

  // Channel cards
  const cw = (CW - 0.22 * (channels.length - 1)) / Math.max(channels.length, 1);
  const icons = ["📣", "🤝", "🌐"];
  channels.forEach((ch, i) => {
    const bx = CX + i * (cw + 0.22);
    const by = 2.78;

    card(sl, bx, by, cw, 4.00, C.bgLight, C.border);
    box(sl, bx, by, cw, 0.60, theme.accentLt);
    sl.addText(icons[i] ?? "▶", {
      x: bx + 0.08, y: by + 0.08, w: cw - 0.16, h: 0.44,
      fontSize: 18, align: "center", valign: "middle",
    });
    t(sl, ch, bx + 0.16, by + 0.78, cw - 0.28, 3.00,
      { fontSize: 14.5, color: C.textDk, _max: 110 });
  });
}

/** BIZ MODEL – revenue streams table-style cards */
function makeBizModelSlide(sl: Sld, s: { title: string; bullets: string[] }, theme: Theme) {
  const streams = s.bullets.slice(0, 4);
  const cw = streams.length <= 2
    ? (CW - 0.22) / 2
    : (CW - 0.22 * (streams.length - 1)) / streams.length;

  const labels = ["PRIMARY", "SECONDARY", "TERTIARY", "EXPANSION"];

  streams.forEach((stream, i) => {
    const bx = CX + i * (cw + 0.22);
    const by = 1.55;

    card(sl, bx, by, cw, 5.18, C.bgLight, C.border);
    box(sl, bx, by, cw, 0.72, theme.panel);
    lbl(sl, labels[i] ?? `STREAM ${i + 1}`, bx + 0.14, by + 0.10, cw - 0.24, C.white);
    sl.addText("$", {
      x: bx + 0.12, y: by + 0.38, w: 0.50, h: 0.36,
      fontSize: 22, bold: true, color: C.white, valign: "middle",
    });

    t(sl, stream, bx + 0.16, by + 0.90, cw - 0.28, 4.10,
      { fontSize: 14.5, color: C.textDk, _max: 110 });
  });
}

/** ASK – full-width hero ask box + use-of-funds columns */
function makeAskSlide(sl: Sld, s: { title: string; bullets: string[] }, theme: Theme) {
  const ask = s.bullets[0] ?? "";
  const uses = s.bullets.slice(1, 4);

  // Big ask hero
  box(sl, CX, 1.55, CW, 1.30, theme.panel);
  t(sl, ask, CX + 0.24, 1.60, CW - 0.40, 1.20,
    { fontSize: 22, bold: true, color: C.white, valign: "middle", _max: 130 });

  if (uses.length === 0) return;

  lbl(sl, "USE OF FUNDS", CX, 3.10, CW, C.textMd);

  const cw = (CW - 0.22 * (uses.length - 1)) / uses.length;
  const pcts = ["40%", "35%", "25%"].slice(0, uses.length);

  uses.forEach((u, i) => {
    const bx = CX + i * (cw + 0.22);
    const by = 3.40;

    card(sl, bx, by, cw, 3.35, theme.accentLt, theme.panel);
    box(sl, bx, by, 0.07, 3.35, theme.panel);

    sl.addText(pcts[i] ?? "", {
      x: bx + 0.14, y: by + 0.14, w: cw - 0.24, h: 0.90,
      fontSize: 32, bold: true, color: theme.panel, align: "center", valign: "middle",
    });
    box(sl, bx + 0.22, by + 1.08, cw - 0.44, 0.04, C.divider);
    t(sl, u, bx + 0.16, by + 1.24, cw - 0.28, 1.90,
      { fontSize: 13.5, color: C.textDk, _max: 90 });
  });
}

/** TRACTION – milestone timeline strip + metric callouts */
function makeTractionSlide(sl: Sld, s: { title: string; bullets: string[] }, theme: Theme) {
  const items = s.bullets.slice(0, 4);

  items.forEach((item, i) => {
    const by = 1.55 + i * 1.40;
    const stat = extractStat(item);

    card(sl, CX, by, CW, 1.22, C.bgLight, C.border);
    box(sl, CX, by, 0.08, 1.22, theme.panel);

    // Dot marker
    circle(sl, CX - 0.55, by + 0.61, 0.18, theme.panel);
    if (i < items.length - 1) {
      box(sl, CX - 0.58, by + 0.80, 0.04, 0.80, C.divider);
    }

    if (stat) {
      sl.addText(stat.num, {
        x: CX + 0.14, y: by + 0.08, w: 2.20, h: 1.06,
        fontSize: 28, bold: true, color: theme.panel, valign: "middle",
      });
      t(sl, stat.rest || item, CX + 2.42, by + 0.12, CW - 2.60, 0.98,
        { fontSize: 14, color: C.textMd, valign: "middle", _max: 90 });
    } else {
      t(sl, item, CX + 0.22, by + 0.14, CW - 0.36, 0.96,
        { fontSize: 15, color: C.textDk, valign: "middle", _max: 110 });
    }
  });
}

/** TEAM – founder spotlight card + supporting team */
function makeTeamSlide(sl: Sld, s: { title: string; bullets: string[] }, intake: Record<string, any>, theme: Theme) {
  const founderBio = s.bullets[0] ?? `${intake?.founderName ?? "Founder"} — ${intake?.stage ?? "building"} in ${intake?.industry ?? "tech"}`;
  const others = s.bullets.slice(1, 4);

  // Founder card (left, larger)
  const fw = CW * 0.48;
  card(sl, CX, 1.55, fw, 5.18, theme.accentLt, theme.panel);
  box(sl, CX, 1.55, 0.08, 5.18, theme.panel);

  circle(sl, CX + fw / 2, 2.30, 0.60, theme.panel);
  sl.addText("👤", {
    x: CX + fw / 2 - 0.55, y: 1.72, w: 1.10, h: 1.16,
    fontSize: 28, align: "center", valign: "middle",
  });

  sl.addText(trunc(intake?.founderName ?? "Founder", 30), {
    x: CX + 0.16, y: 3.06, w: fw - 0.28, h: 0.60,
    fontSize: 18, bold: true, color: C.textDk, align: "center",
  });
  t(sl, founderBio, CX + 0.16, 3.72, fw - 0.28, 2.80,
    { fontSize: 13, color: C.textMd, align: "center", _max: 180 });

  // Supporting members / strengths
  if (others.length > 0) {
    const rx = CX + fw + 0.24;
    const rw = CW - fw - 0.24;
    others.forEach((o, i) => {
      const by = 1.55 + i * 1.80;
      card(sl, rx, by, rw, 1.60, C.bgLight, C.border);
      box(sl, rx, by, 0.07, 1.60, theme.panel);
      t(sl, o, rx + 0.20, by + 0.12, rw - 0.30, 1.36,
        { fontSize: 14, color: C.textDk, _max: 110 });
    });
  }
}

/** DEFAULT – first bullet is hero, rest are supporting cards */
function makeDefaultSlide(sl: Sld, s: { title: string; bullets: string[] }, theme: Theme) {
  const hero = s.bullets[0] ?? "";
  const rest = s.bullets.slice(1, 4);

  // Hero callout
  card(sl, CX, 1.55, CW, 1.00, theme.accentLt, theme.panel);
  box(sl, CX, 1.55, 0.08, 1.00, theme.panel);
  t(sl, hero, CX + 0.22, 1.60, CW - 0.32, 0.88,
    { fontSize: 17, bold: true, color: C.textDk, valign: "middle", _max: 130 });

  // Supporting cards
  const cw = rest.length > 0 ? (CW - 0.22 * (rest.length - 1)) / rest.length : CW;
  rest.forEach((item, i) => {
    const bx = CX + i * (cw + 0.22);
    card(sl, bx, 2.78, cw, 4.00, C.bgLight, C.border);
    box(sl, bx, 2.78, 0.07, 4.00, theme.panel);
    t(sl, item, bx + 0.18, 2.90, cw - 0.28, 3.70,
      { fontSize: 15, color: C.textDk, _max: 110 });
  });

  // If there's only a hero and no rest, expand it
  if (rest.length === 0 && hero) {
    t(sl, hero, CX, 2.90, CW, 4.00,
      { fontSize: 18, color: C.textMd, _max: 300 });
  }
}

/** Dispatcher: picks the right layout based on slide title */
function makePitchSlide(
  pptx: PptxGenJS,
  s: { title: string; bullets: string[] },
  n: number,
  theme: Theme,
  intake: Record<string, any>,
) {
  const sl = baseSlide(pptx, theme, n);
  panelTag(sl, "INVESTOR PITCH", theme);
  sectionTitle(sl, s.title, theme);

  const layout = detectLayout(s.title);

  switch (layout) {
    case "problem":    makeProblemSlide(sl, s, theme);               break;
    case "solution":   makeSolutionSlide(sl, s, theme);              break;
    case "why-now":    makeWhyNowSlide(sl, s, theme);                break;
    case "market":     makeMarketSlide(sl, s, theme);                break;
    case "product":    makeProductSlide(sl, s, theme);               break;
    case "gtm-pitch":  makeGTMPitchSlide(sl, s, theme);             break;
    case "biz-model":  makeBizModelSlide(sl, s, theme);             break;
    case "ask":        makeAskSlide(sl, s, theme);                   break;
    case "traction":   makeTractionSlide(sl, s, theme);              break;
    case "team":       makeTeamSlide(sl, s, intake, theme);          break;
    default:           makeDefaultSlide(sl, s, theme);               break;
  }
}

// ── Operational slides ────────────────────────────────────────────────────────

function makeCover(pptx: PptxGenJS, intake: Record<string, any>, fd: FinalResponse, theme: Theme) {
  const sl = pptx.addSlide();

  // Dark gradient background
  box(sl, 0, 0, W, H, theme.coverBg);
  box(sl, 0, 0, W / 2, H, theme.coverBg2); // subtle left fade

  // Decorative circles
  circle(sl, 11.8, 1.0, 3.0, theme.coverBg2);
  circle(sl, 13.0, 5.8, 2.0, theme.accentDk + "44");
  circle(sl, 0.8, 7.0, 1.8, theme.accentDk + "33");

  // Accent bars
  box(sl, 0, 0, W, 0.12, theme.panel);
  box(sl, 0, H - 0.12, W, 0.12, theme.panel);
  box(sl, 0, 0, 0.14, H, theme.accentDk);

  // App name
  sl.addText("SheLaunch", { x: 0.55, y: 0.85, w: 8, h: 1.1, fontSize: 58, bold: true, color: C.white });
  sl.addText("AI", { x: 0.55, y: 1.85, w: 8, h: 0.9, fontSize: 58, bold: true, color: theme.accentGh });

  // Divider under name
  box(sl, 0.55, 2.90, 4.0, 0.06, theme.panel);

  // Tagline
  sl.addText("Agentic Startup Copilot for Women Entrepreneurs", {
    x: 0.55, y: 3.08, w: 7.5, h: 0.44, fontSize: 14.5, color: C.textLt,
  });

  // Vision statement
  t(sl, fd.pitch_deck.one_sentence_vision, 0.55, 3.72, 8.0, 0.70,
    { fontSize: 16, color: C.white, italic: true, _max: 130 });

  // Right info card
  card(sl, 8.72, 0.88, 4.33, 5.68, theme.coverBg2, theme.panel);
  box(sl, 8.72, 0.88, 0.08, 5.68, theme.panel);

  lbl(sl, "ELEVATOR PITCH", 8.96, 1.04, 3.90, theme.accentGh);
  t(sl, fd.pitch_deck.elevator_pitch, 8.96, 1.36, 3.90, 2.28,
    { fontSize: 13.5, color: C.white, _max: 260 });

  box(sl, 8.96, 3.80, 3.78, 0.04, theme.panel);

  lbl(sl, "FOUNDER", 8.96, 3.98, 3.90, C.textLt);
  t(sl, trunc(intake?.founderName ?? "", 38), 8.96, 4.26, 3.90, 0.46,
    { fontSize: 18, bold: true, color: C.white });

  lbl(sl, "STAGE · INDUSTRY · REGION", 8.96, 4.84, 3.90, C.textLt);
  t(sl, [
    (intake?.stage ?? "ideation").toUpperCase(),
    intake?.industry,
    intake?.region,
  ].filter(Boolean).join("  ·  "), 8.96, 5.10, 3.90, 0.38,
    { fontSize: 12, color: C.textLt, _max: 60 });

  t(sl, new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    8.96, 5.98, 3.90, 0.35, { fontSize: 11, color: C.textLt });
}

function makeBlueprintSlide(pptx: PptxGenJS, bp: FinalResponse["blueprint"], n: number, theme: Theme) {
  const sl = baseSlide(pptx, theme, n);
  panelTag(sl, "FOUNDER BLUEPRINT", theme);
  sectionTitle(sl, "Founder Blueprint", theme);

  const HW = (CW - 0.28) / 2;
  const RX = CX + HW + 0.28;

  // Problem card (red-tinted)
  card(sl, CX, 1.58, HW, 2.55, C.dangLt, C.dangBd);
  box(sl, CX, 1.58, 0.07, 2.55, C.dangRd);
  lbl(sl, "PROBLEM STATEMENT", CX + 0.22, 1.68, HW - 0.32, C.dangRd);
  t(sl, bp.problem_statement, CX + 0.22, 2.00, HW - 0.32, 1.00,
    { fontSize: 14, color: C.textDk, _max: 160 });
  lbl(sl, "TARGET CUSTOMER", CX + 0.22, 3.05, HW - 0.32, C.textMd);
  t(sl, bp.target_customer, CX + 0.22, 3.30, HW - 0.32, 0.62,
    { fontSize: 13, bold: true, color: C.textDk, _max: 80 });

  // Value prop card (themed)
  card(sl, RX, 1.58, HW, 2.55, theme.accentLt, theme.panel);
  box(sl, RX, 1.58, 0.07, 2.55, theme.panel);
  lbl(sl, "VALUE PROPOSITION", RX + 0.22, 1.68, HW - 0.32, theme.panel);
  t(sl, bp.value_proposition, RX + 0.22, 2.00, HW - 0.32, 1.00,
    { fontSize: 14, color: C.textDk, _max: 160 });
  lbl(sl, "UNIQUE ANGLE", RX + 0.22, 3.05, HW - 0.32, C.textMd);
  t(sl, bp.unique_angle, RX + 0.22, 3.30, HW - 0.32, 0.62,
    { fontSize: 13, bold: true, color: C.textDk, _max: 80 });

  // Core features
  lbl(sl, "CORE FEATURES", CX, 4.35, CW, C.textMd);
  const feats = bp.core_features.slice(0, 4);
  const fw = (CW - 0.15 * (feats.length - 1)) / feats.length;
  feats.forEach((f, i) => {
    const bx = CX + i * (fw + 0.15);
    card(sl, bx, 4.65, fw, 0.60, C.cardBg, C.border);
    box(sl, bx, 4.65, 0.05, 0.60, theme.panel);
    t(sl, f, bx + 0.16, 4.69, fw - 0.24, 0.50,
      { fontSize: 12, color: C.textDk, valign: "middle", _max: 55 });
  });

  // Risks
  if (bp.risks.length > 0) {
    lbl(sl, "KEY RISKS", CX, 5.44, CW, C.textMd);
    bp.risks.slice(0, 2).forEach((r, i) => {
      box(sl, CX, 5.72 + i * 0.60 + 0.20, 0.10, 0.10, C.dangRd);
      t(sl, r, CX + 0.22, 5.68 + i * 0.60, CW - 0.26, 0.56,
        { fontSize: 13, color: C.textMd, valign: "middle", _max: 100 });
    });
  }
}

function makeRoadmapSlide(pptx: PptxGenJS, rm: FinalResponse["roadmap"], n: number, theme: Theme) {
  const sl = baseSlide(pptx, theme, n);
  panelTag(sl, "EXECUTION PLAN", theme);
  sectionTitle(sl, "90-Day Roadmap", theme);

  const GAP  = 0.24;
  const colW = (CW - 2 * GAP) / 3;

  const COLS = [
    { label: "DAY  0 – 30",  items: rm.day_30, hdr: theme.panel,   bg: theme.accentLt, dot: theme.panel },
    { label: "DAY  31 – 60", items: rm.day_60, hdr: theme.accentDk, bg: C.bgLight,      dot: theme.accentDk },
    { label: "DAY  61 – 90", items: rm.day_90, hdr: C.succGr,      bg: C.succLt,       dot: C.succGr },
  ];

  COLS.forEach((col, ci) => {
    const cx  = CX + ci * (colW + GAP);
    card(sl, cx, 1.55, colW, 5.58, col.bg, col.dot);
    box(sl, cx, 1.55, colW, 0.55, col.hdr);
    sl.addText(col.label, {
      x: cx + 0.08, y: 1.60, w: colW - 0.16, h: 0.44,
      fontSize: 11.5, bold: true, color: C.white, align: "center", valign: "middle",
    });

    col.items.slice(0, 6).forEach((item, i) => {
      const iy = 2.20 + i * 0.82;
      box(sl, cx + 0.16, iy + 0.27, 0.09, 0.09, col.dot);
      t(sl, item, cx + 0.33, iy, colW - 0.46, 0.70,
        { fontSize: 12.5, color: C.textDk, valign: "middle", _max: 55 });
    });
  });

  // Milestones in left panel
  if (rm.milestones.length > 0) {
    lbl(sl, "KEY MILESTONES", 0.20, H - 1.55, LPW - 0.40, theme.accentGh);
    rm.milestones.slice(0, 3).forEach((m, i) => {
      t(sl, trunc(m, 38), 0.20, H - 1.28 + i * 0.36, LPW - 0.35, 0.32,
        { fontSize: 9.5, color: theme.accentGh });
    });
  }
}

function makeClosingSlide(pptx: PptxGenJS, fd: FinalResponse, intake: Record<string, any>, theme: Theme) {
  const sl = pptx.addSlide();

  box(sl, 0, 0, W, H, theme.coverBg);
  circle(sl, 0.8, 7.2, 2.2, theme.coverBg2);
  circle(sl, 12.5, 0.5, 2.5, theme.coverBg2);

  box(sl, 0, 0, W, 0.12, theme.panel);
  box(sl, 0, H - 0.12, W, 0.12, theme.panel);

  sl.addText("What's Next?", {
    x: 1.0, y: 0.92, w: W - 2.0, h: 1.2,
    fontSize: 50, bold: true, color: C.white, align: "center",
  });

  box(sl, W / 2 - 2.6, 2.30, 5.2, 0.06, theme.panel);

  const lastPitch = fd.pitch_deck.slides[fd.pitch_deck.slides.length - 1];
  const items = lastPitch?.bullets?.slice(0, 3) ?? [];

  items.forEach((b, i) => {
    const by = 2.58 + i * 0.90;
    circle(sl, W / 2 - 3.4, by + 0.30, 0.24, theme.panel);
    sl.addText(String(i + 1), {
      x: W / 2 - 3.64, y: by + 0.06, w: 0.48, h: 0.48,
      fontSize: 14, bold: true, color: C.white, align: "center", valign: "middle",
    });
    t(sl, b, W / 2 - 3.0, by, 6.6, 0.72,
      { fontSize: 17, color: C.white, valign: "middle", _max: 90 });
  });

  box(sl, W / 2 - 2.8, 5.60, 5.6, 0.05, theme.panel);
  sl.addText("Built with SheLaunch AI", {
    x: 0, y: 5.82, w: W, h: 0.50,
    fontSize: 15, bold: true, color: theme.accentGh, align: "center",
  });
  sl.addText(`Personalized for ${trunc(intake?.founderName ?? "you", 35)}  ·  Powered by 5 AI Agents`, {
    x: 0, y: 6.34, w: W, h: 0.38,
    fontSize: 11.5, color: C.textLt, align: "center",
  });
}

// ── Main handler ──────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const intake: Record<string, any> = body?.intake ?? {};

  const parsed = FinalResponseSchema.safeParse(body?.final);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid plan data — re-generate your plan first" },
      { status: 400 }
    );
  }
  const fd = parsed.data;

  const theme = pickTheme(intake);

  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";

  let n = 1;

  // 1 – Cover
  makeCover(pptx, intake, fd, theme);
  n++;

  // 2–9 – Semantic pitch slides (each gets its own layout)
  fd.pitch_deck.slides.forEach((s) => {
    makePitchSlide(pptx, s, n++, theme, intake);
  });

  // 10 – Blueprint
  makeBlueprintSlide(pptx, fd.blueprint, n++, theme);

  // 11 – 90-Day Roadmap
  makeRoadmapSlide(pptx, fd.roadmap, n++, theme);

  // 12 – Closing
  makeClosingSlide(pptx, fd, intake, theme);

  const buffer = await pptx.write({ outputType: "nodebuffer" });
  const slug = (intake?.founderName ?? "startup").replace(/\s+/g, "-").toLowerCase();

  return new NextResponse(buffer as any, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "Content-Disposition": `attachment; filename="SheLaunch-${slug}-deck.pptx"`,
    },
  });
}
