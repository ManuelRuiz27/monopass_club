# Branding and Logo Checklist - Sprint 0 Baseline

## Purpose
Define logo usage rules for UI implementation consistency.

## Logo variants
- Full logo: `wordmark + isotipo`
- Isotipo only: `P`
- Monochrome logo: one-color variant for constrained backgrounds

## Minimum sizes
- Full logo min width: `96px`
- Isotipo min width: `20px`
- Do not scale below min sizes.

## Safe space
- Full logo safe space: at least `0.5x` logo height on each side.
- Isotipo safe space: at least `8px` around the mark.

## Approved usage
- App header and navigation contexts.
- Auth and onboarding contexts where branding supports orientation.
- Neutral UI surfaces with sufficient contrast.

## Restricted usage
- Staff critical scanner states (valid/invalid/error overlays) where focus must remain on status.
- Dense data tables and KPI cards where brand repetition adds noise.
- Background watermark overlays behind critical text.

## Contrast rules
- Logo must pass AA contrast against background.
- Use monochrome variant if role palette conflicts with readability.

## Implementation notes
- Prefer SVG as source asset.
- Avoid PNG fallback unless required by platform constraints.
- Do not alter aspect ratio, colors, or add effects not defined in design.
