import Box from "@mui/material/Box";
import { Hero } from "@/components/home/Hero";
import { StatsBand } from "@/components/home/StatsBand";
import { ValueAtStakeBand } from "@/components/home/ValueAtStakeBand";
import { ModuleSection } from "@/components/home/ModuleSection";
import {
  M1Illustration,
  M2Illustration,
  M3Illustration,
  M4Illustration,
  M5Illustration,
  M6Illustration,
  M7Illustration,
  M8Illustration,
} from "@/components/home/ModuleIllustrations";
import { DemoStepper } from "@/components/home/DemoStepper";
import { Footer } from "@/components/home/Footer";

/**
 * DC Control Tower — home.
 *
 * Sections are ordered by P&L impact, not module index:
 *   Revenue → Margin → Velocity → Risk.
 * Each module headlines the dollar lever it controls.
 */
export default function HomePage() {
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <Hero />
      <StatsBand />
      <ValueAtStakeBand />

      {/* ---------------- REVENUE ---------------- */}
      <ModuleSection
        id="m8"
        index={1}
        eyebrow="M8 · TENANT FIT & REVENUE OPTIMIZER"
        title="Pick the tenants that compound revenue."
        description="Score every archetype against available MW. Optimise the contracted mix. See downside / base / upside revenue, gross margin, and payback before you sign — not after."
        valueTier="revenue"
        valueLine="35 MW Abu Dhabi pilot models $58M–$92M annual revenue at 62–74% gross margin with 14–22-month payback."
        bullets={[
          "Tenant-fit ranking weights utilisation, pricing resilience, counterparty risk",
          "Scenario envelope: occupancy × blended $/MWh × margin",
          "Top-3 quarterly interventions with named owners — exportable IC memo",
        ]}
        href="/m8-tenant-optimizer"
        presetHref="/m8-tenant-optimizer?preset=m8-abu-dhabi-35mw-tenants"
        presetLabel="Demo · Abu Dhabi 35 MW"
        illustration={<M8Illustration />}
      />

      <ModuleSection
        id="m2"
        index={2}
        eyebrow="M2 · CAPACITY MATCHER"
        title="Convert any RFP into a live proposal in under a minute."
        description="Paste the customer brief; Sonnet extracts structured workload requirements; deterministic engines rank DAMAC facilities; a six-layer cost model quotes per-MWh economics; Opus drafts the customer-ready narrative."
        valueTier="revenue"
        valueLine="Compresses RFP-to-proposal cycle from days to minutes — every booked hour of pipeline is direct enterprise contract revenue."
        bullets={[
          "Six-layer cost split: GPU capex · utilities · racks · staff · maintenance · margin",
          "Per-metro rack pricing from CBRE H2 2025; renewable share priced in",
          "Side-by-side benchmark vs. Equinix, Digital Realty, NTT, AWS, Oracle",
        ]}
        href="/m2-capacity-matcher"
        presetHref="/m2-capacity-matcher?preset=m2-anthropic-b200-40mw"
        presetLabel="Demo · 40 MW B200 RFP"
        illustration={<M2Illustration />}
        reverse
      />

      {/* ---------------- MARGIN ---------------- */}
      <ModuleSection
        id="m7"
        index={3}
        eyebrow="M7 · POWER BALANCING COPILOT"
        title="Defend margin every dispatch window."
        description="Energy is 30–45% of opex at GPU density. Balance utility imports, on-site generation, and battery reserve across operating windows; quantify curtailment exposure and spot-market drift before they hit the P&L."
        valueTier="margin"
        valueLine="Dubai 72 MW preset shows $4.2M/yr blended-cost upside from reserve-policy + DR optimisation alone."
        bullets={[
          "Window-level dispatch with marginal-cost and reserve headroom signals",
          "Live utility + spot-price ingestion via authenticated connector adapter",
          "Executive power memo for weekly reliability + FinOps governance",
        ]}
        href="/m7-power-balancer"
        presetHref="/m7-power-balancer?preset=m7-dubai-72mw-power"
        presetLabel="Demo · Dubai 72 MW"
        illustration={<M7Illustration />}
      />

      <ModuleSection
        id="m6"
        index={4}
        eyebrow="M6 · COOLING COPILOT"
        title="Push PUE down. Push hours-of-availability up."
        description="Closed-loop cooling optimisation for high-density GPU pods. Simulate setpoint moves zone by zone, quantify thermal risk, and price every PUE point in annualised opex."
        valueTier="margin"
        valueLine="Each 0.05 PUE improvement at 64 MW Riyadh ≈ $1.6M/yr saved electricity at $0.08/kWh."
        bullets={[
          "Per-zone supply-temp / fan / chiller plan with reliability impact",
          "Hotspot-probability ranking tied to GPU thermal envelope",
          "Cooling memo export for ops + executive energy governance",
        ]}
        href="/m6-cooling-copilot"
        presetHref="/m6-cooling-copilot?preset=m6-riyadh-64mw-cooling"
        presetLabel="Demo · Riyadh 64 MW"
        illustration={<M6Illustration />}
        reverse
      />

      {/* ---------------- VELOCITY (capex efficiency + time-to-revenue) ---------------- */}
      <ModuleSection
        id="m1"
        index={5}
        eyebrow="M1 · SITE INTELLIGENCE"
        title="Place the next 500 MW where capital compounds fastest."
        description="Ten weighted engines score candidate sites across power, cooling, sovereignty, climate, latency, talent, incentives, finance risk. A four-analyst Claude debate produces a board-ready IC memo — every number cited."
        valueTier="velocity"
        valueLine="Site choice swings 5-yr TCO by 18–28%. On a 500 MW programme that is a $250M–$420M variance."
        bullets={[
          "N-1 grid contingency modelled against firm capacity, not heuristics",
          "IEA WEO 2024 electricity-price forecast feeds the cost lever",
          "EIU + World Bank WGI + V-Dem composite for political-risk score",
        ]}
        href="/m1-site-intelligence"
        presetHref="/m1-site-intelligence?preset=m1-sea-500mw"
        presetLabel="Demo · SEA 500 MW"
        illustration={<M1Illustration />}
      />

      <ModuleSection
        id="m5"
        index={6}
        eyebrow="M5 · BUILD TOWER"
        title="Energise on schedule. Every month earlier is revenue earlier."
        description="Construction-orchestration workspace for campus delivery. Model permit complexity, utility queue exposure, long-lead procurement, and EPC readiness. Forecast P50 / P90 energisation and capex-at-risk."
        valueTier="velocity"
        valueLine="Each month pulled forward on a 19 MW Jakarta phase ≈ $2.8M deferred revenue captured."
        bullets={[
          "Critical-path milestones with named owner accountability",
          "Risk heatmap quantifying schedule + dollar exposure",
          "Project memo with intervention priorities for executive review",
        ]}
        href="/m5-build-tower"
        presetHref="/m5-build-tower?preset=m5-jakarta-19mw-phase1"
        presetLabel="Demo · Jakarta 19.2 MW"
        illustration={<M5Illustration />}
        reverse
      />

      {/* ---------------- RISK (uptime SLA + sovereignty unblock) ---------------- */}
      <ModuleSection
        id="m3"
        index={7}
        eyebrow="M3 · OPS CONTROL TOWER"
        title="Catch the incident before the SLA credit ships."
        description="Live DC telemetry — power, cooling, latency, PDU load. Three Sonnet agents debate root cause; Opus synthesises a narrative; natural-language ops queries are grounded on telemetry JSON."
        valueTier="risk"
        valueLine="A single 4-hour outage on a 50 MW tenant contract can trigger $0.8M–$2M in SLA credits. Diagnose in minutes, not hours."
        bullets={[
          "Z-score anomaly detection over a rolling baseline",
          "Failure-probability forecast per component (6-hour horizon)",
          "Simulation mode: +30% load · cooling drop · network brownout",
        ]}
        href="/m3-ops-tower"
        presetHref="/m3-ops-tower?preset=m3-zoneb-latency-0417"
        presetLabel="Demo · Zone B latency"
        illustration={<M3Illustration />}
      />

      <ModuleSection
        id="m4"
        index={8}
        eyebrow="M4 · SOVEREIGNTY GRID"
        title="Unblock cross-border deals. Close them."
        description="Nine jurisdictions, article-level rule citations, deterministic classifier that labels each jurisdiction blocked / gated / clear. Opus synthesises a routing recommendation citing only the stable rule IDs — no URL hallucination."
        valueTier="risk"
        valueLine="Every fintech / health workload that fails sovereignty review is a deal lost. M4 unblocks them with auditable citations."
        bullets={[
          "Article-level citations: PDPL · SDAIA · EU AI Act · GDPR · UU PDP · KVKK · PDPA · CDPA · CCPA",
          "Workload classifier: fintech · health · public-sector · general",
          "Facility routing ranked by verdict + fit score",
        ]}
        href="/m4-sovereignty"
        presetHref="/m4-sovereignty?preset=m4-ksa-fintech-eu-data"
        presetLabel="Demo · KSA fintech + EU data"
        illustration={<M4Illustration />}
        reverse
      />

      <DemoStepper />
      <Footer />
    </Box>
  );
}
