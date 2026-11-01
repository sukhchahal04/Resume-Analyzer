# Design decisions: Resume Analyzer frontend

Built from the `design-taste-frontend` app-screen path (references/app-screens.md) and `frontend-design`.
Every later session follows this file and `src/styles/tokens.css`; do not re-derive the look.

## What this is
An app screen people work in: upload a resume, paste a job description, read the analysis. Not a landing page.
Style: achromatic ledger. Chrome carries no colour; the one hue marks the main data element.

## Face (what makes it this product)
- Mark: a page with a check in the accent (`App.jsx`), name "Resume Analyzer" at the top of the sidebar.
- Signature element: the ten-check strip (one segment per ATS check, filled = passes, hatched = needs fixing). Reuse the same idea for skill coverage and evidence levels later.
- Type: IBM Plex Sans only (400/500/600), tabular figures on every number. No second face.
- Colour: `--accent #1a66a6` on data only (strip, later: score, strong evidence). Failing = `--negative` hatch and icon. Primary button is the accent (the one control in colour). About 6% coloured pixels.

## Rules
- Sidebar on the page ground, grey pill for the active item, sentence case, no icons in coloured circles.
- Title is a noun (24/600). Biggest figure answers the title (score 36px). No figure at 48px or over.
- Surfaces flat: 1px borders, no shadows, radius 8 on panels, 6 on controls.
- KPIs are type, not tiles. No sparklines. Deltas, if any, name their baseline.
- Rows: label ink, message grey, one status mark per row. Numbers right-aligned and tabular in tables.
- States: loading = flat grey bars at real size; error inside the block with Retry; empty keeps its frame with one sentence.
- Motion: app screens have no entrance animation. GSAP is used only as feedback to an action (score count-up when a result arrives), always off for `prefers-reduced-motion`. Keep GSAP calls in `src/hooks.js`.
- Phone: sidebar folds to a top bar; controls move above results; touch targets 44px.

## Evidence levels (for milestone 3)
strong = accent fill; partial = accent at 40% fill; weak = grey outline. Same swatch used in the legend.

## Visual upgrade (after milestone 5)
- Score ring: accent arc on a `--border` track, number counts up inside (`ScoreRing.jsx`); used for the Analyze match score and the ATS readability score.
- Summary panel: ring on the left; finding sentence, three figures and (ATS) the check strip on the right. One bordered panel, no shadow.
- Upload: dashed drop zone (click, keyboard or drag-and-drop); border and a 6% accent tint on hover/drag; the chosen file shows in a small bordered row with an accent file icon.
- Empty state on Analyze: three steps that tick off (accent check) as a resume is added and a job description is long enough.
- Skills: missing and matching side by side (one column on phone).
- ATS checks grouped under Contact, Structure and Content with "n of m pass", failing checks first in each group.
- Styles for all of this live in `src/styles/visual.css`. Still no gradients (except the hatch exception), shadows or second typeface.
- Sidebar footer: a small flat drawing of a result (page, ring, check strip) built from the product's own marks, plus the mock-mode note. Hidden on phone. Remove the drawing if it ever feels like decoration.
