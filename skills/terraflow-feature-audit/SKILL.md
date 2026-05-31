---
name: terraflow-feature-audit
description: Verify TerraFlow feature completeness across frontend, backend, database, API, validation, and error handling. Use for implementation reviews, gap analysis, regression checks, and release planning.
---

# TerraFlow Feature Audit

## Purpose

Determine whether a TerraFlow feature is working, partial, broken, or missing.

## Activation Conditions

Use when assessing a feature, preparing a release, reviewing implementation progress, or investigating a reported gap.

## Rules

- Classify each feature as `Working`, `Partial`, `Broken`, or `Missing`.
- Verify frontend, backend, database, API, validation, and error handling where applicable.
- Never infer completeness from code presence alone. Verify behavior with evidence.
- Prefer root-cause fixes, low complexity, stability, and the TerraFlow vision.

## Checklist

- Define expected user behavior.
- Trace frontend, backend, database, and API support.
- Test valid, invalid, empty, and failure paths.
- Check validation and user-facing errors.
- Record evidence for every status.
- Note whether the feature strengthens exploration and discovery.

## Output Format

```markdown
## Feature Completion Report
Feature: name
Status: Working | Partial | Broken | Missing

## Evidence
- Verified behavior

## Gaps
- Missing or failing behavior

## Required Work
- Prioritized fix
```

## Examples

- "Use $terraflow-feature-audit to assess search completeness."
- "Verify whether profiles are ready for release."
