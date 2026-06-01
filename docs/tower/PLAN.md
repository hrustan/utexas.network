# UT Tower lighting in the embed — staged plan & tracker

> Durable tracker for a multi-session "delegator/worker" effort. Each phase runs in its own fresh
> session. **When you finish a phase, update its status here (and the one-line outcome) before
> ending the session.** Read this whole file before resuming.

## Context

We're adding the UT Tower's current lighting configuration as an **opt-in** element in the
embeddable webring widget. UT publishes lightings only as same-day/after-the-fact blog posts at
<https://tower.utexas.edu/lightings/> (no forward schedule, no RSS/JSON; everyday default is white).
The configuration space is a **fixed enum of 7 named patterns**, so "parsing" is classification into
7 buckets, not open-ended AI work.

## Locked decisions

- **Display:** opt-in inside the embed widget (`data-tower`), not the homepage. Accepted: white most nights.
- **Data source:** daily auto-scrape **+ manual override** (override always wins).
- **Parsing:** heuristics first (keyword → enum); cheap Haiku call only as fallback; degrades gracefully without an API key.
- **Tracker + conventions:** this file + the root `CLAUDE.md`.
- **SVG assets:** 7 semantic configs, each in a **light and a dark set** under
  `public/tower/light/<slug>.svg` and `public/tower/dark/<slug>.svg` (slugs: `white`, `orange-top`,
  `orange`, `orange-no1`, `orange-special`, `darkened-cap`, `dark`). All share an identical `viewBox`
  + base geometry; only fills/overlays/theme differ (author from one master to prevent drift). The
  orange configs may be byte-identical across light/dark since they read fine on either background.
- **Embed theme control:** `data-tower-theme` = `light` (default) | `dark` | `auto`. `auto` follows
  the visitor's device via `prefers-color-scheme` and re-points the `<img>` on OS theme change;
  `light`/`dark` force it (for sites with a fixed background regardless of device). Orthogonal to the
  existing `data-color` (which tints the webring icon) and to the lighting config (scrape-driven).
- **Local testing:** a minimal **dev-only** route `/dev/embed-preview`, guarded to 404 in production.
- **Sequencing:** harness & visual first, automation last.

## The 7 configurations

| Slug | Label | Notes |
|------|-------|-------|
| `white` | White Tower | Everyday default |
| `orange-top` | White Tower with Orange Top | Football regular-season / bowl wins |
| `orange` | Orange Tower | General orange |
| `orange-no1` | Orange Tower with No. 1 | National championship / No. 1 ranking |
| `orange-special` | Orange Tower with Special Effects | Special occasions |
| `darkened-cap` | Darkened Tower with White Cap | UT Remembers / solemn occasions |
| `dark` | Dark Tower | Fully darkened |

## Repo conventions (see also root CLAUDE.md)

- Next.js 16 App Router, React 19, TS. Alias `@/*` → `src/*`. ESLint only.
- Components PascalCase; data/util files camelCase; routes/data folders/slugs kebab-case.
- Generated data = JSON (not TS). Scripts = `.mjs` in `scripts/` (ref `apply-approved-request.mjs`).
- Embed center icon renders via `<img src=baseUrl + '/icon.svg'>` (`src/app/embed.js/route.ts`,
  ~lines 159–167); base-URL resolution handles `localhost`; CORS `*`. Reuse this `<img>` pattern.
- Bot-commit-on-diff + deploy-hook pattern: `.github/workflows/moderate-join-requests.yml`,
  `trigger-deploy.yml`. Reuse for the scraper Action.

## Phases

Status: `TODO` / `IN PROGRESS` / `DONE`.

### Phase 0 — Foundations (docs only) — DONE
Created root `CLAUDE.md` and this tracker. No feature code.

### Phase 1 — Local dev preview route (harness) — DONE
Built `src/app/dev/embed-preview/page.tsx`: a keyed-remount `<EmbedInjector>` re-runs `/embed.js` on
each config change; controls drive color/arrow/sizes + stage-background swatches, and the inert
`data-tower`/`data-tower-theme` toggles are wired for Phase 3. Verified: dev serves 200, production
build 404s the route (`notFound()` guard), embeds render, lint clean for this file.
- `src/app/dev/embed-preview/page.tsx` (`'use client'`): inject `<script src="/embed.js" data-webring ...>`
  same-origin; controls for `data-color`, `data-arrow`, sizes, background swatches, plus
  (not-yet-functional) `data-tower` and `data-tower-theme` (`light`/`dark`/`auto`) toggles. Remount
  via `key` on config change so the IIFE re-runs.
  Guard: `if (process.env.NODE_ENV === 'production') notFound()`.
- **Acceptance:** `npm run dev` → `/dev/embed-preview` shows a live embed updating with the controls; 404s in a production build.

### Phase 2 — Data layer / config model — TODO
- `src/data/tower/configs.ts`: `TowerConfigSlug` union + per-config metadata (slug, label, description, svg filename).
- `src/data/tower/state.json`: seeded `{ "config": "white", "label": "White Tower", "reason": null, "effectiveDate": null, "sourceUrl": "https://tower.utexas.edu/lightings/", "confidence": "high", "lastChecked": null }`.
- `src/data/tower/override.json`: seeded empty/disabled.
- `src/data/tower/index.ts`: `getCurrentLighting()` merges override over state → resolved config + metadata. Single accessor reused everywhere.
- **Acceptance:** types compile; `getCurrentLighting()` returns the seeded white config.

### Phase 3 — Tower SVG assets + embed rendering — TODO
- Add the light + dark sets: `public/tower/light/<slug>.svg` and `public/tower/dark/<slug>.svg`
  (shared viewBox/geometry; fills + overlays for the "No. 1" numeral and special-effects glow differ).
- `src/app/embed.js/route.ts`: import `getCurrentLighting()` server-side, inline resolved state into the
  generated script (no extra client fetch; route is `max-age=300`). Render the tower **only when
  `scriptTag.getAttribute('data-tower')` is present**, as `<img src=baseUrl + '/tower/' + theme + '/' + slug + '.svg'>`
  with `title` = label + reason, beside the center icon. Existing embeds untouched.
- **Theme resolution:** read `data-tower-theme` (default `light`). For `auto`, resolve via
  `window.matchMedia('(prefers-color-scheme: dark)')` and add a `change` listener that re-points the
  `<img src>` when the device theme flips; for `light`/`dark`, use it directly.
- Wire the `data-tower` toggle **and** a theme selector (`light`/`dark`/`auto`) + background swatches in
  the Phase 1 preview route.
- **Acceptance:** preview shows the correct tower for `state.json` in each theme; `auto` flips with the
  OS theme; default (no `data-tower-theme`) renders light; without `data-tower`, embeds unchanged.

### Phase 4 — Scraper + classifier — TODO
- `scripts/update-tower-lighting.mjs` (mirror `apply-approved-request.mjs`): fetch latest entry + body;
  `classifyHeuristic(text)` → enum ("No. 1"/"champion" → `orange-no1`, "orange top"/"bowl"/"victory" →
  `orange-top`, "darkened"/"remembers" → `darkened-cap`, else `white`); optional single Haiku call
  (guarded by `ANTHROPIC_API_KEY`, constrained to the 7 slugs) only when heuristic is ambiguous; merge
  `override.json` (override wins); write `state.json` only on change. Polite scraping (custom UA, once/day).
- **Acceptance:** local run classifies a recent entry correctly and writes valid JSON; with no API key, heuristic result tagged `confidence: "low"`.

### Phase 5 — GitHub Action automation — TODO
- `.github/workflows/update-tower-lighting.yml`: `schedule` (evening Central, e.g. `0 2 * * *` UTC) +
  `workflow_dispatch`; run the script; commit `state.json` only on a real diff (bot-commit pattern);
  existing deploy hook redeploys. Optional secret `ANTHROPIC_API_KEY`.
- Document optional `ANTHROPIC_API_KEY` in `.env.example`.
- **Acceptance:** `workflow_dispatch` commits only on change and triggers a deploy.

### Phase 6 — Future / optional (not built) — TODO
- Public `/api/tower` endpoint; homepage `TowerStatus` component; richer per-config art; archive
  backfill for historical dates; timezone-aware "tonight" semantics; promote the dev preview into a
  shippable member-facing embed customizer.

## End-to-end verification (after phases 1–5)

- **Visual:** `npm run dev`, `/dev/embed-preview`, toggle `data-tower` + configs; correct tower
  renders, non-tower embeds unchanged; route 404s under `next build && next start`.
- **Data accessor:** `getCurrentLighting()` override precedence (set `override.json`, confirm it wins).
- **Scraper:** `node scripts/update-tower-lighting.mjs` with/without `ANTHROPIC_API_KEY`; spot-check
  archive entries (champion → `orange-no1`, ordinary day → `white`).
- **Action:** `workflow_dispatch` dry run; commit-only-on-diff + deploy hook fires.

## Risks to accept

- White most nights; the feature "pops" only on game days / special occasions.
- Reactive source → "tonight" can be stale until UT posts; manual override is the mitigation.
- 7 SVG files risk drift — shared viewBox/geometry + single-master authoring is the guardrail.
- Be a polite scraper: once/day, respect robots.txt, set a UA string.
