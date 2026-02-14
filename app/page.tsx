"use client";
import React from "react";
import { IntakeSchema, FinalResponseSchema, type FinalResponse, type Intake } from "@/lib/schemas";
import "./globals.css";

export default function Page() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<FinalResponse | null>(null);
  const [apiHealth, setApiHealth] = React.useState<{ status: "ok" | "error"; error?: string } | null>(null);
  const downloadRef = React.useRef<HTMLAnchorElement | null>(null);
  const [lastIntake, setLastIntake] = React.useState<Intake | null>(null);

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
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setData(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const payload = {
      founderName: String(formData.get("founderName") ?? ""),
      idea: String(formData.get("idea") ?? ""),
      targetCustomer: String(formData.get("targetCustomer") ?? ""),
      stage: String(formData.get("stage") ?? "ideation"),
      region: String(formData.get("region") ?? ""),
      industry: String(formData.get("industry") ?? ""),
      goals: String(formData.get("goals") ?? ""),
      constraints: String(formData.get("constraints") ?? ""),
      challenge: String(formData.get("challenge") ?? ""),
    };

    const parsed = IntakeSchema.safeParse(payload);
    if (!parsed.success) {
      setError(parsed.error.errors.map(e => e.message).join("; "));
      setLoading(false);
      return;
    }
    setLastIntake(parsed.data);

    try {
      const res = await fetch("/api/runAgents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Request failed");
      const validated = FinalResponseSchema.parse(json);
      setData(validated);
    } catch (err: any) {
      setError(err.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const copyJson = async () => {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      alert("JSON copied to clipboard");
    } catch {
      alert("Failed to copy JSON");
    }
  };

  const toMarkdown = (d: FinalResponse) => {
    const lines: string[] = [];
    lines.push(`# SheLaunch Plan`);
    lines.push("");
    lines.push(`## Founder Blueprint`);
    lines.push(`- **Problem:** ${d.blueprint.problem_statement}`);
    lines.push(`- **Target Customer:** ${d.blueprint.target_customer}`);
    lines.push(`- **Value Proposition:** ${d.blueprint.value_proposition}`);
    lines.push(`- **Unique Angle:** ${d.blueprint.unique_angle}`);
    if (d.blueprint.core_features.length) {
      lines.push(`- **Core Features:**`);
      d.blueprint.core_features.forEach(f => lines.push(`  - ${f}`));
    }
    if (d.blueprint.risks.length) {
      lines.push(`- **Risks:**`);
      d.blueprint.risks.forEach(f => lines.push(`  - ${f}`));
    }
    if (d.blueprint.assumptions.length) {
      lines.push(`- **Assumptions:**`);
      d.blueprint.assumptions.forEach(f => lines.push(`  - ${f}`));
    }
    lines.push("");

    lines.push(`## Funding Strategy`);
    lines.push(`- **Recommended Path:** ${d.funding.recommended_funding_path}`);
    if (d.funding.top_3_next_steps.length) {
      lines.push(`- **Top 3 Next Steps:**`);
      d.funding.top_3_next_steps.forEach(f => lines.push(`  - ${f}`));
    }
    if (d.funding.grants_and_programs.length) {
      lines.push(`- **Grants & Programs:**`);
      d.funding.grants_and_programs.forEach(f => lines.push(`  - ${f}`));
    }
    if (d.funding.accelerator_types.length) {
      lines.push(`- **Accelerator Types:**`);
      d.funding.accelerator_types.forEach(f => lines.push(`  - ${f}`));
    }
    lines.push(`- **Bootstrap Strategy:** ${d.funding.bootstrap_strategy}`);
    if (d.funding.pitch_focus.length) {
      lines.push(`- **Pitch Focus:**`);
      d.funding.pitch_focus.forEach(f => lines.push(`  - ${f}`));
    }
    if (d.funding.risks_and_mitigations.length) {
      lines.push(`- **Risks & Mitigations:**`);
      d.funding.risks_and_mitigations.forEach(f => lines.push(`  - ${f}`));
    }
    lines.push("");

    lines.push(`## Go-To-Market`);
    lines.push(`- **Positioning Statement:** ${d.gtm.positioning_statement}`);
    const gtmLists: Array<[string, string[]]> = [
      ["Ideal Early Adopters", d.gtm.ideal_early_adopters],
      ["Validation Experiments", d.gtm.validation_experiments],
      ["First 10 Customers Plan", d.gtm.first_10_customers_plan],
      ["Channels", d.gtm.channels],
      ["Partnership Ideas", d.gtm.partnership_ideas],
      ["Success Metrics", d.gtm.success_metrics],
    ];
    gtmLists.forEach(([title, items]) => {
      if (items.length) {
        lines.push(`- **${title}:**`);
        items.forEach(i => lines.push(`  - ${i}`));
      }
    });
    lines.push("");

    lines.push(`## 90-Day Roadmap`);
    const rmLists: Array<[string, string[]]> = [
      ["30 Days", d.roadmap.day_30],
      ["60 Days", d.roadmap.day_60],
      ["90 Days", d.roadmap.day_90],
      ["Milestones", d.roadmap.milestones],
      ["Metrics to Track", d.roadmap.metrics_to_track],
    ];
    rmLists.forEach(([title, items]) => {
      if (items.length) {
        lines.push(`- **${title}:**`);
        items.forEach(i => lines.push(`  - ${i}`));
      }
    });
    lines.push("");

    lines.push(`## Pitch Deck`);
    lines.push(`- **Vision:** ${d.pitch_deck.one_sentence_vision}`);
    lines.push(`- **Elevator Pitch:** ${d.pitch_deck.elevator_pitch}`);
    if (d.pitch_deck.slides.length) {
      lines.push(`- **Slides:**`);
      d.pitch_deck.slides.forEach((s, idx) => {
        lines.push(`  - ${idx + 1}. ${s.title}`);
        s.bullets.forEach(b => lines.push(`    - ${b}`));
      });
    }
    if (d.pitch_deck.demo_script_30s.length) {
      lines.push(`- **30s Demo Script:**`);
      d.pitch_deck.demo_script_30s.forEach(b => lines.push(`  - ${b}`));
    }
    lines.push("");

    lines.push(`## Agent Trace`);
    d.agent_trace.forEach(t => {
      lines.push(`- ${new Date(t.timestamp).toLocaleTimeString()} — ${t.agent}: ${t.status}${t.message ? ` (${t.message})` : ""}`);
    });
    return lines.join("\n");
  };

  const downloadMarkdown = () => {
    if (!data) return;
    const md = toMarkdown(data);
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = downloadRef.current || document.createElement("a");
    a.href = url;
    a.download = "SheLaunch-Plan.md";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(url);
      a.remove();
    }, 0);
  };

  const downloadPPTX = async () => {
    if (!data) return;
    const stageLabel = (lastIntake?.stage ?? "Ideation").toString();
    const filename = `SheLaunch-Pitch-${stageLabel}.pptx`;
    const PptxGenJS = (await import("pptxgenjs")).default;
    const pptx = new PptxGenJS();

    // Theme defaults
    const titleOpts = { x: 0.5, y: 0.5, w: 9, fontSize: 28, bold: true } as const;
    const textOpts = { x: 0.5, y: 1.2, w: 9, fontSize: 18 } as const;
    const bulletsOpts = { x: 0.7, y: 1.8, w: 8.6, fontSize: 18, bullet: true } as const;

    // Cover slide
    {
      const slide = pptx.addSlide();
      slide.addText("SheLaunch — Pitch Deck", titleOpts);
      slide.addText(`Stage: ${stageLabel}`, { ...textOpts, y: 1.2 });
      slide.addText(`Vision: ${data.pitch_deck.one_sentence_vision}`, { ...textOpts, y: 2.0 });
      slide.addText("Elevator Pitch:", { ...textOpts, y: 2.8, bold: true });
      slide.addText(data.pitch_deck.elevator_pitch, { x: 0.5, y: 3.3, w: 9, fontSize: 16 });
    }

    // Slides 1–8 from JSON
    data.pitch_deck.slides.forEach((s, idx) => {
      const slide = pptx.addSlide();
      slide.addText(`${idx + 1}. ${s.title}`, titleOpts);
      slide.addText("", textOpts); // spacer
      slide.addText(s.bullets.map(b => `• ${b}`).join("\n"), bulletsOpts);
    });

    // Optional demo script
    if (data.pitch_deck.demo_script_30s.length) {
      const slide = pptx.addSlide();
      slide.addText("30s Demo Script", titleOpts);
      slide.addText(data.pitch_deck.demo_script_30s.map(b => `• ${b}`).join("\n"), bulletsOpts);
    }

    // Save file
    await pptx.writeFile({ fileName: filename });
  };

  return (
    <div className="container">
      {apiHealth && (
        <div className="card" style={{ marginBottom: 12, borderColor: apiHealth.status === 'ok' ? '#2ecc71' : '#ff6b6b' }}>
          <strong>API Status:</strong> {apiHealth.status === 'ok' ? 'Connected' : `Error — ${apiHealth.error || 'Unknown'}`}
        </div>
      )}
      <h1 style={{ marginBottom: 12 }}>SheLaunch AI</h1>
      <p className="trace">Agentic startup copilot for women entrepreneurs</p>
      <form onSubmit={handleSubmit} className="card section">
        <div className="grid">
          <div>
            <label>Founder Name</label>
            <input name="founderName" placeholder="Your name" required />
          </div>
          <div>
            <label>Region</label>
            <input name="region" placeholder="City/Country" required />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label>Idea</label>
            <textarea name="idea" placeholder="Describe your startup idea" rows={3} required />
          </div>
          <div>
            <label>Target Customer</label>
            <input name="targetCustomer" placeholder="e.g., busy moms, SMBs" required />
          </div>
          <div>
            <label>Stage</label>
            <select name="stage" defaultValue="ideation">
              <option value="ideation">Ideation</option>
              <option value="prototype">Prototype</option>
              <option value="beta">Beta</option>
              <option value="launched">Launched</option>
            </select>
          </div>
          <div>
            <label>Industry</label>
            <input name="industry" placeholder="e.g., healthtech, edtech" required />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label>Goals</label>
            <input name="goals" placeholder="What outcomes do you want?" />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label>Constraints</label>
            <input name="constraints" placeholder="Time, budget, resources" />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label>Biggest Challenge</label>
            <input name="challenge" placeholder="What's the biggest blocker right now?" />
          </div>
        </div>
        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <button type="submit" disabled={loading}>{loading ? "Running agents…" : "Generate Plan"}</button>
          {error && <span style={{ color: '#ff6b6b' }}>{error}</span>}
        </div>
      </form>

      {data && (
        <div className="section" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="card" style={{ gridColumn: '1 / -1', display: 'flex', gap: 8, alignItems: 'center' }}>
            <strong>Actions:</strong>
            <button onClick={copyJson}>Copy JSON</button>
            <button onClick={downloadMarkdown}>Download Markdown</button>
            <button onClick={downloadPPTX}>Download PPTX</button>
          </div>
          <div className="card">
            <h2>Founder Blueprint</h2>
            <p><strong>Problem:</strong> {data.blueprint.problem_statement}</p>
            <p><strong>Target Customer:</strong> {data.blueprint.target_customer}</p>
            <p><strong>Value Proposition:</strong> {data.blueprint.value_proposition}</p>
            <p><strong>Unique Angle:</strong> {data.blueprint.unique_angle}</p>
            <p><strong>Core Features:</strong></p>
            <ul>
              {data.blueprint.core_features.map((c, i) => <li key={i}>{c}</li>)}
            </ul>
            {data.blueprint.risks.length > 0 && (
              <>
                <p><strong>Risks:</strong></p>
                <ul>
                  {data.blueprint.risks.map((c, i) => <li key={i}>{c}</li>)}
                </ul>
              </>
            )}
            {data.blueprint.assumptions.length > 0 && (
              <>
                <p><strong>Assumptions:</strong></p>
                <ul>
                  {data.blueprint.assumptions.map((c, i) => <li key={i}>{c}</li>)}
                </ul>
              </>
            )}
          </div>

          <div className="card">
            <h2>Funding Strategy</h2>
            <p><strong>Recommended Path:</strong> {data.funding.recommended_funding_path}</p>
            <p><strong>Top 3 Next Steps:</strong></p>
            <ul>
              {data.funding.top_3_next_steps.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
            <p><strong>Grants & Programs:</strong></p>
            <ul>
              {data.funding.grants_and_programs.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
            <p><strong>Accelerator Types:</strong></p>
            <ul>
              {data.funding.accelerator_types.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
            <p><strong>Bootstrap Strategy:</strong> {data.funding.bootstrap_strategy}</p>
            <p><strong>Pitch Focus:</strong></p>
            <ul>
              {data.funding.pitch_focus.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
            {data.funding.risks_and_mitigations.length > 0 && (
              <>
                <p><strong>Risks & Mitigations:</strong></p>
                <ul>
                  {data.funding.risks_and_mitigations.map((t, i) => <li key={i}>{t}</li>)}
                </ul>
              </>
            )}
          </div>

          <div className="card">
            <h2>Go-To-Market</h2>
            <p><strong>Positioning Statement:</strong> {data.gtm.positioning_statement}</p>
            <p><strong>Ideal Early Adopters:</strong></p>
            <ul>
              {data.gtm.ideal_early_adopters.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
            <p><strong>Validation Experiments:</strong></p>
            <ul>
              {data.gtm.validation_experiments.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
            <p><strong>First 10 Customers Plan:</strong></p>
            <ul>
              {data.gtm.first_10_customers_plan.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
            <p><strong>Channels:</strong></p>
            <ul>
              {data.gtm.channels.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
            <p><strong>Partnership Ideas:</strong></p>
            <ul>
              {data.gtm.partnership_ideas.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
            <p><strong>Success Metrics:</strong></p>
            <ul>
              {data.gtm.success_metrics.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
          </div>

          <div className="card">
            <h2>90-Day Roadmap</h2>
            <p><strong>30 Days:</strong></p>
            <ul>
              {data.roadmap.day_30.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
            <p><strong>60 Days:</strong></p>
            <ul>
              {data.roadmap.day_60.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
            <p><strong>90 Days:</strong></p>
            <ul>
              {data.roadmap.day_90.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
            <p><strong>Milestones:</strong></p>
            <ul>
              {data.roadmap.milestones.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
            <p><strong>Metrics to Track:</strong></p>
            <ul>
              {data.roadmap.metrics_to_track.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
          </div>

          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <h2>Pitch Deck</h2>
            <p><strong>Vision:</strong> {data.pitch_deck.one_sentence_vision}</p>
            <p><strong>Elevator Pitch:</strong> {data.pitch_deck.elevator_pitch}</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {data.pitch_deck.slides.map((s, i) => (
                <div key={i} className="card">
                  <h3>{i + 1}. {s.title}</h3>
                  <ul>
                    {s.bullets.map((b, j) => <li key={j}>{b}</li>)}
                  </ul>
                </div>
              ))}
            </div>
            {data.pitch_deck.demo_script_30s.length > 0 && (
              <>
                <p><strong>30s Demo Script:</strong></p>
                <ul>
                  {data.pitch_deck.demo_script_30s.map((b, j) => <li key={j}>{b}</li>)}
                </ul>
              </>
            )}
          </div>

          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <h2>Agent Trace</h2>
            <ul className="trace">
              {data.agent_trace.map((t, i) => (
                <li key={i}>{new Date(t.timestamp).toLocaleTimeString()} — {t.agent}: {t.status} {t.message ? `(${t.message})` : ''}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
