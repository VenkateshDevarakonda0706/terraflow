---
name: terraflow-build-fix
description: Troubleshoot and fix TerraFlow install, build, and development startup failures across the monorepo. Use for npm install, npm run build, npm run dev:web, npm run dev:api, missing dependencies, version conflicts, workspace issues, tsconfig errors, and Prisma failures.
---

# TerraFlow Build Fix

## Purpose

Restore a working TerraFlow build and development environment.

## Activation Conditions

Use whenever installation, compilation, Prisma generation, or web/API startup fails.

## Rules

- Reproduce the failure and capture the first actionable error.
- Check dependencies, version conflicts, monorepo wiring, tsconfig, and Prisma.
- Continue fixing until the requested build succeeds or an external blocker is proven.
- Never claim success without command evidence.
- Prefer root-cause fixes, low complexity, stability, and the TerraFlow vision.

## Checklist

- Run `npm install` when dependency state must be verified.
- Run `npm run build`.
- Run `npm run dev:web` and `npm run dev:api` when startup behavior is relevant.
- Audit missing dependencies, version conflicts, workspaces, tsconfig, and Prisma.
- Re-run the failing command after each focused fix.
- Report remaining blockers with evidence.

## Output Format

```markdown
## Status
PASS | BLOCKED

## Root Cause
- Evidence

## Fixes
- File and change

## Verification
- Command and result
```

## Examples

- "Use $terraflow-build-fix to make `npm run build` pass."
- "Debug why `npm run dev:api` fails after the Prisma upgrade."
