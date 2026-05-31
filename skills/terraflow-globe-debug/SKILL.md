---
name: terraflow-globe-debug
description: Diagnose and fix TerraFlow Cesium globe failures and performance issues. Use for blank globes, SSR failures, hydration errors, dynamic import issues, Cesium asset loading, Webpack configuration, chunk failures, memory leaks, and slow rendering.
---

# TerraFlow Globe Debug

## Purpose

Debug the globe as TerraFlow's primary product surface.

## Activation Conditions

Use whenever Cesium, globe rendering, map assets, globe interactions, or globe performance fail or regress.

## Rules

- Reproduce before changing code and preserve error logs.
- Check SSR boundaries, dynamic imports, Cesium assets, Webpack configuration, chunk loading, memory leaks, and performance bottlenecks.
- Fix the root cause and keep the globe central.
- Never assume the fix works. Verify with evidence.
- Avoid unnecessary complexity and prioritize stability.

## Checklist

- Reproduce the failing state.
- Inspect browser console, network requests, and server logs.
- Check client-only loading and asset paths.
- Check build configuration and chunk delivery.
- Profile repeated mounts, event handlers, and render cost.
- Verify the fixed globe in the browser and document evidence.

## Output Format

```markdown
## Root Cause
- Evidence-backed diagnosis

## Fix
- Change made

## Files Affected
- Path

## Verification Steps
- Command or browser check and result
```

## Examples

- "Use $terraflow-globe-debug to fix the blank Cesium globe after deployment."
- "Find the source of the globe memory leak during route changes."
