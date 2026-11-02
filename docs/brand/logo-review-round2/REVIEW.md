# AsterGraph logo refinement — round 2

2026-11-01 · Concept revision, not an approved production identity.

## What changed

The first round relied on heavy angular initials and a generic bold wordmark. This round considers the name and symbol as one composition: lighter optical weight in the wordmark, deliberate spacing, curved external corners and larger openings. Product requirements and application code are unchanged.

Three new forms were built and inspected. The four-point Aster Lens concept was rejected after rendering because it reproduced a familiar AI/sparkle silhouette. The two stronger directions are presented rather than retaining a weak third option.

- **A — AG Aperture (recommended):** a rounded triangular silhouette evokes A while a right-facing opening and inward return evoke G. One continuous filled contour; no detached node, overlay, thin branch or decorative container. More distinctive than the previous straightforward A, though the triangle remains a common technology motif. This is an evocative monogram, not a guarantee that everyone will read both letters immediately.
- **B — Relay:** two open structures share a consistent orthogonal/curved vocabulary. More abstract and structural. Less direct association with the product name and less clear than A at the smallest size.

## Refinement and evidence

- v1 and v2 are preserved under `iterations/`; overview images preserve both passes.
- A: corrected inner diagonal edges to 60°, retained broad 24-unit opening, kept round outer corners with crisp inner geometry. The audit's two near-angle findings were resolved.
- B: removed a 4-unit corner collision and narrow step-like junction from the initial drawing. Rebuilt the lower return as one continuous contour and separated the upper arc with a 28-unit aperture.
- Reduced symbol size in the horizontal combinations so it does not overpower the product name.
- Wordmark: Manrope at interpolated weight 560, with explicit pair-spacing corrections for As/st/te/er/rG/Gr/ra/ap/ph. All letters are outlined paths. These are optically spaced existing type outlines, not a claim of a wholly custom typeface.
- Both v2 symbols pass `svg_audit.py` without findings. Its numerical score is a file/geometry heuristic, not a subjective quality score.
- Both passes were rendered and visually inspected. V2 was reviewed in the browser at 16/20/24/32/48/64/96px, on light and navy backgrounds, and in horizontal wordmark combinations. A mirror/180°/reversed inspection showed no obvious unintended reading. B retains more complexity at 16px; A is the stronger compact icon.
- `concepts-context.png` is the comparison to show the user, with a small colour study for the recommended direction. `contexts.html` contains scale and background proofs; these are concept previews, not screenshots of a changed app.
- Actual application integration and full theme/UI regression tests remain pending concept selection. No application files changed, so app build/tests were not rerun.

## Typeface source

The included Manrope font was obtained from the [Google Fonts repository](https://github.com/google/fonts/tree/main/ofl/manrope), whose accompanying `OFL.txt` identifies SIL Open Font License 1.1. The exact licence is preserved in `fonts/OFL.txt`. This is the Google Fonts OFL release, not the newer Manrope V5 release under a different licence. The SVG wordmarks have no installed-font dependency.

The local reference library was checked for triangle, letter G, arch, knot and asterisk subjects. Amplication and Graphene geometry were inspected; Prisma, Amplication and Framer are included as craft peers in the test sheet. This is limited design research, not trademark clearance. A professional similarity/registry check is still needed before a commercial identity launch.

## Next step

Await direction feedback per the invoked logo-design concept checkpoint. For an approved direction: final optical/reversed/small-size corrections, colour variants, final lockups, favicon/web-icon kit and compact usage guide; then apply consistently to the app sidebar, compact header, ending and favicon. The current live application still uses its existing logo.
