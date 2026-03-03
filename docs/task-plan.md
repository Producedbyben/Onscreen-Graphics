# TikTok Graphics Tool Task Plan

This task plan translates the product direction into execution-ready work for a small product engineering team.

## Assumptions
- Platform: web editor with server-side export.
- Existing baseline: asset upload, basic template support, simple in-browser editing, export flow.
- Team shape: 2 frontend, 1 backend, 1 full-stack, 1 design/product.

## Workstreams

## 1) Foundation and Guardrails (Week 1)
### Goal
Make every project TikTok-safe and beginner-friendly by default.

### Tasks
1. **Implement safe-zone constants and overlay guides**
   - Add reusable safe-zone definitions (top, right interaction rail, bottom caption-safe area).
   - Show non-intrusive guide overlay on canvas (toggleable).
2. **Ship smart text defaults**
   - Define min/max font sizes, default weights, line-height rules.
   - Add automatic stroke/shadow when contrast is too low.
3. **Create legibility checker utility**
   - Build helper that samples background luminance and returns pass/fail + fallback style recommendations.
4. **Preset output profiles**
   - Add export presets: TikTok Fast, TikTok Standard, TikTok High.

### Definition of done
- New projects default to 9:16 + safe zones visible.
- Text added from any flow passes baseline legibility checks.
- User can export in one click with preset selection.

## 2) Template-first Experience (Week 1-2)
### Goal
Move users from upload to polished result in under 2 minutes.

### Tasks
1. **Template schema v1 hardening**
   - Add slot constraints (`maxChars`, `allowedStyles`, position presets).
   - Introduce `schemaVersion` and migration hook scaffolding.
2. **Template picker UX pass**
   - Build category tabs (Hook, Captions, CTA, Lower Third, Product).
   - Add "Recommended" badge logic for quick-start choices.
3. **One-click apply path**
   - Implement "Apply best template" action based on project type metadata.
4. **Starter template expansion**
   - Add 20-30 practical templates tuned for TikTok pacing and readability.

### Definition of done
- User can apply a template from upload screen in <= 2 clicks.
- Template fields enforce constraints and no overflow clipping in preview.

## 3) Caption Workflow (Week 2-3)
### Goal
Make captions a first-class flow with minimal editing burden.

### Tasks
1. **Caption data model support**
   - Add `CaptionSegment` with word-level timestamps support.
2. **Transcription provider integration abstraction**
   - Introduce provider interface + one initial implementation.
3. **Caption editor panel**
   - Segment list, inline text fix, timing nudges.
4. **Style packs for captions**
   - Add 8-12 curated caption style packs.
5. **Highlight animation presets**
   - Word or phrase emphasis with simple toggles.

### Definition of done
- User can generate captions, apply style, correct text, and export without leaving editor.

## 4) Core Editing Usability (Week 3-4)
### Goal
Deliver Canva-like ease without overwhelming controls.

### Tasks
1. **Layer panel improvements**
   - Reorder, lock, hide, duplicate, group/ungroup.
2. **Snapping and alignment**
   - Snap lines, center snapping, spacing hints.
3. **Right-panel progressive controls**
   - Basic controls always visible; advanced controls collapsed.
4. **Keyboard shortcuts (minimal set)**
   - play/pause, undo/redo, delete, duplicate, nudge.

### Definition of done
- Common editing operations are possible without hunting through menus.
- Power features are discoverable but not noisy.

## 5) Export Reliability and Performance (Week 4-6)
### Goal
Exports feel predictable and fast enough for creator workflows.

### Tasks
1. **Hybrid render path**
   - Keep browser preview fast; route final export through server render.
2. **Render job resilience**
   - Retry policy, idempotency key, user-visible status messages.
3. **Performance instrumentation**
   - Capture preview FPS, export queue time, render duration metrics.
4. **Golden render tests**
   - Snapshot baseline output for key templates across engine changes.

### Definition of done
- Export failures are recoverable and understandable.
- Performance metrics are visible in internal dashboard/logs.

## 6) Brand and Variants (Week 6-8)
### Goal
Help creators scale output for campaigns with consistency.

### Tasks
1. **Brand kit model + UI**
   - Logo, colors, font stack, fallback behavior.
2. **Apply brand globally**
   - One action to restyle matching elements in project.
3. **Variants generator v1**
   - Duplicate project with text/CTA substitutions.
4. **Batch export queue**
   - Export all variants with progress and retry controls.

### Definition of done
- Team can generate 3+ variants from one base project and export in one run.

---

## Prioritized Engineering Backlog (First 10)
1. Define and validate template schema v1 + migration helper.
2. Implement TikTok safe-zone engine and always-on guides.
3. Add smart typography defaults with auto legibility fallback.
4. Build template picker categories + recommendation tagging.
5. Add one-click "Apply best template" flow.
6. Implement caption segments in project model and persistence.
7. Integrate transcription provider abstraction and first provider.
8. Ship caption style packs and highlight presets.
9. Add export presets (Fast/Standard/High) and resilient status handling.
10. Add golden render tests + basic layout rule unit tests.

## Suggested Sequencing by Sprint
- **Sprint 1**: backlog items 1-4
- **Sprint 2**: items 5-8
- **Sprint 3**: items 9-10 + stabilization

## Success Metrics (track weekly)
- Median time-to-first-export.
- % projects using template-first path.
- Caption flow completion rate.
- Export success rate (first attempt).
- Median export turnaround time.
- % exports passing legibility/safe-zone validation checks.
