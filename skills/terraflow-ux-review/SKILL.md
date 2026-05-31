---
name: terraflow-ux-review
description: Audit TerraFlow user experience and identify friction in onboarding, navigation, discovery, search, upload, and profile flows. Use for journey reviews, flow changes, prototypes, implemented features, and release QA.
---

# TerraFlow UX Review

## Purpose

Audit whether TerraFlow is intuitive, exploration-first, and free of unnecessary friction.

## Activation Conditions

Use for onboarding, navigation, discoverability, search, upload, profile, and login-gating decisions.

## Rules

- Start from the user's goal and verify the actual path.
- Ask whether login is required too early and whether steps can be removed.
- Favor discovery through the globe before account creation.
- Never assume a flow works. Verify with evidence.
- Prefer root-cause fixes, low complexity, stability, and the TerraFlow vision.

## Checklist

- Test onboarding and first exploration.
- Test navigation and discoverability.
- Test search, upload, and profile flows.
- Count unnecessary steps and blocked paths.
- Check desktop and mobile behavior.
- Record evidence and prioritize friction points.

## Output Format

```markdown
## UX Review
UX score: 0-100

## Friction Points
- Issue, evidence, impact

## Recommendations
- Prioritized fix
```

## Examples

- "Use $terraflow-ux-review to review the first-time visitor journey."
- "Audit whether login appears too early in the upload flow."
