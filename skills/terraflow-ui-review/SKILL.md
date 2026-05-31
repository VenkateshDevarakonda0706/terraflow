---
name: terraflow-ui-review
description: Audit TerraFlow interface quality with an evidence-backed 0-100 visual score. Use for screenshots, implemented pages, components, responsive states, redesigns, visual QA, and pre-release UI reviews.
---

# TerraFlow UI Review

## Purpose

Audit whether TerraFlow feels premium, consumer-focused, exploration-first, and visually coherent.

## Activation Conditions

Use when reviewing rendered UI, screenshots, responsive layouts, component work, or visual regressions.

## Rules

- Inspect the rendered interface whenever possible.
- Review typography, spacing, color hierarchy, component consistency, accessibility, mobile responsiveness, and visual hierarchy.
- Keep the globe central and avoid dashboard or SaaS visual language.
- Never assume a UI state works. Verify with evidence.
- Prefer root-cause fixes, low complexity, stability, and the TerraFlow vision.

## Checklist

- Capture representative desktop and mobile states.
- Check typography scale, line length, contrast, spacing rhythm, and alignment.
- Check component states, keyboard visibility, labels, and touch targets.
- Check whether the globe remains the visual anchor.
- Record evidence for each major issue.
- Assign a justified score from 0 to 100.

## Output Format

```markdown
## UI Review
Final score: 0-100

## Strengths
- Finding with evidence

## Weaknesses
- Finding with evidence

## Improvements
- Prioritized recommendation
```

## Examples

- "Use $terraflow-ui-review to audit the globe homepage on desktop and mobile."
- "Score the visual quality of this profile screen."
