# AsterGraph logo refinement — concept checkpoint

2026-11-01. Status: three tested concepts; awaiting direction selection. No application logo files have been replaced. This is a refinement of the existing identity, not a product redesign.

## Brief and assumptions

AsterGraph is an Operations Intelligence product for enterprise operations teams. Its identity should feel precise, trustworthy and restrained. The symbol must work in the sidebar, compact header, demo ending and browser favicon, across light and dark modes. The existing A letterform and AsterGraph spelling are the strongest continuity cues. Navy/blue remains a product-system constraint, but concepts are deliberately judged in monochrome first. No request to change the name, data model or product positioning was inferred.

The existing mark combines an A, a crossing branch and a small square terminal. The crossing introduces competing edges, and the detached terminal is difficult to interpret at favicon size. Keep the A/name recognition; reduce overlapping detail and dependence on two colours.

## Research and concept map

The installed logo library's database/data category contained 90 entries: pictorial 35.6%, abstract 25.6%, combination 21.1%, letterform 10%; blue 25.6%. These are library statistics, not a market census. Subjects researched: letter A, frame, letter G and negative space. Geometry studied in Pagekit, Framer, AdonisJS, Kotlin and Section examples. References were studied, not traced. The comparison sheet uses Framer, AdonisJS and Pagekit as craft peers, not as a comprehensive competitor or trademark survey.

Avoid: generic connected dots, growth arrows, AI sparkles, database stacks, shields and decorative gradients. Word map: Aster → A/anchor; Graph → relationship/shared structure; intelligence → clarity/opening; operations → alignment/stability; precision → consistent planes and controlled gaps. The useful intersections are an opened A, aligned frames and an open G.

Exploration scores are editorial judgments, 1–5; columns: clarity / distinction / simplicity / relevance / small-size strength.

| Concept | One-sentence construction | Scores | Decision |
|---|---|---|---|
| Open A | Open the A's counter to the right, turning the gap itself into the identifying detail. | 5/4/5/5/5 | Build A; recommend |
| Shared Frame | Align two offset open frames around a shared negative-space interval. | 4/4/5/4/5 | Build B; abstract alternative |
| Graph Gate | Form a chamfered G with a wide entrance and one horizontal return. | 5/3/5/4/5 | Build C; contrasting G direction |
| Cut Wordmark | Cut one aligned opening through the A and G of the name. | 3/4/3/4/2 | Name-dependent at small sizes |
| AG Ligature | Share a single upright between angular A and G shapes. | 3/3/3/4/2 | Reading becomes ambiguous |
| Three Planes | Align three folded planes into a quiet directional symbol. | 3/3/4/3/4 | Weak name association |
| Aperture | Open one side of a square around an offset core. | 4/2/5/3/4 | Generic app/camera reading |
| Aster Cut | Cut an A from a compact star-like silhouette. | 3/3/3/3/2 | Too close to generic AI symbolism |
| Shared Baseline | Join two upright forms through a common baseline. | 3/3/4/4/3 | Resembles interface furniture |
| Decision Seal | Place an opened A inside a thin square boundary. | 4/2/3/4/2 | Containment adds unnecessary detail |

## Construction and refinement

All three symbols use a 256 × 256 canvas and a single filled path, with no live text, raster image, mask, gradient, filter or stroke. B contains two closed subpaths. Each meaningful version is saved under `iterations/`.

- A: 1:2 leg slopes, flat apex, horizontal lower bar. V2 raises the internal apex from y96 to y84 and widens the horizontal opening from 24 to 28 units. This reduces excess weight at the top while preserving the A reading. Horizontal bar is intentionally thinner than the diagonal stems. Bounds: x20–236, y40–216.
- B: perpendicular open frames; V2 reduces principal thickness from 40 to 36 units and rounds three outer corners with radius 8. Bounds: x36–220, y36–220. The small radii are polish, not recognition-critical details.
- C: 45° chamfers and horizontal/vertical stems; V2 opens the right entrance from 16 to 32 units and uses 40-unit principal stems with a thinner 32-unit crossbar. Bounds: x32–224, y32–224.

## Verification and assessment

Both v1 and v2 were audited with `svg_audit.py`, rendered at 512px with `render_png.py`, and visually inspected. All six symbol files reported no automated audit findings; this is a geometry/file heuristic, not a guarantee of design quality. V2 browser test sheets were inspected at 16/20/24/32/48/64/96/128/256px, in monochrome, reversed, mirrored and rotated treatments, and in favicon/header contexts. A peer shelf comparison was visually inspected. `before-after.html` compares the existing mark and A at equal canvas sizes.

A reads clearly as A at 16px and retains the existing identity most directly. Its risk is the crowded category of angular A marks; the opened counter is a distinguishing feature, not a claim of exclusive ownership. B remains legible as an abstract shape but can resemble a generic software icon or brackets. C reads clearly as G but is heavier and more industrial than the current product tone. No obvious unintended pictorial reading was observed in mirror/rotation inspection.

White-on-dark versions remain legible but appear optically heavier; final reversed geometry should be adjusted after a direction is chosen. The test sheet deliberately includes black artwork on black and neutral dark fields, which fails contrast; those are not approved combinations. Pattern/photo-like fields are stress tests, not recommended logo backgrounds.

`concepts.png` is the user-facing comparison. Its wordmarks are exploratory live Arial text, not outlined production masters or a final typography decision. No app code changed, so app build and interaction tests were not rerun for this concept-only work. No trademark registry/reverse-image clearance was performed; production identity clearance remains a separate professional check.

## Recommendation and next step

Recommend A — Open A: it preserves recognition while resolving the overlap and small-node problems. Upon selection, refine the final geometry, type and spacing; produce brand-colour/black/white variants, horizontal/stacked lockups, a small-size cut and favicon/app-icon set, plus usage guidance. Then replace the existing shared brand component and favicon assets, verify both themes in the app and rerun relevant build/UI checks.

The invoked logo-design skill requires a concept checkpoint before that kit: “Build the kit (Phase 7) only after they pick a direction and say yes.”
