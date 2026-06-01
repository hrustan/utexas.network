# Claude Design prompt — UT Tower lighting icon set

Paste the block below into Claude Design. It generates the 7 lighting-config icons (plus light/dark
theme handling and a few future-proofing assets) used by the webring embed. See
[`PLAN.md`](PLAN.md) for how these slot into the feature.

> **Why these constraints:** the icons are served as static `<img src="/tower/<slug>.svg">` inside the
> embed widget, so they can't inherit the host page's theme color via CSS, and they render as small as
> 16px. The prompt below bakes both facts in. Keep filenames matching the slugs in `PLAN.md`.

---

## PROMPT (copy from here)

You are designing a small, flat, icon-style **SVG set of the University of Texas at Austin Main
Building Tower** in its different nighttime lighting configurations, for use as a tiny status icon in
a website widget.

### Brand & style
- Visual language: **flat, minimal, single-/limited-color silhouette** — like a clean app icon, NOT a
  photorealistic illustration. No gradients (except where explicitly noted), no drop shadows, no
  textures, no embedded raster images.
- Brand colors (use exactly):
  - Burnt orange `#bf5700` (primary UT accent)
  - Lit white `#ffffff`
  - Unlit/dark `#1a1a1a`
  - Gold accent `#ffb81c` (only for special-effects sparkle)
  - Neutral structure stroke `#8a8a8a` (a mid-grey that stays legible on both white and dark backgrounds)

### Subject — the UT Tower (stylized)
A tall, narrow, rectangular clock tower: a slender vertical shaft, **two or three subtle stepped
setbacks near the top**, four **clock faces** suggested as a simple band, an **observation-deck band**
below the top section, and a **peaked/pyramidal cap (lantern)** at the very top. Keep it recognizable
but radically simplified — a confident silhouette that reads at 16px. Do not draw individual windows,
railings, or stonework detail.

### Critical technical constraints
1. **One shared base geometry.** Every icon below must use the **exact same tower path/geometry and
   the exact same `viewBox`** (`0 0 64 64`, tower vertically centered with ~6px padding, narrow). Only
   **fills and small overlays change** between configs — so the icons swap pixel-perfectly with zero
   shift. Define the tower geometry once and reuse it.
2. **Small-size legibility.** Must be clear and balanced at 16px and 56px. Bold shapes only.
3. **Two theme sets (light + dark).** These render via `<img>` and cannot inherit page color, so the
   embed picks a file by theme: `/tower/light/<slug>.svg` or `/tower/dark/<slug>.svg`. Produce **both a
   light-background and a dark-background version of every config.** The light set targets light pages;
   the dark set targets dark pages (lighter/stronger structure outline so the tower stays legible on
   dark). Use a `#8a8a8a` structure outline as the baseline. The orange configs (`orange`,
   `orange-top`, `orange-no1`, `orange-special`) read fine on either background, so their light and
   dark files may be byte-identical — still output both filenames for consistent embed logic.
4. **Clean SVG output.** Optimized paths, no unused defs, no inline raster, no external fonts (render
   any numerals as vector paths). Group/label each deliverable clearly. Square `0 0 64 64` viewBox.

### Deliverables — the 7 lighting configurations, in BOTH theme sets
Produce each config **twice** — once for `/tower/light/<slug>.svg` (light pages) and once for
`/tower/dark/<slug>.svg` (dark pages) — same geometry/viewBox, same fills, differing only in the
structure outline / edge treatment so each stays legible on its target background. The slugs:

1. **`white`** — White Tower. Entire tower filled `#ffffff` with the structure outline. (Everyday
   default.) The **dark-set** version especially needs a strong outline so a white tower reads on a
   dark page; the **light-set** version needs an outline so a white tower reads on a white page.
2. **`orange-top`** — White Tower with Orange Top. Shaft `#ffffff`; the top section (stepped setbacks
   + cap, above the observation-deck band) filled `#bf5700`.
3. **`orange`** — Orange Tower. Entire tower `#bf5700`.
4. **`orange-no1`** — Orange Tower with No. 1. Tower `#bf5700` with a **bold white numeral "1"**
   centered on the upper shaft, thick enough to read at 16px. (National-championship lighting.)
5. **`orange-special`** — Orange Tower with Special Effects. Tower `#bf5700` with small celebratory
   `#ffb81c` sparkle/starburst accents radiating from the cap. Keep it iconic, not busy.
6. **`darkened-cap`** — Darkened Tower with White Cap. Tower `#1a1a1a` except the **cap and the
   observation-deck band** filled `#ffffff`. (Solemn / UT Remembers lighting.) The **light-set**
   version needs an outline so the dark body reads on a white page.
7. **`dark`** — Dark Tower. Entire tower `#1a1a1a` with the structure outline. (Fully darkened.) The
   **dark-set** version needs a strong/light outline so it reads on a dark page.

(The four orange configs read fine on either background — their light and dark files may be identical,
but still output both paths.)

### Deliverables — future-proofing assets (generate now so we have them ready)
- **`tower-hero.svg`** — a larger, slightly more detailed version of the orange tower for a future
  homepage/status component. Same silhouette, but a bigger viewBox (`0 0 256 256`) where modest extra
  detail (suggested clock faces, deck band) is allowed since it renders large. Provide it in the same
  config palette logic so the homepage could show any of the 7 states.
- **`unknown.svg`** — a neutral fallback state for when tonight's configuration can't be determined:
  the `#8a8a8a` outlined tower with a faint grey fill and a small question-mark accent. Same 64×64 geometry.
- **`numeral-1.svg`** — the standalone bold white "1" overlay element on a transparent background,
  positioned to align with the upper shaft of the shared geometry, so it can be reused/composited.
- **`tower-mark.svg`** — a single-color monochrome silhouette of the tower (no lighting, fill
  `currentColor`) for favicon/inline use where the host can theme it via CSS.

### Output format
For each file: a complete, standalone, optimized SVG with `viewBox` set, a short comment naming the
config + theme, and consistent layer grouping. List them clearly labeled by their target path
(`light/<slug>.svg`, `dark/<slug>.svg`, etc.).

## PROMPT (end)

---

## Notes for whoever runs this
- File layout: the 7 configs go in **both** `public/tower/light/` and `public/tower/dark/`; the
  future-proof assets (`tower-hero`, `unknown`, `numeral-1`, `tower-mark`) go in `public/tower/`.
  `PLAN.md` Phase 3 wires `public/tower/<theme>/<slug>.svg` into the embed (theme from
  `data-tower-theme`, default `light`).
- After generation, eyeball each at ~16px and ~56px **on its target background** (light files on a
  white page, dark files on a dark page) before accepting. Re-prompt any that lose legibility.
- The four orange configs read fine on either background — if their light/dark files come out
  identical, that's expected; keep both paths so the embed's `/tower/${theme}/${slug}.svg` logic stays
  uniform with no special-casing.
