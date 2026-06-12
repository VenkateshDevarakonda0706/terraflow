# TerraFlow Performance Budgets & Cesium Loading

This document establishes performance budgets, describes the Cesium dynamic loading strategy, records baseline metrics, and provides validation steps for contributors to prevent loading regressions.

---

## 1. Performance Budgets

To preserve a fast, lightweight, globe-first experience, the following budgets must be strictly maintained:

* **First Load JS size limit**: Each page route must stay **under 150 KB** (First Load JS).
* **Initial bundle isolation**: Cesium modules and libraries must not be compiled into initial bundle chunks.
* **Lazy loading**: The Cesium rendering container and supporting assets must be deferred to client-side runtime hydration.
* **Globe responsiveness**: Ensure smooth frame rates ($\ge 60\text{ fps}$) and responsive interactions on both desktop and mobile viewports.

---

## 2. Budget Violation Response

If a pull request or proposed change violates the route performance budgets:

1. **Analyze Chunk Size**: Check the Next.js build console output, which details individual route chunk sizes and shared dependencies.
2. **Implement Lazy Loading**: Apply dynamic imports via `next/dynamic` with `ssr: false` for client-only widgets or heavy components.
3. **Isolate Heavy Imports**: Do not import Cesium or heavy libraries inside core layouts or components that load before runtime page mount.
4. **Audit Dependencies**: Ensure third-party utilities are tree-shaken and loaded on-demand.

---

## 3. Current Baseline Measurements

The following baseline metrics were collected using a production build compilation on **2026-06-11**:

| Route (app) | Page Size | First Load JS |
| :--- | :--- | :--- |
| `/` (Homepage) | 13.9 kB | 116 kB |
| `/u/[username]` (Profile Page) | 4.09 kB | 107 kB |

* **Shared JS (all routes)**: 102 kB

*Note: Next.js production build output is the primary mechanism to inspect route bundles, individual page sizes, and shared JavaScript chunks across workspaces.*

---

## 4. Cesium Loading Strategy

The NestJS-Next.js monorepo architecture applies a multi-layered deferred loading mechanism to isolate Cesium's heavy bundle size from initial page loads:

1. **Next.js Dynamic Imports with SSR Disabled**:
   The globe component is dynamically loaded in page routes (`page.tsx` and `u/[username]/page.tsx`) using Next.js `dynamic()`:
   ```typescript
   const CesiumGlobe = dynamic(() => import('@/components/globe/CesiumGlobe'), { ssr: false });
   ```
   This keeps server-side rendering fast and avoids errors when attempting to render WebGL context canvas elements on the server.
2. **Static Local Asset Hosting**:
   A pre-build utility script (`copy-cesium-assets.js`) copies static libraries and widgets from `node_modules/cesium/Build/Cesium` to `public/cesium/`. Assets are served locally, removing dependencies on public CDNs.
3. **Runtime Asynchronous Script Loading**:
   Inside `CesiumGlobe.tsx`, `loadCesium()` dynamically injects a `<script src="/cesium/Cesium.js" async>` element into `document.head` when the component mounts in the browser.
4. **Duplicate Load Prevention**:
   The `loadCesium` method queries the DOM for `script[data-terraflow-cesium]` before injecting a new tag. This ensures that concurrent page rendering operations share a single pending Promise rather than triggering duplicate network requests.

---

## 5. Validation Procedure for Contributors

Before opening a pull request, verify that changes conform to performance budgets.

### Step 1: Run Production Build
Run the build script at the repository root to compile all packages and Next.js applications:
```bash
npm run build
```

### Step 2: Verify Bundle Budgets
Verify from the build console output that the **First Load JS** of the home route `/` and profile route `/u/[username]` remain **below 150 KB**.

### Step 3: Verify Lazy Loading
Open your browser's Developer Tools network panel, navigate to `http://localhost:3000`, and confirm:
* Initial document and hydration scripts load first.
* `Cesium.js` only downloads after page mount.

---

## 6. Manual Verification

### Desktop Verification
1. Run `npm run start --workspace=apps/web`.
2. Access `http://localhost:3000` on a desktop viewport.
3. Check the browser console to verify there are no WebGL initialization warnings or dynamic import errors.
4. Rotate the globe to verify smooth animation controls.

### Mobile and Lighthouse Verification
1. Open Chrome DevTools and toggle device emulation (e.g., set to Moto G4 or iPhone 12/13).
2. Open the **Lighthouse** tab in DevTools.
3. Select **Navigation (Default)**, **Mobile**, and check **Performance**.
4. Run the report and verify that initial load metrics (FCP, LCP, and TBT) remain low, confirming that the deferred loading mechanism is active.