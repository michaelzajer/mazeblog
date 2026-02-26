import { useState, useRef, useEffect } from "react";

// ── Pre-baked responses for simulated mode ──────────────────────────

const SIMULATED_RESPONSES = {
  "Who is the delivery lead?":
    "The Delivery Lead is **The Ringmaster**. They're responsible for overall delivery, risk management, client communication, and sprint planning. They're allocated at 100% for the full 6 months (22 days/month, 132 days total).\n\nFor escalation, issues go: The Ringmaster → Mr Super Cool (Account Manager) → Megawatt Mick (Executive Sponsor).",

  "What's the total project budget?":
    "The total project budget is **$1,596,804** (inc. contingency, exc. GST). Here's how it breaks down:\n\n**Resource costs:** $1,388,640\n• Delivery Lead: $237,600\n• Lead Architect: $290,400\n• Senior Data Lead: $264,000\n• Data Consultants (×2): $396,000\n• BI Specialist: $168,960\n• Account Manager: $31,680\n\n**Other costs:**\n• Azure Platform (6 months): $45,000\n• Licensing (Databricks, Power BI Pro): $18,000\n• Contingency (10%): $145,164\n\nInvoicing is monthly in arrears based on actuals.",

  "What are the top 3 risks?":
    "The three highest-rated risks are:\n\n1. **Legacy system documentation is incomplete or inaccurate** (High likelihood, High impact) — Mitigated by running an early data profiling sprint and allocating additional discovery time in Month 1.\n\n2. **Customer identity resolution has higher duplication than estimated** (Medium likelihood, High impact) — Mitigated by prototyping the matching algorithm in Month 1 and building a manual review workflow as fallback.\n\n3. **SME availability constrained by BAU commitments** (High likelihood, Medium impact) — Mitigated by securing named SMEs with committed hours and using Megawatt Mick (Executive Sponsor) as the escalation path.\n\nRisks 1 and 3 are both rated High likelihood, so Month 1 planning should prioritise early engagement with legacy system owners and confirmed SME calendars.",

  "What's happening in Month 3?":
    "Month 3 is the **Core Migration** phase. Key deliverables:\n\n• Customer identity resolution logic built and operational\n• Oracle metering data integration complete\n• Master Data Management (MDM) goes live\n\nThe milestone gate is **MDM Operational** — this is the point where we should have a working single customer identifier across all source systems.\n\nTeam effort peaks in Month 3 at 126 person-days. All team members are at full allocation except Dashboard Dan (14 days, ramping up) and the Account Manager (2 days).",

  "Who do I escalate to if we have a blocker?":
    "The escalation path is:\n\n1. **The Ringmaster** (Delivery Lead) — first point of contact for all project issues\n2. **Mr Super Cool** (Account Manager) — for commercial or relationship issues that need exec-level attention\n3. **Megawatt Mick** (Executive Sponsor, GM Customer) — final escalation for budget, strategic, or cross-organisational blockers\n\nFor technical decisions, **Blueprint Betty** (Lead Architect) and **Data Dude** (Senior Data Lead) have authority. Business decisions route through **Spark** (Product Owner). Budget or scope changes need approval from both Mr Super Cool and Megawatt Mick.",

  "What's in scope vs out of scope?":
    "**In scope:**\n• Data profiling across all four source systems (SAP ISU, Salesforce, Oracle metering, .NET portal)\n• Azure data platform build (Data Factory, Databricks, Azure SQL)\n• Data migration and reconciliation of customer records\n• Master data management for customer identity\n• Integration APIs for the new onboarding portal\n• BI dashboards for onboarding performance monitoring\n\n**Out of scope:**\n• Customer portal UX redesign (separate workstream led by Energy Company's digital team)\n• Decommissioning of legacy systems\n• Metering data beyond what's needed for customer identity resolution\n\nNote: the portal redesign team will consume data via the APIs this project builds — interface specs need to be agreed by end of Month 2.",

  "When does Dashboard Dan ramp up?":
    "Dashboard Dan (BI Specialist) starts at a light allocation and ramps up as data becomes available:\n\n• Month 1: 8 days (discovery, requirements gathering)\n• Month 2: 10 days (early dashboard prototyping)\n• Month 3: 14 days (data starts flowing, dashboard development begins)\n• Month 4–6: 18 days/month (full dashboard build, refinement, UAT support)\n\nThis makes sense because there's limited value in heavy BI work before the data platform and pipelines are operational (end of Month 2). Dashboard Dan's overall allocation is 80% across the project.",

  "What are the success criteria?":
    "Four measurable success criteria:\n\n1. **Onboarding data served from the unified Azure platform** — all four legacy sources consolidated into a single data layer\n2. **Onboarding time reduced to under 3 business days** — measured over a 4-week period post go-live (currently 14 days)\n3. **First-30-day support calls reduced by 40%** — compared to the 6-month pre-project baseline (currently 23% call rate)\n4. **Legacy data sources reconciled with 95%+ match rate** — customer identity resolution across SAP ISU, Salesforce, Oracle, and the .NET portal\n\nThe Definition of Done for sprint-level work is: code peer-reviewed and merged, unit tests passing, data quality checks validated against agreed thresholds, documentation updated, and demonstrated in sprint review.",
};

const SYSTEM_PROMPT = `You are the project knowledge agent for a data migration engagement. Answer questions directly using the kick-off pack context below. Be concise — under 150 words unless more detail is needed. If something isn't covered, say so honestly.

PROJECT KICK-OFF PACK
=====================
PROJECT: Customer Onboarding Data Migration
CLIENT: Energy Company | PARTNER: A Consulting Company
DURATION: 6 months (March–August 2026) | BUDGET: $1,596,804

PROBLEM: Energy Company (480K customers, eastern Australia) onboards via 4 legacy systems (SAP ISU, Salesforce CRM, Oracle metering, .NET portal) with no common customer ID. Onboarding: 14 days, 23% support call rate, ~$1.2M/year cost.

OBJECTIVE: Unified customer data layer on Azure. Onboarding under 3 days, support calls down 40%.

SCOPE IN: Data profiling, Azure platform (Data Factory, Databricks, Azure SQL), migration, MDM, integration APIs, BI dashboards.
SCOPE OUT: Portal UX redesign, legacy decommissioning, non-identity metering data.

TEAM (Consulting):
The Ringmaster | Delivery Lead | 100% | $1,800/day
Blueprint Betty | Lead Architect | 100% | $2,200/day
Data Dude | Senior Data Lead | 100% | $2,000/day
Pipeline Pete | Data Consultant | 100% | $1,500/day
Query Queen | Data Consultant | 100% | $1,500/day
Dashboard Dan | BI Specialist | 80% | $1,600/day
Mr Super Cool | Account Manager | 10% | $2,400/day

TEAM (Client):
Megawatt Mick | Exec Sponsor (GM Customer) | 5%
Spark | Product Owner | 50%
Server Surge | IT Platform Lead | 30%
TBC | Data SME Billing | 20%
TBC | Data SME CRM | 20%

RACI: Architecture R=Betty A=DataDude. Profiling R=DataDude A=Pete+Queen. Platform R=Betty. ETL R=Pete+Queen A=DataDude. MDM R=DataDude. BI R=Dan. Quality R=Pete+Queen+SMEs A=DataDude. APIs R=Betty. Sprint Planning R=Ringmaster. Reporting R=Ringmaster A=MrSuperCool+Mick. UAT R=SMEs A=Mick/Spark. Go-Live R=Ringmaster/Betty/Pete/Queen/Dan.

BUDGET: Resources $1,388,640 + Azure $45K + Licensing $18K + Contingency $145,164 = $1,596,804

TIMELINE:
M1 Discovery: profiling, architecture, env setup | Gate: Architecture Sign-off
M2 Platform Build: Azure, SAP+SF pipelines, quality rules | Gate: Platform Ready
M3 Core Migration: identity resolution, Oracle, MDM live | Gate: MDM Operational
M4 Integration & BI: APIs, Power BI, validation | Gate: Integration Complete
M5 Testing: UAT, reconciliation, performance | Gate: UAT Sign-off
M6 Go-Live: deploy, 2-week hypercare, knowledge transfer | Gate: Go-Live

TIME ALLOCATION (days/month M1-M6):
DL: 22,22,22,22,22,22 | LA: 22,22,22,22,18,14 | SDL: 22,22,22,22,22,18
DC1: 22,22,22,22,22,18 | DC2: 18,22,22,22,22,18 | BI: 8,10,14,18,18,18 | AM: 4,2,2,2,2,4

RISKS:
1. Legacy docs incomplete (H/H) -> Early profiling, extra M1 discovery
2. Higher duplication (M/H) -> Prototype matching M1, manual fallback
3. SME availability (H/M) -> Named SMEs, escalate via Mick
4. SAP extraction perf (L/H) -> Off-peak, incremental extraction
5. Scope creep (M/M) -> Change control, defer to Phase 2

ESCALATION: Ringmaster -> Mr Super Cool -> Megawatt Mick
DECISIONS: Tech=Betty+DataDude. Business=Spark. Budget/scope=MrSuperCool+Mick
SUCCESS: Onboarding <3 days, support calls -40%, 95%+ match rate`;

const SUGGESTED_PROMPTS = [
  "Who is the delivery lead?",
  "What's the total project budget?",
  "What are the top 3 risks?",
  "What's happening in Month 3?",
  "Who do I escalate to if we have a blocker?",
  "What's in scope vs out of scope?",
  "When does Dashboard Dan ramp up?",
  "What are the success criteria?",
];

// ── Simple markdown-ish rendering ───────────────────────────────────

function renderMessage(text) {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    let processed = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    if (processed.startsWith("\u2022 ")) {
      return <div key={i} style={{ paddingLeft: 16, marginBottom: 2 }} dangerouslySetInnerHTML={{ __html: processed }} />;
    }
    if (/^\d+\.\s/.test(processed)) {
      return <div key={i} style={{ paddingLeft: 4, marginBottom: 4 }} dangerouslySetInnerHTML={{ __html: processed }} />;
    }
    if (processed.trim() === "") {
      return <div key={i} style={{ height: 8 }} />;
    }
    return <div key={i} style={{ marginBottom: 2 }} dangerouslySetInnerHTML={{ __html: processed }} />;
  });
}

// ── Component ───────────────────────────────────────────────────────

// *** REPLACE THIS with your actual Cloudflare Worker URL after deploying ***
const WORKER_URL = "https://maze-agent-proxy.YOUR_SUBDOMAIN.workers.dev";

export default function KickoffAgent() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPrompts, setShowPrompts] = useState(true);
  const [mode, setMode] = useState("simulated");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendSimulated = (text) => {
    const match = SIMULATED_RESPONSES[text];
    if (match) {
      setMessages((prev) => [...prev, { role: "assistant", content: match }]);
    } else {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "This is a simulated demo \u2014 I can answer the suggested prompts above. To ask free-form questions, switch to **Live mode** using the toggle in the header.",
        },
      ]);
    }
  };

  const sendLive = async (history) => {
    try {
      const response = await fetch(WORKER_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: history.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error("API " + response.status + ": " + errText.slice(0, 150));
      }

      const data = await response.json();
      const assistantText =
        data.content
          ?.filter((b) => b.type === "text")
          .map((b) => b.text)
          .join("\n") || "No response returned.";

      setMessages((prev) => [...prev, { role: "assistant", content: assistantText }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error: " + (err.message || "Could not reach the API.") },
      ]);
    }
  };

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;
    const userMsg = { role: "user", content: text };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setLoading(true);
    setShowPrompts(false);

    if (mode === "live") {
      await sendLive(history);
    } else {
      await new Promise((r) => setTimeout(r, 600 + Math.random() * 800));
      sendSimulated(text);
    }

    setLoading(false);
    inputRef.current?.focus();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleReset = () => {
    setMessages([]);
    setInput("");
    setShowPrompts(true);
  };

  const toggleMode = () => {
    setMode(mode === "simulated" ? "live" : "simulated");
    handleReset();
  };

  const isLive = mode === "live";

  return (
    <div
      style={{
        maxWidth: 720,
        margin: "2rem auto",
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        color: "#1a1a1a",
        fontSize: 14,
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #1B3A5C 0%, #2E8B8B 100%)",
          borderRadius: "12px 12px 0 0",
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            width: 36, height: 36, borderRadius: 8,
            background: "rgba(255,255,255,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, flexShrink: 0,
          }}
        >{"\uD83D\uDCCB"}</div>
        <div style={{ flex: 1, minWidth: 160 }}>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>Kick-Off Pack Agent</div>
          <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 12 }}>
            Energy Company &middot; Data Migration
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {messages.length > 0 && (
            <button onClick={handleReset} style={{
              background: "rgba(255,255,255,0.12)", border: "none", color: "rgba(255,255,255,0.75)",
              fontSize: 11, padding: "3px 8px", borderRadius: 5, cursor: "pointer",
            }}>Reset</button>
          )}
          <button onClick={toggleMode} style={{
            background: isLive ? "rgba(74,222,128,0.2)" : "rgba(255,255,255,0.12)",
            border: isLive ? "1px solid rgba(74,222,128,0.4)" : "1px solid rgba(255,255,255,0.2)",
            color: isLive ? "#4ade80" : "rgba(255,255,255,0.75)",
            fontSize: 11, padding: "3px 10px", borderRadius: 5, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 5,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: "50%",
              background: isLive ? "#4ade80" : "rgba(255,255,255,0.4)",
              boxShadow: isLive ? "0 0 6px rgba(74,222,128,0.5)" : "none",
            }} />
            {isLive ? "Live" : "Simulated"}
          </button>
        </div>
      </div>

      {/* Chat area */}
      <div style={{
        background: "#fafafa", border: "1px solid #e5e5e5", borderTop: "none",
        minHeight: 360, maxHeight: 480, overflowY: "auto", padding: "16px 20px",
      }}>
        {messages.length === 0 && !loading && (
          <div style={{ textAlign: "center", padding: "24px 0 8px", color: "#888", fontSize: 13 }}>
            {isLive
              ? "Live mode \u2014 ask any question about the project."
              : "Simulated demo \u2014 click a suggested prompt to see the agent in action."}
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={{
            display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
            marginBottom: 14,
          }}>
            {msg.role === "assistant" && (
              <div style={{
                width: 26, height: 26, borderRadius: 6, background: "#2E8B8B",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, flexShrink: 0, marginRight: 8, marginTop: 2,
                color: "#fff", fontWeight: 700,
              }}>K</div>
            )}
            <div style={{
              maxWidth: "82%", padding: "10px 14px",
              borderRadius: msg.role === "user" ? "12px 12px 4px 12px" : "12px 12px 12px 4px",
              background: msg.role === "user" ? "#1B3A5C" : "#fff",
              color: msg.role === "user" ? "#fff" : "#1a1a1a",
              fontSize: 13, lineHeight: 1.6,
              boxShadow: msg.role === "assistant" ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
              border: msg.role === "assistant" ? "1px solid #e5e5e5" : "none",
            }}>
              {msg.role === "assistant" ? renderMessage(msg.content) : msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", alignItems: "flex-start", marginBottom: 14 }}>
            <div style={{
              width: 26, height: 26, borderRadius: 6, background: "#2E8B8B",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, flexShrink: 0, marginRight: 8, color: "#fff", fontWeight: 700,
            }}>K</div>
            <div style={{
              padding: "12px 16px", borderRadius: "12px 12px 12px 4px",
              background: "#fff", border: "1px solid #e5e5e5",
              display: "flex", gap: 5, alignItems: "center",
            }}>
              {[0, 1, 2].map((n) => (
                <div key={n} style={{
                  width: 6, height: 6, borderRadius: "50%", background: "#2E8B8B",
                  animation: "koPulse 1.2s ease-in-out " + (n * 0.2) + "s infinite",
                }} />
              ))}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested prompts */}
      {showPrompts && (
        <div style={{
          background: "#fff", border: "1px solid #e5e5e5", borderTop: "none",
          padding: "10px 20px 14px",
        }}>
          <div style={{
            fontSize: 10, fontWeight: 600, textTransform: "uppercase",
            letterSpacing: "0.06em", color: "#aaa", marginBottom: 8,
          }}>Try asking</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {SUGGESTED_PROMPTS.map((prompt, i) => (
              <button key={i} onClick={() => sendMessage(prompt)} disabled={loading}
                style={{
                  background: "#f5f5f5", border: "1px solid #e0e0e0", borderRadius: 7,
                  padding: "6px 12px", fontSize: 12, color: "#1B3A5C", lineHeight: 1.3,
                  cursor: loading ? "not-allowed" : "pointer", transition: "all 0.15s",
                  textAlign: "left",
                }}
                onMouseEnter={(e) => { if (!loading) { e.target.style.background = "#e8f4f4"; e.target.style.borderColor = "#2E8B8B"; }}}
                onMouseLeave={(e) => { e.target.style.background = "#f5f5f5"; e.target.style.borderColor = "#e0e0e0"; }}
              >{prompt}</button>
            ))}
          </div>
        </div>
      )}

      {!showPrompts && messages.length > 0 && (
        <div style={{
          background: "#fff", border: "1px solid #e5e5e5", borderTop: "none",
          padding: "5px 20px", textAlign: "center",
        }}>
          <button onClick={() => setShowPrompts(true)} style={{
            background: "none", border: "none", fontSize: 11, color: "#2E8B8B",
            cursor: "pointer", padding: "3px 6px",
          }}>Show suggested prompts</button>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} style={{
        display: "flex", gap: 8, padding: "10px 14px",
        background: "#fff", border: "1px solid #e5e5e5", borderTop: "none",
        borderRadius: "0 0 12px 12px",
      }}>
        <input
          ref={inputRef} type="text" value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isLive ? "Ask anything about the project..." : "Click a suggested prompt above, or switch to Live mode..."}
          disabled={loading}
          style={{
            flex: 1, padding: "9px 12px", borderRadius: 7, border: "1px solid #ddd",
            fontSize: 13, fontFamily: "inherit", outline: "none", transition: "border-color 0.15s",
          }}
          onFocus={(e) => (e.target.style.borderColor = "#2E8B8B")}
          onBlur={(e) => (e.target.style.borderColor = "#ddd")}
        />
        <button type="submit" disabled={loading || !input.trim()} style={{
          padding: "9px 16px", borderRadius: 7, border: "none",
          background: loading || !input.trim() ? "#ccc" : "#1B3A5C",
          color: "#fff", fontSize: 13, fontWeight: 600,
          cursor: loading || !input.trim() ? "not-allowed" : "pointer",
          flexShrink: 0,
        }}>{loading ? "..." : "Send"}</button>
      </form>

      <div style={{ textAlign: "center", padding: "10px 0 0", fontSize: 10, color: "#bbb" }}>
        {isLive ? "Live \u00b7 Powered by Claude Sonnet" : "Simulated demo \u00b7 Switch to Live mode to ask free-form questions"}
      </div>

      <style>{`@keyframes koPulse { 0%,100%{opacity:.3;transform:scale(1)} 50%{opacity:1;transform:scale(1.2)} }`}</style>
    </div>
  );
}
