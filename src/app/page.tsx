import Box from "@mui/material/Box";
import { Hero } from "@/components/home/Hero";
import { StatsBand } from "@/components/home/StatsBand";
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
 * Crosslinq-inspired full-bleed hero → stats band → 8 module sections
 * (alternating text/illustration) → demo stepper → footer with health badge.
 */
export default function HomePage() {
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <Hero />
      <StatsBand />

      <ModuleSection
        id="m1"
        index={1}
        eyebrow="M1 · SITE INTELLIGENCE"
        title="Where to deploy the next 500 MW."
        description="Ten weighted engines score candidate sites across power, cooling, sovereignty, climate, latency, talent, incentives, and finance risk. A four-analyst Claude debate produces an IC memo — exportable to Markdown or PDF."
        bullets={[
          "N-1 grid contingency modelled against real firm capacity, not heuristics",
          "IEA WEO 2024 electricity-price forecast feeds the cost lever",
          "EIU + World Bank WGI + V-Dem composite for political risk",
        ]}
        href="/m1-site-intelligence"
        presetHref="/m1-site-intelligence?preset=m1-sea-500mw"
        presetLabel="Demo · SEA 500 MW"
        illustration={<M1Illustration />}
      />

      <ModuleSection
        id="m2"
        index={2}
        eyebrow="M2 · CAPACITY MATCHER"
        title="Turn any RFP into a proposal in under a minute."
        description="Paste the customer brief; Sonnet extracts structured requirements; deterministic engines rank DAMAC facilities; a six-layer cost model quotes per-MWh economics; Opus drafts a customer-ready narrative."
        bullets={[
          "Four-layer cost split: GPU capex · utilities · rack OpEx · staff + maintenance",
          "Per-metro rack pricing from CBRE H2 2025",
          "Side-by-side benchmark against Equinix, Digital Realty, NTT, AWS, Oracle",
        ]}
        href="/m2-capacity-matcher"
        presetHref="/m2-capacity-matcher?preset=m2-anthropic-b200-40mw"
        presetLabel="Demo · 40 MW B200 RFP"
        illustration={<M2Illustration />}
        reverse
      />

      <ModuleSection
        id="m3"
        index={3}
        eyebrow="M3 · OPS CONTROL TOWER"
        title="Diagnose incidents. Forecast the next six hours."
        description="Synthetic DC telemetry streams into a dashboard of power, cooling, latency, and PDU load. Three Sonnet agents debate root cause; Opus synthesizes a narrative. Natural-language ops queries are grounded on the telemetry JSON."
        bullets={[
          "Z-score anomaly detection over a rolling baseline",
          "Failure-probability forecast per component (6-hour horizon)",
          "Simulation mode: +30% load / cooling drop / network brownout",
        ]}
        href="/m3-ops-tower"
        presetHref="/m3-ops-tower?preset=m3-zoneb-latency-0417"
        presetLabel="Demo · Zone B latency"
        illustration={<M3Illustration />}
      />

      <ModuleSection
        id="m4"
        index={4}
        eyebrow="M4 · SOVEREIGNTY GRID"
        title="Place every workload under the right jurisdictions."
        description="Nine jurisdictions, article-level rule citations, deterministic classifier that labels each jurisdiction blocked / gated / clear. Opus synthesizes a routing recommendation citing only the stable rule IDs — no URL hallucination."
        bullets={[
          "Article-level citations: PDPL, SDAIA, EU AI Act, GDPR, UU PDP, KVKK, PDPA, CDPA, CCPA",
          "Workload-specific classifier (fintech, health, public-sector, general)",
          "Facility routing ranked by verdict + fit score",
        ]}
        href="/m4-sovereignty"
        presetHref="/m4-sovereignty?preset=m4-ksa-fintech-eu-data"
        presetLabel="Demo · KSA fintech + EU data"
        illustration={<M4Illustration />}
        reverse
      />

      <ModuleSection
        id="m5"
        index={5}
        eyebrow="M5 · BUILD TOWER"
        title="Compress delivery risk before it hits commissioning."
        description="Construction-orchestration workspace for campus delivery teams. Model permit complexity, utility queue exposure, long-lead procurement pressure, and EPC readiness to forecast P50/P90 energization and capex-at-risk."
        bullets={[
          "Critical-path milestones with owner-level accountability",
          "Risk heatmap quantifying schedule and dollar exposure",
          "Project memo with intervention priorities for executive review",
        ]}
        href="/m5-build-tower"
        presetHref="/m5-build-tower?preset=m5-jakarta-19mw-phase1"
        presetLabel="Demo · Jakarta 19.2 MW"
        illustration={<M5Illustration />}
      />

      <ModuleSection
        id="m6"
        index={6}
        eyebrow="M6 · COOLING COPILOT"
        title="Tune cooling in real time for dense AI pods."
        description="Closed-loop cooling optimization workspace for high-density GPU facilities. Simulate zone-level setpoint adjustments, quantify thermal risk, and estimate PUE improvement with annualized savings impact."
        bullets={[
          "Per-zone cooling-control plan with supply-temp, fan, and chiller recommendations",
          "Thermal risk ranking tied to reliability impact and hotspot probability",
          "Cooling memo export for operations and executive energy-governance review",
        ]}
        href="/m6-cooling-copilot"
        presetHref="/m6-cooling-copilot?preset=m6-riyadh-64mw-cooling"
        presetLabel="Demo · Riyadh 64 MW"
        illustration={<M6Illustration />}
        reverse
      />

      <ModuleSection
        id="m7"
        index={7}
        eyebrow="M7 · POWER BALANCING COPILOT"
        title="Balance power reliability and energy economics continuously."
        description="Grid-aware dispatch workspace for AI campuses. Model utility imports, on-site generation, and battery reserve policy across operating windows while quantifying curtailment exposure and blended cost impact."
        bullets={[
          "Window-level dispatch plan with margin and marginal-cost signals",
          "Reserve-policy controls linked to outage and volatility exposure",
          "Executive power memo for weekly reliability and FinOps governance",
        ]}
        href="/m7-power-balancer"
        presetHref="/m7-power-balancer?preset=m7-dubai-72mw-power"
        presetLabel="Demo · Dubai 72 MW"
        illustration={<M7Illustration />}
      />

      <ModuleSection
        id="m8"
        index={8}
        eyebrow="M8 · TENANT FIT AND REVENUE OPTIMIZER"
        title="Monetize capacity with risk-adjusted tenant mix intelligence."
        description="Commercial planning workspace for AI campuses. Score tenant archetype fit, optimize contracted mix, and project downside/base/upside revenue with gross-margin and payback visibility before signing commitments."
        bullets={[
          "Tenant-fit ranking tied to utilization, pricing resilience, and risk profile",
          "Revenue scenarios with weighted gross-margin and occupancy envelopes",
          "Executive memo for IC and commercial governance sign-off",
        ]}
        href="/m8-tenant-optimizer"
        presetHref="/m8-tenant-optimizer?preset=m8-abu-dhabi-35mw-tenants"
        presetLabel="Demo · Abu Dhabi 35 MW"
        illustration={<M8Illustration />}
        reverse
      />

      <DemoStepper />
      <Footer />
    </Box>
  );
}
