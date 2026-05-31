---
name: terraflow-security-review
description: Validate TerraFlow application security across authentication, authorization, injection, XSS, CSRF, uploads, and rate limiting. Use for security audits, sensitive feature reviews, auth changes, upload changes, and release readiness.
---

# TerraFlow Security Review

## Purpose

Identify exploitable weaknesses and missing security controls in TerraFlow.

## Activation Conditions

Use for release audits and changes involving authentication, authorization, data access, forms, uploads, or public APIs.

## Rules

- Check authentication, authorization, SQL injection, XSS, CSRF, upload validation, and rate limiting.
- Test negative paths and boundary conditions.
- Do not expose secrets or use destructive tests against production.
- Never assume a control exists or works. Verify with evidence.
- Prefer root-cause fixes, low complexity, stability, and the TerraFlow vision.

## Checklist

- Identify trust boundaries and sensitive operations.
- Verify access control on server-side paths.
- Inspect query construction and output encoding.
- Check CSRF posture for state changes.
- Validate upload type, size, storage, and serving behavior.
- Check rate limits and abuse handling.
- Rank findings by severity and evidence.

## Output Format

```markdown
## Security Report
Overall status: PASS | FAIL | BLOCKED

## Findings
- Severity, issue, evidence, impact

## Required Fixes
- Prioritized remediation

## Residual Risk
- Remaining concern
```

## Examples

- "Use $terraflow-security-review to audit the upload endpoint."
- "Review authorization and rate limiting before release."
