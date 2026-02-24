import { useState } from "react";

const ENTITIES = [
  {
    id: "sow_deliverable",
    name: "SOW Deliverable",
    system: "Contract / SOW",
    color: "#1a3a4a",
    accent: "#2d8c9e",
    description:
      "The contractual unit of work the client is paying for. This is the anchor entity — everything else maps back here.",
    fields: [
      { name: "deliverable_id", type: "string", key: true, desc: "Unique identifier (e.g., DEL-001)" },
      { name: "name", type: "string", desc: "Deliverable name as stated in SOW" },
      { name: "description", type: "text", desc: "Scope description from SOW" },
      { name: "milestone_id", type: "FK", desc: "Parent milestone reference" },
      { name: "planned_hours", type: "number", desc: "Total estimated hours from WBS rollup" },
      { name: "planned_cost", type: "currency", desc: "Planned cost (hours × blended rate)" },
      { name: "weight_pct", type: "number", desc: "% of total contract value (for EV calc)" },
      { name: "planned_start", type: "date", desc: "Scheduled start date" },
      { name: "planned_end", type: "date", desc: "Scheduled completion date" },
      { name: "status", type: "enum", desc: "Not Started | In Progress | Complete | Blocked" },
      { name: "pct_complete", type: "number", desc: "Assessed % complete (0-100)" },
      { name: "acceptance_criteria", type: "text", desc: "Definition of done per SOW" },
    ],
  },
  {
    id: "milestone",
    name: "Milestone",
    system: "Contract / SOW",
    color: "#1a3a4a",
    accent: "#2d8c9e",
    description:
      "Commercial or governance checkpoint. Often triggers payment or formal acceptance. Groups related deliverables.",
    fields: [
      { name: "milestone_id", type: "string", key: true, desc: "Unique identifier (e.g., MS-001)" },
      { name: "name", type: "string", desc: "Milestone name from SOW" },
      { name: "due_date", type: "date", desc: "Contractual due date" },
      { name: "payment_value", type: "currency", desc: "Payment triggered on completion (if T&M hybrid)" },
      { name: "status", type: "enum", desc: "Upcoming | Due | Achieved | Overdue" },
      { name: "gate_type", type: "enum", desc: "Payment | Governance | Phase Transition" },
    ],
  },
  {
    id: "wbs_element",
    name: "WBS Element",
    system: "Project Plan / WBS",
    color: "#3a1a4a",
    accent: "#9e2d8c",
    description:
      "The planned decomposition of work. Bridges the SOW (what we promised) to the backlog (how we're building it). Multi-level hierarchy.",
    fields: [
      { name: "wbs_id", type: "string", key: true, desc: "WBS code (e.g., 1.2.3)" },
      { name: "name", type: "string", desc: "Work package name" },
      { name: "level", type: "number", desc: "Hierarchy depth (1 = phase, 2 = activity, 3 = task)" },
      { name: "parent_wbs_id", type: "FK", desc: "Parent WBS element" },
      { name: "deliverable_id", type: "FK", desc: "Linked SOW deliverable" },
      { name: "estimated_hours", type: "number", desc: "Bottom-up effort estimate" },
      { name: "phase", type: "enum", desc: "Discovery | Design | Build | Test | Deploy" },
      { name: "activity_category", type: "enum", desc: "Analysis | Development | Testing | PM | etc." },
      { name: "role_mix", type: "json", desc: "Planned hours by role (e.g., {dev: 40, ba: 16})" },
    ],
  },
  {
    id: "backlog_item",
    name: "Backlog Item",
    system: "Jira / Azure DevOps",
    color: "#1a4a2a",
    accent: "#2d9e4a",
    description:
      "The real-time unit of work execution. Epics map to SOW deliverables. Features/stories map to WBS elements. This is where actual progress lives.",
    fields: [
      { name: "item_id", type: "string", key: true, desc: "Jira key or DevOps ID (e.g., PROJ-142)" },
      { name: "title", type: "string", desc: "Work item title" },
      { name: "item_type", type: "enum", desc: "Epic | Feature | User Story | Task | Bug" },
      { name: "parent_item_id", type: "FK", desc: "Parent item (Epic → Feature → Story hierarchy)" },
      { name: "deliverable_id", type: "FK", desc: "Linked SOW deliverable (required at Epic level)" },
      { name: "wbs_id", type: "FK", desc: "Linked WBS element (recommended at Feature level)" },
      { name: "status", type: "enum", desc: "Backlog | In Progress | In Review | Done" },
      { name: "story_points", type: "number", desc: "Relative size estimate" },
      { name: "sprint", type: "string", desc: "Assigned sprint" },
      { name: "assignee", type: "FK", desc: "Team member reference" },
      { name: "completed_date", type: "date", desc: "Date moved to Done" },
      { name: "cycle_time_days", type: "number", desc: "Days from In Progress to Done" },
    ],
  },
  {
    id: "timesheet_entry",
    name: "Timesheet Entry",
    system: "Timesheet System",
    color: "#4a3a1a",
    accent: "#9e8c2d",
    description:
      "Actual hours worked. The two-dimensional coding (deliverable + activity category) is what enables the bridge between commercial and execution views.",
    fields: [
      { name: "entry_id", type: "string", key: true, desc: "Unique entry ID" },
      { name: "team_member_id", type: "FK", desc: "Who logged the time" },
      { name: "date", type: "date", desc: "Date worked" },
      { name: "hours", type: "number", desc: "Hours logged" },
      { name: "deliverable_id", type: "FK", desc: "SOW deliverable (primary dimension)" },
      { name: "activity_category", type: "enum", desc: "Analysis | Development | Testing | PM | etc." },
      { name: "backlog_item_id", type: "FK", desc: "Backlog item ref (optional, at Epic/Feature level)" },
      { name: "billable", type: "boolean", desc: "Billable vs non-billable" },
      { name: "notes", type: "text", desc: "Brief description of work done" },
    ],
  },
  {
    id: "team_member",
    name: "Team Member",
    system: "Resource Management",
    color: "#4a1a1a",
    accent: "#9e4a2d",
    description:
      "The people doing the work. Rate card data enables cost calculations. Role mapping enables planned vs actual role mix analysis.",
    fields: [
      { name: "member_id", type: "string", key: true, desc: "Unique identifier" },
      { name: "name", type: "string", desc: "Team member name" },
      { name: "role", type: "enum", desc: "Solution Architect | Developer | BA | Tester | PM | etc." },
      { name: "bill_rate", type: "currency", desc: "Hourly bill rate (client-facing)" },
      { name: "cost_rate", type: "currency", desc: "Hourly cost rate (internal)" },
      { name: "allocation_pct", type: "number", desc: "% allocated to this engagement" },
      { name: "start_date", type: "date", desc: "Engagement start" },
      { name: "end_date", type: "date", desc: "Engagement end" },
    ],
  },
];

const RELATIONSHIPS = [
  { from: "milestone", to: "sow_deliverable", label: "1 : M", desc: "A milestone groups one or more deliverables" },
  { from: "sow_deliverable", to: "wbs_element", label: "1 : M", desc: "Each deliverable decomposes into WBS work packages" },
  { from: "sow_deliverable", to: "backlog_item", label: "1 : M", desc: "Each deliverable maps to one or more Epics (required)" },
  { from: "wbs_element", to: "backlog_item", label: "1 : M", desc: "WBS elements map to Features/Stories (recommended)" },
  { from: "sow_deliverable", to: "timesheet_entry", label: "1 : M", desc: "Timesheets coded to deliverable (primary dimension)" },
  { from: "team_member", to: "timesheet_entry", label: "1 : M", desc: "Each entry belongs to one team member" },
  { from: "backlog_item", to: "timesheet_entry", label: "1 : M", desc: "Optional link for granular tracking" },
];

const METRICS = [
  {
    category: "Earned Value (Core)",
    items: [
      { name: "Budget at Completion (BAC)", formula: "SUM(deliverable.planned_hours × blended_rate)", desc: "Total planned cost of all work" },
      { name: "Planned Value (PV)", formula: "SUM(deliverable.weight_pct × BAC) where planned_end ≤ today", desc: "Value of work scheduled to be done by now" },
      { name: "Earned Value (EV)", formula: "SUM(deliverable.weight_pct × deliverable.pct_complete × BAC)", desc: "Value of work actually completed" },
      { name: "Actual Cost (AC)", formula: "SUM(timesheet.hours × team_member.bill_rate) where billable = true", desc: "What we've actually spent" },
    ],
  },
  {
    category: "Performance Indices",
    items: [
      { name: "Cost Performance Index (CPI)", formula: "EV / AC", desc: "> 1.0 = under budget, < 1.0 = over budget" },
      { name: "Schedule Performance Index (SPI)", formula: "EV / PV", desc: "> 1.0 = ahead, < 1.0 = behind schedule" },
      { name: "Cost Variance (CV)", formula: "EV − AC", desc: "Positive = favourable, negative = overrun" },
      { name: "Schedule Variance (SV)", formula: "EV − PV", desc: "Positive = ahead, negative = behind" },
      { name: "Estimate at Completion (EAC)", formula: "BAC / CPI", desc: "Projected total cost at current burn rate" },
      { name: "Variance at Completion (VAC)", formula: "BAC − EAC", desc: "Projected overrun or underrun" },
    ],
  },
  {
    category: "Delivery Flow (Leading Indicators)",
    items: [
      { name: "Sprint Velocity", formula: "SUM(story_points) where status = Done per sprint", desc: "Throughput of completed work per sprint" },
      { name: "Avg Cycle Time", formula: "AVG(cycle_time_days) for completed items", desc: "How long items take from start to done" },
      { name: "Deliverable Burn-up", formula: "Cumulative pct_complete across deliverables over time", desc: "Are we converging on 100% or plateauing?" },
      { name: "Role Mix Variance", formula: "Actual hours by role − Planned hours by role (from WBS)", desc: "Are we using more senior/expensive resources than planned?" },
      { name: "Billable Ratio", formula: "Billable hours / Total hours", desc: "Margin protection metric" },
    ],
  },
];

const DESIGN_PRINCIPLES = [
  {
    title: "Deliverable as the anchor",
    desc: "Everything maps back to the SOW deliverable. This is the unit the client cares about, the unit that triggers milestones, and the unit that earned value is measured against.",
  },
  {
    title: "Two-dimensional timesheet coding",
    desc: "Hours coded by deliverable AND activity category. This enables both commercial tracking (cost per deliverable) and operational analysis (where is effort going by activity type).",
  },
  {
    title: "Mandatory mapping at Epic level",
    desc: "Every Epic in Jira/DevOps must reference a SOW deliverable. Feature-to-WBS mapping is recommended but not enforced. Story-level mapping is unnecessary overhead.",
  },
  {
    title: "Percent complete at deliverable level only",
    desc: "Don't try to roll up story completion into deliverable progress automatically. Backlog items shift and multiply. Deliverable completion is a lead assessment informed by backlog data, not derived from it.",
  },
  {
    title: "Separate bill rate from cost rate",
    desc: "CPI using bill rates tells you about commercial health. CPI using cost rates tells you about margin. Both matter — they answer different questions.",
  },
];

function EntityCard({ entity, isSelected, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: isSelected ? entity.color : `${entity.color}cc`,
        border: `2px solid ${isSelected ? entity.accent : "transparent"}`,
        borderRadius: 8,
        padding: "14px 16px",
        cursor: "pointer",
        transition: "all 0.2s ease",
        transform: isSelected ? "scale(1.02)" : "scale(1)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: entity.accent,
            flexShrink: 0,
          }}
        />
        <span style={{ fontWeight: 700, fontSize: 15, color: "#f0f0f0", letterSpacing: "-0.01em" }}>
          {entity.name}
        </span>
      </div>
      <span
        style={{
          fontSize: 11,
          color: entity.accent,
          fontWeight: 500,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
        }}
      >
        {entity.system}
      </span>
    </div>
  );
}

function FieldTable({ entity }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "separate",
          borderSpacing: 0,
          fontFamily: "'DM Mono', 'JetBrains Mono', monospace",
          fontSize: 12,
        }}
      >
        <thead>
          <tr>
            {["Field", "Type", "Description"].map((h) => (
              <th
                key={h}
                style={{
                  textAlign: "left",
                  padding: "8px 12px",
                  borderBottom: `2px solid ${entity.accent}44`,
                  color: entity.accent,
                  fontWeight: 600,
                  fontSize: 10,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {entity.fields.map((f) => (
            <tr key={f.name}>
              <td
                style={{
                  padding: "6px 12px",
                  borderBottom: "1px solid #ffffff08",
                  color: f.key ? entity.accent : "#e0e0e0",
                  fontWeight: f.key ? 700 : 400,
                  whiteSpace: "nowrap",
                }}
              >
                {f.key ? "🔑 " : f.type === "FK" ? "→ " : ""}
                {f.name}
              </td>
              <td style={{ padding: "6px 12px", borderBottom: "1px solid #ffffff08", color: "#888" }}>
                {f.type}
              </td>
              <td
                style={{
                  padding: "6px 12px",
                  borderBottom: "1px solid #ffffff08",
                  color: "#aaa",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 12,
                }}
              >
                {f.desc}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function DeliveryDataModel() {
  const [selectedEntity, setSelectedEntity] = useState("sow_deliverable");
  const [activeTab, setActiveTab] = useState("entities");

  const entity = ENTITIES.find((e) => e.id === selectedEntity);

  const tabs = [
    { id: "entities", label: "Entity Model" },
    { id: "relationships", label: "Relationships" },
    { id: "metrics", label: "Derived Metrics" },
    { id: "principles", label: "Design Principles" },
  ];

  return (
    <div style={{ padding: "24px 20px", fontFamily: "'DM Sans', sans-serif", color: "#e0e0e0" }}>
      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, borderBottom: "1px solid #1a1a1a", marginBottom: 20 }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              background: activeTab === t.id ? "#1a1a1a" : "transparent",
              border: "none",
              borderBottom: activeTab === t.id ? "2px solid #2d8c9e" : "2px solid transparent",
              color: activeTab === t.id ? "#f0f0f0" : "#666",
              padding: "8px 16px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
              transition: "all 0.15s ease",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ENTITIES TAB */}
      {activeTab === "entities" && (
        <div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
              gap: 10,
              marginBottom: 20,
            }}
          >
            {ENTITIES.map((e) => (
              <EntityCard
                key={e.id}
                entity={e}
                isSelected={selectedEntity === e.id}
                onClick={() => setSelectedEntity(e.id)}
              />
            ))}
          </div>

          {entity && (
            <div
              style={{
                background: "#0d0d0d",
                borderRadius: 8,
                border: `1px solid ${entity.accent}33`,
                padding: 20,
              }}
            >
              <h3
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: entity.accent,
                  margin: "0 0 6px",
                }}
              >
                {entity.name}
              </h3>
              <p style={{ fontSize: 13, color: "#999", margin: "0 0 16px", lineHeight: 1.6 }}>
                {entity.description}
              </p>
              <FieldTable entity={entity} />
            </div>
          )}
        </div>
      )}

      {/* RELATIONSHIPS TAB */}
      {activeTab === "relationships" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <p style={{ fontSize: 13, color: "#888", margin: "0 0 8px", lineHeight: 1.6 }}>
            The SOW deliverable is the anchor entity. All relationships ultimately trace back to it,
            enabling the reconciliation of commercial commitments with execution reality.
          </p>
          {RELATIONSHIPS.map((r, i) => {
            const fromEntity = ENTITIES.find((e) => e.id === r.from);
            const toEntity = ENTITIES.find((e) => e.id === r.to);
            return (
              <div
                key={i}
                style={{
                  background: "#0d0d0d",
                  borderRadius: 8,
                  padding: "12px 16px",
                  border: "1px solid #1a1a1a",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <span style={{ color: fromEntity.accent, fontWeight: 700, fontSize: 13, minWidth: 120 }}>
                  {fromEntity.name}
                </span>
                <span
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 11,
                    color: "#555",
                    background: "#1a1a1a",
                    padding: "2px 8px",
                    borderRadius: 4,
                  }}
                >
                  {r.label}
                </span>
                <span style={{ color: "#555", fontSize: 14 }}>→</span>
                <span style={{ color: toEntity.accent, fontWeight: 700, fontSize: 13, minWidth: 120 }}>
                  {toEntity.name}
                </span>
                <span style={{ color: "#777", fontSize: 12, marginLeft: "auto", fontStyle: "italic" }}>
                  {r.desc}
                </span>
              </div>
            );
          })}
          <div
            style={{
              background: "#1a1a1a",
              borderRadius: 8,
              padding: 16,
              marginTop: 8,
              borderLeft: "3px solid #2d8c9e",
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 13, color: "#2d8c9e", marginBottom: 6 }}>
              Key mapping rule
            </div>
            <p style={{ fontSize: 13, color: "#aaa", margin: 0, lineHeight: 1.6 }}>
              Epic → SOW Deliverable mapping is <strong style={{ color: "#e0e0e0" }}>mandatory</strong>.
              Feature → WBS Element mapping is <strong style={{ color: "#e0e0e0" }}>recommended</strong>.
              Story-level mapping is <strong style={{ color: "#e0e0e0" }}>unnecessary overhead</strong>.
              Timesheet → Deliverable coding is <strong style={{ color: "#e0e0e0" }}>mandatory</strong>.
              Timesheet → Backlog Item is <strong style={{ color: "#e0e0e0" }}>optional</strong>.
            </p>
          </div>
        </div>
      )}

      {/* METRICS TAB */}
      {activeTab === "metrics" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <p style={{ fontSize: 13, color: "#888", margin: 0, lineHeight: 1.6 }}>
            These metrics are derived from the entity data. The earned value metrics provide the commercial
            truth; the flow metrics provide early warning. Both are needed.
          </p>
          {METRICS.map((cat) => (
            <div key={cat.category}>
              <h4
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#2d8c9e",
                  margin: "0 0 8px",
                  letterSpacing: "0.02em",
                  textTransform: "uppercase",
                }}
              >
                {cat.category}
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {cat.items.map((m) => (
                  <div
                    key={m.name}
                    style={{
                      background: "#0d0d0d",
                      borderRadius: 8,
                      padding: "10px 14px",
                      border: "1px solid #1a1a1a",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: 12,
                        marginBottom: 4,
                        flexWrap: "wrap",
                      }}
                    >
                      <span style={{ fontWeight: 700, fontSize: 13, color: "#e0e0e0" }}>{m.name}</span>
                      <code
                        style={{
                          fontFamily: "'DM Mono', monospace",
                          fontSize: 11,
                          color: "#9e8c2d",
                          background: "#1a1a1a",
                          padding: "2px 8px",
                          borderRadius: 4,
                        }}
                      >
                        {m.formula}
                      </code>
                    </div>
                    <span style={{ fontSize: 12, color: "#777" }}>{m.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PRINCIPLES TAB */}
      {activeTab === "principles" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <p style={{ fontSize: 13, color: "#888", margin: "0 0 4px", lineHeight: 1.6 }}>
            These design decisions shape the model. They're the opinionated choices that make it
            practical for consulting delivery rather than theoretically pure.
          </p>
          {DESIGN_PRINCIPLES.map((p, i) => (
            <div
              key={i}
              style={{
                background: "#0d0d0d",
                borderRadius: 8,
                padding: "14px 18px",
                borderLeft: "3px solid #2d8c9e",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <span
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 11,
                    color: "#2d8c9e",
                    background: "#2d8c9e22",
                    padding: "2px 8px",
                    borderRadius: 4,
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span style={{ fontWeight: 700, fontSize: 14, color: "#e0e0e0" }}>{p.title}</span>
              </div>
              <p style={{ fontSize: 13, color: "#999", margin: 0, lineHeight: 1.6, paddingLeft: 42 }}>
                {p.desc}
              </p>
            </div>
          ))}
          <div
            style={{
              background: "#0d1a1a",
              borderRadius: 8,
              padding: 16,
              marginTop: 8,
              border: "1px solid #2d8c9e33",
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 13, color: "#2d8c9e", marginBottom: 8 }}>
              Minimum viable implementation
            </div>
            <p style={{ fontSize: 13, color: "#aaa", margin: 0, lineHeight: 1.7 }}>
              If you implement nothing else, implement these two things: (1) every Epic in the backlog
              carries a deliverable_id linking it to the SOW, and (2) every timesheet entry is coded
              to a deliverable_id and an activity_category. With just those two data points consistently
              captured, you can calculate earned value, cost variance, and role mix variance — which
              answers 80% of the questions a steering committee will ask.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
