---
name: terraflow-release-readiness
description: Determine whether TerraFlow is ready for production using evidence from globe, login, upload, search, profiles, mobile, build, and issue verification. Use before releases, deployments, launch decisions, and go-live reviews.
---

# TerraFlow Release Readiness

## Purpose

Issue an evidence-backed production readiness decision.

## Activation Conditions

Use before release, deployment, launch, or any request to decide whether TerraFlow is production-ready.

## Rules

- Verify the globe, login, upload, search, profiles, mobile behavior, build, and critical issue status.
- Treat unverified required checks as release blockers.
- Do not declare readiness while any critical issue remains.
- Never assume a feature works. Verify with evidence.
- Prefer root-cause fixes, low complexity, stability, and the TerraFlow vision.

## Checklist

- Verify the globe loads and supports exploration.
- Verify login and logout.
- Verify upload, search, and profiles.
- Verify representative mobile behavior.
- Run the production build.
- Confirm there are no unresolved critical issues.
- Check alignment with TerraFlow product principles.

## Output Format

```markdown
# READY FOR PRODUCTION

or

# NOT READY FOR PRODUCTION

## Evidence
- Required check and result

## Blockers
- Critical or unverified item
```

## Examples

- "Use $terraflow-release-readiness to decide whether the current branch can launch."
- "Run a production readiness audit and list blockers."
