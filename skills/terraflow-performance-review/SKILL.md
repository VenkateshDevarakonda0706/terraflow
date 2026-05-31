---
name: terraflow-performance-review
description: Measure and optimize TerraFlow performance with emphasis on globe rendering, bundle size, render speed, API latency, and database performance. Use for regressions, profiling, Lighthouse reviews, and pre-release optimization.
---

# TerraFlow Performance Review

## Purpose

Keep TerraFlow fast enough for a premium exploration experience.

## Activation Conditions

Use for slow loads, globe stutter, large bundles, slow APIs, slow database queries, or release performance audits.

## Rules

- Measure before and after optimization.
- Check globe FPS, bundle size, render speed, API response times, and database performance.
- Target Lighthouse scores above 90 and globe rendering above 60 FPS where the test environment can sustain it.
- Never assume performance improved. Verify with evidence.
- Prefer root-cause fixes, low complexity, stability, and the TerraFlow vision.

## Checklist

- Record environment and baseline.
- Measure Lighthouse and bundle size.
- Profile globe FPS and render work.
- Measure representative API latency.
- Inspect database query cost where relevant.
- Re-measure after changes and report deltas.

## Output Format

```markdown
## Performance Review
- Baseline and environment

## Findings
- Metric, evidence, impact

## Optimization Recommendations
- Prioritized change

## Targets
- Lighthouse: measured value
- Globe FPS: measured value
```

## Examples

- "Use $terraflow-performance-review to profile the globe homepage."
- "Find the largest bundle contributors and recommend fixes."
