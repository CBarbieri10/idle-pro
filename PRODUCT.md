# The Net Scouting (TNS) — Product Context

## Overview
**The Net Scouting** is a high-performance Sports Intelligence and Scouting platform tailored for professional football clubs, sports directors, and recruitment analysts. It focuses on identifying, tracking, and evaluating emerging and elite talent in Brazilian football (Brasileirão Série A and youth academy categories).

## Core Users
- **Head Scouts & Technical Directors:** Require executive summaries, high-level tactical radar charts, bio profiles, and exportable A4 "Raio-X" dossiers for board presentations.
- **Performance Analysts:** Require granular Per-90 canonical metrics, comparative distributions, tactical filters (e.g. progressive passes > 5.0/90, tackles > 3.0/90), and match staging workflows.

## Primary Surfaces & UX Modes
1. **Catalog & Scouting Search (`/athletes` & `/scouting`):**
   - *Mode: Operate*
   - Filter bar with position pills, age ranges, dominant foot, and numerical sliders for Per-90 canonical metrics.
   - Player card grid with transparent cutout portraits, key stat highlights, and comparison toggles.
2. **Athlete Intelligence Profile (`/athletes/[id]`):**
   - *Mode: Operate / Experience*
   - Dark stage hero with floating player photo cutout.
   - Multi-dimensional tactical spider radar (Attack, Possession/Pass, Defense).
   - Structured Per-90 canonical metric tiles with emerald highlight on elite percentiles.
   - Match log and action toolbar (Portfolio toggle, Edit, Raio-X modal).
3. **Executive Dossier "Raio-X" (`/athletes/[id]/raio-x`):**
   - *Mode: Operate / Persuade*
   - Official executive A4 white print document with institutional branding, radar chart, bio, and Per-90 statistical breakdown.
4. **Analyst Dashboard (`/dashboard` & `/portfolio`):**
   - *Mode: Operate*
   - High-level KPIs: Active watchlist, tracked clubs, mapped matches, and statistical standouts.
5. **Data Staging & Bulk Ingestion (`/matches/import`):**
   - *Mode: Operate*
   - Raw data column mapper, template persistence, and automatic normalization pipeline.

## Non-Negotiable Standards
- **Zero Broken UI:** Every page must be solid, responsive, and visually harmonious.
- **Color Discipline:** Strict adherence to Dark Slate/Obsidian layers (`#090a0f`, `#11131a`, `#171a24`), tactical emerald highlights (`#10b981`), and semantic colors. No clashing generic primaries.
- **Typography:** Geist Sans for clean hierarchy; Geist Mono + `tabular-nums` for all stats and metrics.
