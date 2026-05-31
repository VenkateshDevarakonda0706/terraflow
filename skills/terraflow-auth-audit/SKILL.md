---
name: terraflow-auth-audit
description: Verify TerraFlow authentication and authorization behavior. Use for Google OAuth, login, logout, session persistence, protected routes, access control, auth regressions, and pre-release auth checks.
---

# TerraFlow Auth Audit

## Purpose

Verify that TerraFlow authentication works without blocking exploration unnecessarily.

## Activation Conditions

Use for auth implementation, OAuth configuration, session changes, protected-route changes, and release QA.

## Rules

- Test Google OAuth, login, logout, session persistence, protected routes, and authorization.
- Keep public globe exploration available before login unless a requirement proves otherwise.
- Test both allowed and denied paths.
- Never assume auth works. Verify with evidence.
- Prefer root-cause fixes, low complexity, stability, and the TerraFlow vision.

## Checklist

- Verify successful and failed login.
- Verify Google OAuth redirect and callback behavior.
- Verify logout and session invalidation.
- Verify persistence after reload.
- Verify protected routes and authorization boundaries.
- Record security concerns and evidence.

## Output Format

```markdown
## Status
PASS | FAIL | BLOCKED

## Issues Found
- Issue and evidence

## Security Concerns
- Risk and recommended fix
```

## Examples

- "Use $terraflow-auth-audit to verify Google OAuth and protected uploads."
- "Check whether logout invalidates the active session."
