"use client";
import React from "react";
import { IntakeSchema, FinalResponseSchema, type FinalResponse, type Intake, type EvaluationResult } from "@/lib/schemas";
import "./globals.css";

// ── Types ─────────────────────────────────────────────────────────────────────

type AgentKey = "vision" | "funding" | "gtm" | "roadmap" | "pitch";
type AgentStatus = "idle" | "started" | "retrying" | "completed" | "failed";

type AgentState = {
  status: AgentStatus;
  startedAt?: number;
  completedAt?: number;
  elapsedMs?: number;
};

type RunSummary = {
  id: string;
  created_at: string;
  provider: string;
  mode: "live" | "mock" | "fallback";
  founderName: string;
  idea: string;
  stage: string;
  evaluation: { overall_score: number; evaluated_at: string } | null;
};

// ── Agent metadata ────────────────────────────────────────────────────────────

const AGENT_META: Record<AgentKey, { label: string; emoji: string; description: string }> = {
  vision: { label: "Vision & Blueprint", emoji: "🔭", description: "Problem, value prop, core features" },
  funding: { label: "Funding Strategy", emoji: "💰", description: "Paths, grants, accelerators, bootstrap" },
  gtm: { label: "Go-To-Market", emoji: "🚀", description: "Positioning, channels, first 10 customers" },
  roadmap: { label: "90-Day Roadmap", emoji: "🗺️", description: "30/60/90 day tasks and milestones" },
  pitch: { label: "Pitch Deck", emoji: "🎤", description: "8 slides, vision, elevator pitch" },
};

const AGENT_KEYS: AgentKey[] = ["vision", "funding", "gtm", "roadmap", "pitch"];

// ── AgentCockpit component ─────────────────────────────────────────────────────

function AgentCockpit({ agents, visible }: { agents: Record<AgentKey, AgentState>; visible: boolean }) {
  if (!visible) return null;
  return (
    <div className="cockpit-grid">
      {AGENT_KEYS.map((key) => {
        const meta = AGENT_META[key];
        const state = agents[key];
        const elapsed = state.elapsedMs != null
          ? `${(state.elapsedMs / 1000).toFixed(1)}s`
          : state.startedAt
          ? `${((Date.now() - state.startedAt) / 1000).toFixed(1)}s…`
          : null;

        return (
          <div key={key} className={`cockpit-card cockpit-card--${state.status}`}>
            <div className="cockpit-header">
              <span className="cockpit-emoji">{meta.emoji}</span>
              <span className="cockpit-label">{meta.label}</span>
              {state.status !== "idle" && (
                <span className={`cockpit-badge cockpit-badge--${state.status}`}>
                  {state.status === "started" && "⏳ working"}
                  {state.status === "retrying" && "🔄 retrying"}
                  {state.status === "completed" && "✅ done"}
                  {state.status === "failed" && "❌ failed"}
                </span>
              )}
            </div>
            <div className="cockpit-desc">{meta.description}</div>
            {elapsed && <div className="cockpit-elapsed">{elapsed}</div>}
            {state.status === "started" && <div className="cockpit-progress-bar"><div className="cockpit-progress-fill" /></div>}
          </div>
        );
      })}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

function initialAgentStates(): Record<AgentKey, AgentState> {
  return { vision: { status: "idle" }, funding: { status: "idle" }, gtm: { status: "idle" }, roadmap: { status: "idle" }, pitch: { status: "idle" } };
}

export default function Page() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<FinalResponse | null>(null);
  const [apiHealth, setApiHealth] = React.useState<{ status: "ok" | "error"; error?: string } | null>(null);
  const [lastIntake, setLastIntake] = React.useState<Intake | null>(null);
  const [runs, setRuns] = React.useState<RunSummary[]>([]);
  const [historyLoading, setHistoryLoading] = React.useState(false);
  const [lastRunId, setLastRunId] = React.useState<string | null>(null);
  const [agentStates, setAgentStates] = React.useState<Record<AgentKey, AgentState>>(initialAgentStates);
  const [showCockpit, setShowCockpit] = React.useState(false);
  const [evaluation, setEvaluation] = React.useState<EvaluationResult | null>(null);
  const [evalLoading, setEvalLoading] = React.useState(false);
  const downloadRef = React.useRef<HTMLAnchorElement | null>(null);
  const cockpitRef = React.useRef<HTMLDivElement | null>(null);

  const loadRuns = React.useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch("/api/runs");
      const json = await res.json();
      setRuns(Array.isArray(json?.items) ? json.items : []);
    } catch { /* non-fatal */ } finally {
      setHistoryLoading(false);
    }
  }, []);

  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/health");
        const json = await res.json();
        setApiHealth({ status: json.status, error: json.error });
      } catch (e: any) {
        setApiHealth({ status: "error", error: e?.message ?? "Health check failed" });
      }
    })();
    loadRuns();
  }, [loadRuns]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setData(null);
    setAgentStates(initialAgentStates());
    setShowCockpit(true);

    // Scroll to cockpit so the user sees it animate
    setTimeout(() => cockpitRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);

    const form = e.currentTarget;
    const fd = new FormData(form);
    const payload = {
      founderName: String(fd.get("founderName") ?? ""),
      idea: String(fd.get("idea") ?? ""),
      targetCustomer: String(fd.get("targetCustomer") ?? ""),
      stage: String(fd.get("stage") ?? "ideation"),
      region: String(fd.get("region") ?? ""),
      industry: String(fd.get("industry") ?? ""),
      goals: String(fd.get("goals") ?? ""),
      constraints: String(fd.get("constraints") ?? ""),
      challenge: String(fd.get("challenge") ?? ""),
    };

    const parsed = IntakeSchema.safeParse(payload);
    if (!parsed.success) {
      setError(parsed.error.errors.map((e) => e.message).join("; "));
      setLoading(false);
      setShowCockpit(false);
      return;
    }
    setLastIntake(parsed.data);

    try {
      const res = await fetch("/api/runAgents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";

        for (const chunk of lines) {
          const line = chunk.replace(/^data: /, "").trim();
          if (!line) continue;

          let event: any;
          try { event = JSON.parse(line); } catch { continue; }

          if (event.type === "agent_started") {
            setAgentStates((prev) => ({
              ...prev,
              [event.agent]: { status: "started", startedAt: Date.now() },
            }));
          } else if (event.type === "agent_retrying") {
            setAgentStates((prev) => ({
              ...prev,
              [event.agent]: { ...prev[event.agent as AgentKey], status: "retrying" },
            }));
          } else if (event.type === "agent_completed") {
            setAgentStates((prev) => {
              const start = prev[event.agent as AgentKey].startedAt;
              return {
                ...prev,
                [event.agent]: {
                  status: "completed",
                  startedAt: start,
                  completedAt: Date.now(),
                  elapsedMs: start ? Date.now() - start : undefined,
                },
              };
            });
          } else if (event.type === "agent_failed") {
            setAgentStates((prev) => ({
              ...prev,
              [event.agent]: { ...prev[event.agent as AgentKey], status: "failed" },
            }));
          } else if (event.type === "done") {
            const validated = FinalResponseSchema.parse(event.final);
            setData(validated);
            setLastRunId(typeof event.run_id === "string" ? event.run_id : null);
            await loadRuns();
          } else if (event.type === "error") {
            throw new Error(event.error ?? "Stream error");
          }
        }
      }
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // ── Export helpers ──────────────────────────────────────────────────────────

  const copyJson = async () => {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      alert("JSON copied to clipboard");
    } catch { alert("Failed to copy JSON"); }
  };

  const toMarkdown = (d: FinalResponse) => {
    const lines: string[] = [];
    lines.push("# SheLaunch Plan\n");
    lines.push("## Founder Blueprint");
    lines.push(`- **Problem:** ${d.blueprint.problem_statement}`);
    lines.push(`- **Target Customer:** ${d.blueprint.target_customer}`);
    lines.push(`- **Value Proposition:** ${d.blueprint.value_proposition}`);
    lines.push(`- **Unique Angle:** ${d.blueprint.unique_angle}`);
    if (d.blueprint.core_features.length) {
      lines.push("- **Core Features:**");
      d.blueprint.core_features.forEach((f) => lines.push(`  - ${f}`));
    }
    if (d.blueprint.risks.length) {
      lines.push("- **Risks:**");
      d.blueprint.risks.forEach((f) => lines.push(`  - ${f}`));
    }
    if (d.blueprint.assumptions.length) {
      lines.push("- **Assumptions:**");
      d.blueprint.assumptions.forEach((f) => lines.push(`  - ${f}`));
    }
    lines.push("\n## Funding Strategy");
    lines.push(`- **Recommended Path:** ${d.funding.recommended_funding_path}`);
    if (d.funding.top_3_next_steps.length) {
      lines.push("- **Top 3 Next Steps:**");
      d.funding.top_3_next_steps.forEach((f) => lines.push(`  - ${f}`));
    }
    if (d.funding.grants_and_programs.length) {
      lines.push("- **Grants & Programs:**");
      d.funding.grants_and_programs.forEach((f) => lines.push(`  - ${f}`));
    }
    if (d.funding.accelerator_types.length) {
      lines.push("- **Accelerator Types:**");
      d.funding.accelerator_types.forEach((f) => lines.push(`  - ${f}`));
    }
    lines.push(`- **Bootstrap Strategy:** ${d.funding.bootstrap_strategy}`);
    if (d.funding.pitch_focus.length) {
      lines.push("- **Pitch Focus:**");
      d.funding.pitch_focus.forEach((f) => lines.push(`  - ${f}`));
    }
    lines.push("\n## Go-To-Market");
    lines.push(`- **Positioning:** ${d.gtm.positioning_statement}`);
    [["Channels", d.gtm.channels], ["Validation Experiments", d.gtm.validation_experiments], ["First 10 Customers", d.gtm.first_10_customers_plan], ["Success Metrics", d.gtm.success_metrics]].forEach(([label, items]) => {
      if ((items as string[]).length) {
        lines.push(`- **${label}:**`);
        (items as string[]).forEach((i) => lines.push(`  - ${i}`));
      }
    });
    lines.push("\n## 90-Day Roadmap");
    [["30 Days", d.roadmap.day_30], ["60 Days", d.roadmap.day_60], ["90 Days", d.roadmap.day_90], ["Milestones", d.roadmap.milestones], ["Metrics", d.roadmap.metrics_to_track]].forEach(([label, items]) => {
      lines.push(`- **${label}:**`);
      (items as string[]).forEach((i) => lines.push(`  - ${i}`));
    });
    lines.push("\n## Pitch Deck");
    lines.push(`- **Vision:** ${d.pitch_deck.one_sentence_vision}`);
    lines.push(`- **Elevator Pitch:** ${d.pitch_deck.elevator_pitch}`);
    d.pitch_deck.slides.forEach((s, idx) => {
      lines.push(`  ${idx + 1}. **${s.title}**`);
      s.bullets.forEach((b) => lines.push(`     - ${b}`));
    });
    return lines.join("\n");
  };

  const downloadMarkdown = () => {
    if (!data) return;
    const blob = new Blob([toMarkdown(data)], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = downloadRef.current || document.createElement("a");
    a.href = url;
    a.download = "SheLaunch-Plan.md";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 0);
  };

  const downloadPpt = async () => {
    try {
      const res = await fetch("/api/ppt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "SheLaunch AI Deck", final: data, intake: lastIntake }),
      });
      if (!res.ok) throw new Error("Failed to generate PPT");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "SheLaunch-Deck.pptx";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(e?.message ?? "Failed to download PPT");
    }
  };

  const loadRun = async (id: string) => {
    try {
      const res = await fetch(`/api/runs/${id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to load run");
      const validated = FinalResponseSchema.parse(json.final);
      setData(validated);
      setLastIntake(json.intake as Intake);
      setLastRunId(json.id as string);
      setError(null);
      setShowCockpit(false);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load run");
    }
  };

  const evaluateRun = async (id: string) => {
    setEvalLoading(true);
    setEvaluation(null);
    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ run_id: id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to evaluate run");
      setEvaluation(json.evaluation as EvaluationResult);
      await loadRuns();
    } catch (e: any) {
      setError(e?.message ?? "Failed to evaluate run");
    } finally {
      setEvalLoading(false);
    }
  };

  const completedCount = AGENT_KEYS.filter((k) => agentStates[k].status === "completed").length;

  return (
    <div className="container">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.8rem" }}>SheLaunch AI</h1>
            <p className="trace" style={{ marginTop: 4 }}>Agentic startup copilot — 5 AI agents, one actionable plan</p>
          </div>
          {apiHealth && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: apiHealth.status === "ok" ? "var(--success)" : "#ff6b6b", display: "inline-block" }} />
              <span className="trace">{apiHealth.status === "ok" ? "API connected" : `API error — ${apiHealth.error}`}</span>
            </div>
          )}
        </div>
      </header>

      {/* ── Intake form ─────────────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="card section">
        <h2 style={{ marginTop: 0, marginBottom: 16 }}>Tell us about your startup</h2>
        <div className="grid">
          <div className="field">
            <label className="field-label">Founder Name</label>
            <input name="founderName" placeholder="Your name" required />
          </div>
          <div className="field">
            <label className="field-label">Region</label>
            <input name="region" placeholder="City or Country" required />
          </div>
          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <label className="field-label">Startup Idea</label>
            <textarea name="idea" placeholder="Describe your startup idea in a few sentences" rows={3} required />
          </div>
          <div className="field">
            <label className="field-label">Target Customer</label>
            <input name="targetCustomer" placeholder="e.g., busy moms, SMBs" required />
          </div>
          <div className="field">
            <label className="field-label">Stage</label>
            <select name="stage" defaultValue="ideation">
              <option value="ideation">Ideation</option>
              <option value="prototype">Prototype</option>
              <option value="beta">Beta</option>
              <option value="launched">Launched</option>
            </select>
          </div>
          <div className="field">
            <label className="field-label">Industry</label>
            <input name="industry" placeholder="e.g., healthtech, edtech" required />
          </div>
          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <label className="field-label">Goals <span className="field-hint">(optional — helps agents be more specific)</span></label>
            <input name="goals" placeholder="e.g., onboard 10 paying customers in 60 days" />
          </div>
          <div className="field">
            <label className="field-label">Constraints <span className="field-hint">(optional)</span></label>
            <input name="constraints" placeholder="e.g., $500 budget, solo founder, 10 hrs/week" />
          </div>
          <div className="field">
            <label className="field-label">Biggest Challenge <span className="field-hint">(optional)</span></label>
            <input name="challenge" placeholder="e.g., finding early customers, validating the idea" />
          </div>
        </div>
        <div style={{ marginTop: 16, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? `Generating… (${completedCount}/5 agents done)` : "Generate Plan"}
          </button>
          {error && <span className="error-text">{error}</span>}
        </div>
      </form>

      {/* ── Agent Cockpit ─────────────────────────────────────────────────── */}
      <div ref={cockpitRef}>
        {showCockpit && (
          <div className="card section">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <h2 style={{ margin: 0 }}>Agent Cockpit</h2>
              <span className="trace">{completedCount}/5 agents completed</span>
            </div>
            <AgentCockpit agents={agentStates} visible={true} />
            {loading && (
              <div style={{ marginTop: 14, textAlign: "center" }}>
                <span className="trace">Agents running in parallel — results appear as each one finishes…</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Action bar ──────────────────────────────────────────────────────── */}
      {data && (
        <div className="card section" style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <strong style={{ marginRight: 4 }}>Export:</strong>
          <button onClick={copyJson} className="btn-secondary">Copy JSON</button>
          <button onClick={downloadMarkdown} className="btn-secondary">↓ Markdown</button>
          <button onClick={downloadPpt} className="btn-secondary">↓ PPTX Deck</button>
          {lastRunId && <span className="trace" style={{ marginLeft: "auto" }}>Run: {lastRunId.slice(0, 20)}…</span>}
        </div>
      )}

      {/* ── Results ─────────────────────────────────────────────────────────── */}
      {data && (
        <div className="section results-grid">
          {/* Blueprint */}
          <div className="card result-card">
            <h2 className="result-heading">🔭 Founder Blueprint</h2>
            <ResultItem label="Problem" value={data.blueprint.problem_statement} />
            <ResultItem label="Target Customer" value={data.blueprint.target_customer} />
            <ResultItem label="Value Proposition" value={data.blueprint.value_proposition} />
            <ResultItem label="Unique Angle" value={data.blueprint.unique_angle} />
            <ResultList label="Core Features" items={data.blueprint.core_features} />
            {data.blueprint.risks.length > 0 && <ResultList label="Risks" items={data.blueprint.risks} />}
            {data.blueprint.assumptions.length > 0 && <ResultList label="Assumptions" items={data.blueprint.assumptions} />}
          </div>

          {/* Funding */}
          <div className="card result-card">
            <h2 className="result-heading">💰 Funding Strategy</h2>
            <ResultItem label="Recommended Path" value={data.funding.recommended_funding_path} />
            <ResultList label="Top 3 Next Steps" items={data.funding.top_3_next_steps} highlight />
            {data.funding.grants_and_programs.length > 0 && <ResultList label="Grants & Programs" items={data.funding.grants_and_programs} />}
            {data.funding.accelerator_types.length > 0 && <ResultList label="Accelerators" items={data.funding.accelerator_types} />}
            <ResultItem label="Bootstrap Strategy" value={data.funding.bootstrap_strategy} />
            {data.funding.pitch_focus.length > 0 && <ResultList label="Pitch Focus" items={data.funding.pitch_focus} />}
            {data.funding.risks_and_mitigations.length > 0 && <ResultList label="Risks & Mitigations" items={data.funding.risks_and_mitigations} />}
          </div>

          {/* GTM */}
          <div className="card result-card">
            <h2 className="result-heading">🚀 Go-To-Market</h2>
            <ResultItem label="Positioning" value={data.gtm.positioning_statement} />
            <ResultList label="Ideal Early Adopters" items={data.gtm.ideal_early_adopters} />
            <ResultList label="Validation Experiments" items={data.gtm.validation_experiments} highlight />
            <ResultList label="First 10 Customers Plan" items={data.gtm.first_10_customers_plan} />
            <ResultList label="Channels" items={data.gtm.channels} />
            {data.gtm.partnership_ideas.length > 0 && <ResultList label="Partnership Ideas" items={data.gtm.partnership_ideas} />}
            <ResultList label="Success Metrics" items={data.gtm.success_metrics} />
          </div>

          {/* Roadmap */}
          <div className="card result-card">
            <h2 className="result-heading">🗺️ 90-Day Roadmap</h2>
            <ResultList label="Day 0–30" items={data.roadmap.day_30} highlight />
            <ResultList label="Day 31–60" items={data.roadmap.day_60} />
            <ResultList label="Day 61–90" items={data.roadmap.day_90} />
            <ResultList label="Milestones" items={data.roadmap.milestones} />
            <ResultList label="Metrics to Track" items={data.roadmap.metrics_to_track} />
          </div>

          {/* Pitch Deck */}
          <div className="card result-card result-card--wide">
            <h2 className="result-heading">🎤 Pitch Deck</h2>
            <ResultItem label="Vision" value={data.pitch_deck.one_sentence_vision} />
            <ResultItem label="Elevator Pitch" value={data.pitch_deck.elevator_pitch} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12, marginTop: 12 }}>
              {data.pitch_deck.slides.map((s, i) => (
                <div key={i} className="slide-card">
                  <div className="slide-number">{i + 1}</div>
                  <div className="slide-title">{s.title}</div>
                  <ul className="slide-bullets">
                    {s.bullets.map((b, j) => <li key={j}>{b}</li>)}
                  </ul>
                </div>
              ))}
            </div>
            {data.pitch_deck.demo_script_30s.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <strong>30s Demo Script:</strong>
                <ol style={{ marginTop: 6, paddingLeft: 20 }}>
                  {data.pitch_deck.demo_script_30s.map((b, j) => <li key={j} style={{ marginBottom: 4 }}>{b}</li>)}
                </ol>
              </div>
            )}
          </div>

          {/* Agent Trace */}
          <div className="card result-card result-card--wide">
            <h2 className="result-heading">Agent Execution Trace</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 8, marginTop: 8 }}>
              {AGENT_KEYS.map((key) => {
                const traceItems = data.agent_trace.filter((t) => t.agent === key);
                const meta = AGENT_META[key];
                return (
                  <div key={key} style={{ background: "#0b0f14", borderRadius: 8, padding: "10px 12px" }}>
                    <div style={{ fontWeight: 600, marginBottom: 6 }}>{meta.emoji} {meta.label}</div>
                    {traceItems.map((t, i) => (
                      <div key={i} className="trace" style={{ display: "flex", gap: 8, marginBottom: 2 }}>
                        <span style={{ opacity: 0.5 }}>{new Date(t.timestamp).toLocaleTimeString()}</span>
                        <span style={{ color: t.status === "completed" ? "var(--success)" : t.status === "failed" ? "#ff6b6b" : t.status === "retrying" ? "#ffc107" : "var(--muted)" }}>
                          {t.status}{t.message ? ` — ${t.message}` : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Evaluation */}
          {lastRunId && (
            <div className="card result-card result-card--wide">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <h2 className="result-heading" style={{ margin: 0, borderBottom: "none", paddingBottom: 0 }}>Plan Quality Evaluation</h2>
                <button onClick={() => evaluateRun(lastRunId)} disabled={evalLoading} className="btn-secondary">
                  {evalLoading ? "Evaluating…" : evaluation ? "Re-evaluate" : "Evaluate with Claude"}
                </button>
              </div>
              {!evaluation && !evalLoading && (
                <p className="trace" style={{ marginTop: 8 }}>
                  Claude acts as a judge — scores this plan on actionability, specificity, consistency, and risk clarity. Gives concrete, founder-specific improvements.
                </p>
              )}
              {evalLoading && (
                <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 10 }}>
                  <div className="cockpit-progress-bar" style={{ flex: 1 }}><div className="cockpit-progress-fill" /></div>
                  <span className="trace">Claude is reviewing your plan…</span>
                </div>
              )}
              {evaluation && <EvaluationScorecard evaluation={evaluation} />}
            </div>
          )}
        </div>
      )}

      {/* ── Run History ─────────────────────────────────────────────────────── */}
      <div className="card section">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <h2 style={{ margin: 0 }}>Run History</h2>
          <button onClick={loadRuns} disabled={historyLoading} className="btn-secondary">{historyLoading ? "Refreshing…" : "Refresh"}</button>
        </div>
        {runs.length === 0 ? (
          <p className="trace">No runs yet. Generate your first plan above.</p>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {runs.slice(0, 8).map((run) => (
              <div key={run.id} className="history-item" onClick={() => loadRun(run.id)}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                  <strong>{run.founderName} — {run.stage}</strong>
                  <span className="trace">{new Date(run.created_at).toLocaleString()}</span>
                </div>
                <div className="trace" style={{ marginTop: 2 }}>{run.idea.slice(0, 100)}{run.idea.length > 100 ? "…" : ""}</div>
                <div style={{ marginTop: 6, display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <span className="trace">Provider: {run.provider} · Mode: {run.mode}</span>
                  <span className="trace">Score: {run.evaluation ? `${run.evaluation.overall_score}/100` : "—"}</span>
                  <span
                    className="trace"
                    style={{ textDecoration: "underline", cursor: "pointer" }}
                    onClick={(e) => { e.stopPropagation(); evaluateRun(run.id); }}
                  >Evaluate</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Small presentational helpers ─────────────────────────────────────────────

function ResultItem({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <span style={{ color: "var(--muted)", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
      <p style={{ margin: "3px 0 0", lineHeight: 1.5 }}>{value}</p>
    </div>
  );
}

function ResultList({ label, items, highlight }: { label: string; items: string[]; highlight?: boolean }) {
  if (!items.length) return null;
  return (
    <div style={{ marginBottom: 10 }}>
      <span style={{ color: "var(--muted)", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
      <ul style={{ margin: "4px 0 0", paddingLeft: 18 }}>
        {items.map((item, i) => (
          <li key={i} style={{ marginBottom: 3, color: highlight ? "var(--text)" : "var(--muted)", fontWeight: highlight ? 500 : 400 }}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

// ── EvaluationScorecard ───────────────────────────────────────────────────────

function ScorePill({ label, score }: { label: string; score: number }) {
  const color = score >= 80 ? "var(--success)" : score >= 60 ? "var(--warning)" : "var(--danger)";
  const pct = `${score}%`;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "0.78rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
        <span style={{ fontSize: "0.9rem", fontWeight: 700, color }}>{score}</span>
      </div>
      <div style={{ height: 6, background: "#1c2430", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: pct, background: color, borderRadius: 3, transition: "width 0.6s ease" }} />
      </div>
    </div>
  );
}

function EvaluationScorecard({ evaluation }: { evaluation: EvaluationResult }) {
  const overall = evaluation.overall_score;
  const overallColor = overall >= 80 ? "var(--success)" : overall >= 60 ? "var(--warning)" : "var(--danger)";
  const isLLM = evaluation.evaluator === "claude-judge-v1";

  return (
    <div style={{ marginTop: 16 }}>
      {/* Overall score + evaluator badge */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
        <div style={{ textAlign: "center", minWidth: 80 }}>
          <div style={{ fontSize: "2.8rem", fontWeight: 800, color: overallColor, lineHeight: 1 }}>{overall}</div>
          <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: 2 }}>/ 100</div>
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: "1rem" }}>Overall Plan Quality</div>
          <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{
              fontSize: "0.72rem", padding: "2px 8px", borderRadius: 99, fontWeight: 600,
              background: isLLM ? "#1a0e3a" : "#1a1a1a",
              color: isLLM ? "#c9b8ff" : "var(--muted)",
              border: `1px solid ${isLLM ? "#4a2fa0" : "#333"}`
            }}>
              {isLLM ? "Claude Judge" : "Heuristic"}
            </span>
            <span className="trace">{new Date(evaluation.evaluated_at).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* 4 score bars */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 24px", marginBottom: 20 }}>
        <ScorePill label="Actionability" score={evaluation.actionability_score} />
        <ScorePill label="Specificity" score={evaluation.specificity_score} />
        <ScorePill label="Consistency" score={evaluation.consistency_score} />
        <ScorePill label="Risk Clarity" score={evaluation.risk_clarity_score} />
      </div>

      {/* Strengths / Weaknesses / Next steps */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        {evaluation.strengths.length > 0 && (
          <div style={{ background: "#0a1a10", border: "1px solid #1a3a22", borderRadius: 8, padding: "12px 14px" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--success)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Strengths</div>
            <ul style={{ margin: 0, paddingLeft: 16 }}>
              {evaluation.strengths.map((s, i) => (
                <li key={i} style={{ fontSize: "0.84rem", marginBottom: 6, color: "var(--text)", lineHeight: 1.4 }}>{s}</li>
              ))}
            </ul>
          </div>
        )}
        {evaluation.weaknesses.length > 0 && (
          <div style={{ background: "#1a0d0d", border: "1px solid #3a1a1a", borderRadius: 8, padding: "12px 14px" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--danger)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Weaknesses</div>
            <ul style={{ margin: 0, paddingLeft: 16 }}>
              {evaluation.weaknesses.map((s, i) => (
                <li key={i} style={{ fontSize: "0.84rem", marginBottom: 6, color: "var(--text)", lineHeight: 1.4 }}>{s}</li>
              ))}
            </ul>
          </div>
        )}
        {evaluation.next_improvements.length > 0 && (
          <div style={{ background: "#0e1020", border: "1px solid #2a2a50", borderRadius: 8, padding: "12px 14px" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#c9b8ff", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Next Improvements</div>
            <ol style={{ margin: 0, paddingLeft: 18 }}>
              {evaluation.next_improvements.map((s, i) => (
                <li key={i} style={{ fontSize: "0.84rem", marginBottom: 6, color: "var(--text)", lineHeight: 1.4 }}>{s}</li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
