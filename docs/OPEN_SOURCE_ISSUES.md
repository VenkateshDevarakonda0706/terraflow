# TerraFlow Open Source Audit and Issue Backlog

Audit date: 2026-06-01  
Build evidence: `npm.cmd run build` passed on Windows PowerShell. Plain `npm run build` was blocked by local PowerShell execution policy.  
Repository health score: 72 / 100

## Repository Audit

### Structure

- `apps/web`: Next.js app with a full-screen Cesium globe, guest hero, search, upload modal, memory card, profile panel, and mobile navigation.
- `apps/api`: NestJS API with auth, posts, social, websocket gateway, workers, rate limiting, and sanitization interceptor.
- `packages/database`: Prisma schema with users, posts, media, follows, saves, reports, messages, notifications, capsules, and travel stats.
- `packages/shared`: Shared TypeScript types and constants.
- `docs`: Design system documentation.
- `skills`: TerraFlow-specific product, UI, UX, build, security, performance, auth, feature, and release review instructions.

### Strengths

- The product direction is clear: exploration-first globe, delayed login, and memory publishing.
- The monorepo builds successfully.
- API validation uses DTOs and global validation pipes.
- Spatial clustering is implemented through H3.
- Upload storage supports local development and optional GCS.
- The design system document gives contributors useful product context.

### Gaps and Risks

- GitHub community files were missing before this audit.
- README had encoding issues and stated private license terms even though `LICENSE` is GPL-3.0.
- There is no root `test`, `lint`, or `format` script for contributors.
- Jest test files exist, but the repo does not expose an obvious test runner command.
- The web app depends on external Unsplash and Nominatim calls without documented fallbacks or tests.
- EXIF GPS extraction currently returns placeholder coordinates based on image width instead of parsing real GPS tags.
- `extractUserIdSafely` decodes JWT payloads without verifying signatures for optional user context.
- Search and explore pagination metadata is incomplete or inconsistent.
- Several Prisma models are not yet surfaced in complete UI/API flows.
- Uploaded sample files are present in `apps/api/public/uploads`, which should not become part of normal contributor workflows.

## Top 10 Highest-Impact Issues

1. Add root test and lint commands so contributors can verify changes consistently.
2. Replace placeholder EXIF GPS extraction with real GPS parsing.
3. Verify optional JWT user context instead of decoding tokens without signature checks.
4. Add CI for build, typecheck, tests, and formatting.
5. Add contributor seed data and screenshots for a reliable demo.
6. Improve upload validation, error states, and accessibility.
7. Add API tests for visibility rules across public, friends-only, and private posts.
8. Add pagination metadata to search and explore responses.
9. Reduce Cesium asset and bundle risk with documented performance budgets.
10. Add public profile routes/pages that match existing backend capability.

## Recommended Labels

| Label | Color | Purpose |
| --- | --- | --- |
| `good first issue` | `#7057ff` | Small, well-scoped beginner tasks. |
| `help wanted` | `#008672` | Maintainers welcome community help. |
| `bug` | `#d73a4a` | Broken behavior or regressions. |
| `enhancement` | `#a2eeef` | Product or feature improvements. |
| `documentation` | `#0075ca` | Docs, README, comments, examples. |
| `ui/ux` | `#c5def5` | Visual design, accessibility, flows. |
| `frontend` | `#1d76db` | Next.js, React, CSS, Cesium UI. |
| `backend` | `#5319e7` | NestJS, APIs, services, auth. |
| `ai` | `#bfdadc` | Future AI/ML features or recommendations. |
| `performance` | `#fbca04` | Bundle size, rendering, latency. |
| `testing` | `#0e8a16` | Unit, integration, e2e, CI tests. |
| `security` | `#ee0701` | Auth, authorization, uploads, abuse controls. |
| `hacktoberfest` | `#ff7518` | Curated October contribution tasks. |
| `needs reproduction` | `#d4c5f9` | Bug needs evidence or steps. |
| `blocked` | `#b60205` | Waiting on credentials, decision, or dependency. |

## Good First Issues

### 1. Fix README encoding and license wording

**Description**  
The previous README contained mojibake characters and said the project used private terms, while the repository includes GPL-3.0.

**Expected Solution**  
Keep the README ASCII-clean and ensure license references point to GPL-3.0.

**Acceptance Criteria**

- README renders without broken characters.
- License section links to `LICENSE`.
- No private-license language remains.

**Skills Required**  
Markdown, documentation

**Estimated Difficulty**  
Good First Issue

**Estimated Time**  
30 min

**Files Likely Affected**

- `README.md`
- `LICENSE`

### 2. Add screenshot placeholders and capture instructions

**Description**  
The README names screenshot placeholders, but contributors need a small guide for where screenshots belong and what viewports to capture.

**Expected Solution**  
Create `docs/screenshots/README.md` with desktop and mobile capture guidance.

**Acceptance Criteria**

- Guide lists required screenshots.
- Guide includes recommended viewport sizes.
- README screenshot paths match the guide.

**Skills Required**  
Markdown, frontend QA

**Estimated Difficulty**  
Good First Issue

**Estimated Time**  
45 min

**Files Likely Affected**

- `docs/screenshots/README.md`
- `README.md`

### 3. Document Windows PowerShell npm workaround

**Description**  
PowerShell can block `npm.ps1` with execution policy errors, while `npm.cmd` works.

**Expected Solution**  
Add a troubleshooting note to contributor docs.

**Acceptance Criteria**

- `CONTRIBUTING.md` includes the workaround.
- README mentions it near prerequisites.
- The note does not recommend disabling security globally.

**Skills Required**  
Markdown, Windows development

**Estimated Difficulty**  
Good First Issue

**Estimated Time**  
30 min

**Files Likely Affected**

- `README.md`
- `CONTRIBUTING.md`

### 4. Add a local uploads cleanup note

**Description**  
Local upload files can accumulate under `apps/api/public/uploads`.

**Expected Solution**  
Document that local uploads are development artifacts and should not be committed.

**Acceptance Criteria**

- Contributor docs mention local upload cleanup.
- `.gitignore` is checked and updated if needed.
- Existing committed sample files are not deleted without maintainer approval.

**Skills Required**  
Markdown, Git

**Estimated Difficulty**  
Good First Issue

**Estimated Time**  
30 min

**Files Likely Affected**

- `CONTRIBUTING.md`
- `.gitignore`
- `apps/api/public/uploads/`

### 5. Add empty state copy for search results

**Description**  
The search panel shows results and loading skeletons, but no clear empty state after a query returns nothing.

**Expected Solution**  
Show a concise empty message that keeps the exploration tone.

**Acceptance Criteria**

- Empty search result state appears after a completed search with zero results.
- Loading skeletons still appear while searching.
- The empty state is keyboard and screen-reader accessible.

**Skills Required**  
React, TypeScript, CSS

**Estimated Difficulty**  
Good First Issue

**Estimated Time**  
1 hour

**Files Likely Affected**

- `apps/web/src/app/page.tsx`
- `apps/web/src/app/globals.css`

### 6. Add accessible labels to icon-only controls

**Description**  
Some icon buttons rely on `title` or visual context.

**Expected Solution**  
Add explicit `aria-label` values to icon-only controls and verify no labels are duplicated incorrectly.

**Acceptance Criteria**

- Icon-only buttons have `aria-label`.
- Existing visible text buttons are unchanged.
- Build passes.

**Skills Required**  
React, accessibility

**Estimated Difficulty**  
Good First Issue

**Estimated Time**  
1 hour

**Files Likely Affected**

- `apps/web/src/app/page.tsx`
- `apps/web/src/components/MemoryCard.tsx`
- `apps/web/src/components/ProfilePanel.tsx`
- `apps/web/src/components/PostModal.tsx`

### 7. Add loading text for globe initialization

**Description**  
The globe container has a dark background while Cesium loads, but no explicit user-facing loading state.

**Expected Solution**  
Show a subtle loading indicator until Cesium initializes.

**Acceptance Criteria**

- Loading state is visible before Cesium is ready.
- Indicator disappears after successful initialization.
- Failure still logs a useful warning.

**Skills Required**  
React, TypeScript, Cesium basics

**Estimated Difficulty**  
Good First Issue

**Estimated Time**  
1 hour

**Files Likely Affected**

- `apps/web/src/components/globe/CesiumGlobe.tsx`
- `apps/web/src/app/globals.css`

### 8. Improve upload error messages

**Description**  
Upload failures show raw messages but do not always explain allowed file types and size limits.

**Expected Solution**  
Show friendly, specific upload error text in the publish modal.

**Acceptance Criteria**

- Unsupported file type explains accepted formats.
- Oversized files explain image and video limits.
- Error remains visible until the user retries or closes the modal.

**Skills Required**  
React, NestJS basics

**Estimated Difficulty**  
Good First Issue

**Estimated Time**  
1 hour

**Files Likely Affected**

- `apps/web/src/components/PostModal.tsx`
- `apps/api/src/posts/storage.service.ts`

### 9. Add contributor issue triage docs

**Description**  
New contributors need to understand labels, assignment, and expected PR size.

**Expected Solution**  
Add a short section to `CONTRIBUTING.md`.

**Acceptance Criteria**

- Labels are explained.
- First-time contributors know how to claim an issue.
- Maintainers have a simple review expectation.

**Skills Required**  
Markdown, open source process

**Estimated Difficulty**  
Good First Issue

**Estimated Time**  
45 min

**Files Likely Affected**

- `CONTRIBUTING.md`

### 10. Add a design-system quick reference to README

**Description**  
The design system lives in `docs/terraflow-design-system.md`, but README readers may miss it.

**Expected Solution**  
Link the design system from README and summarize the key UI principles.

**Acceptance Criteria**

- README links to the design system.
- Summary mentions globe-first, delayed login, and lightweight upload.
- No duplicate long design-system content is added.

**Skills Required**  
Markdown, product writing

**Estimated Difficulty**  
Good First Issue

**Estimated Time**  
30 min

**Files Likely Affected**

- `README.md`
- `docs/terraflow-design-system.md`

### 11. Add API route overview documentation

**Description**  
Contributors must inspect controllers to learn available API routes.

**Expected Solution**  
Create `docs/api.md` summarizing auth, posts, social, and upload endpoints.

**Acceptance Criteria**

- Endpoint list includes method, path, auth requirement, and purpose.
- Docs note that `NEXT_PUBLIC_API_URL` points to `/api/v1`.
- README links to the API overview.

**Skills Required**  
Markdown, NestJS basics

**Estimated Difficulty**  
Good First Issue

**Estimated Time**  
1.5 hours

**Files Likely Affected**

- `docs/api.md`
- `README.md`
- `apps/api/src/**/*.ts`

### 12. Add environment variable comments for public API URL

**Description**  
The web app uses `NEXT_PUBLIC_API_URL`, and uploads can use `API_PUBLIC_URL`, but `.env.example` does not clearly explain both.

**Expected Solution**  
Clarify the difference in `.env.example`.

**Acceptance Criteria**

- `.env.example` documents `NEXT_PUBLIC_API_URL`.
- `.env.example` documents `API_PUBLIC_URL`.
- README environment table stays consistent.

**Skills Required**  
Markdown, environment configuration

**Estimated Difficulty**  
Good First Issue

**Estimated Time**  
30 min

**Files Likely Affected**

- `.env.example`
- `README.md`

### 13. Add alt text guidance for memory media

**Description**  
Memory images render with generic alt text.

**Expected Solution**  
Use post title or location-derived alt text where available.

**Acceptance Criteria**

- Memory cards use descriptive image alt text.
- Upload preview alt text remains accurate.
- No decorative images are announced unnecessarily.

**Skills Required**  
React, accessibility

**Estimated Difficulty**  
Good First Issue

**Estimated Time**  
1 hour

**Files Likely Affected**

- `apps/web/src/components/MemoryCard.tsx`
- `apps/web/src/components/PostModal.tsx`

### 14. Add no-results state for profile memories

**Description**  
Profiles with no posts need a friendly empty state instead of appearing incomplete.

**Expected Solution**  
Show a concise empty state that encourages pinning the first memory.

**Acceptance Criteria**

- Empty state appears when the profile has zero posts.
- Existing profile stats remain visible.
- The copy does not require login if the profile is public.

**Skills Required**  
React, CSS

**Estimated Difficulty**  
Good First Issue

**Estimated Time**  
1 hour

**Files Likely Affected**

- `apps/web/src/components/ProfilePanel.tsx`
- `apps/web/src/app/globals.css`

### 15. Add manual QA checklist for globe homepage

**Description**  
UI changes need a consistent checklist for desktop and mobile globe behavior.

**Expected Solution**  
Create `docs/qa/globe-homepage.md`.

**Acceptance Criteria**

- Checklist covers desktop, mobile, search, upload gate, memory cards, and globe controls.
- Checklist includes expected local URLs.
- README or CONTRIBUTING links to it.

**Skills Required**  
Markdown, QA

**Estimated Difficulty**  
Good First Issue

**Estimated Time**  
1 hour

**Files Likely Affected**

- `docs/qa/globe-homepage.md`
- `CONTRIBUTING.md`

## Beginner Issues

### 16. Move inline auth modal styles into CSS classes

**Description**  
The auth modal includes several inline style blocks, which makes visual consistency harder for contributors to maintain.

**Expected Solution**  
Move repeated inline styles into named CSS classes that match the existing `tf-*` naming convention.

**Acceptance Criteria**

- Auth modal visual appearance remains unchanged.
- Reusable styles live in `globals.css`.
- Build passes.

**Skills Required**  
React, CSS, TypeScript

**Estimated Difficulty**  
Beginner

**Estimated Time**  
2 hours

**Files Likely Affected**

- `apps/web/src/app/page.tsx`
- `apps/web/src/app/globals.css`

### 17. Add contributor-friendly comments to environment example

**Description**  
`.env.example` is useful but could better explain which values are required for local-only development.

**Expected Solution**  
Group required, optional, OAuth, storage, and worker variables with short comments.

**Acceptance Criteria**

- Required local variables are clearly marked.
- Optional provider variables are clearly marked.
- README environment table remains consistent.

**Skills Required**  
Documentation, environment configuration

**Estimated Difficulty**  
Beginner

**Estimated Time**  
1 hour

**Files Likely Affected**

- `.env.example`
- `README.md`

### 18. Add graceful fallback when featured memory images fail

**Description**  
Featured demo memories use remote image URLs. If those URLs fail, cards and pins should still feel intentional.

**Expected Solution**  
Add fallback styling or placeholder handling for failed memory thumbnails.

**Acceptance Criteria**

- Broken image URLs do not create visually broken cards.
- Pin rendering still works when thumbnail creation fails.
- No console errors are introduced beyond existing caught warnings.

**Skills Required**  
React, browser image handling, CSS

**Estimated Difficulty**  
Beginner

**Estimated Time**  
2 hours

**Files Likely Affected**

- `apps/web/src/components/MemoryCard.tsx`
- `apps/web/src/components/globe/CesiumGlobe.tsx`
- `apps/web/src/app/globals.css`

### 19. Document the design review checklist in PR template

**Description**  
The PR template has product checks, but UI contributors would benefit from a short visual QA checklist.

**Expected Solution**  
Add concise desktop/mobile screenshot and accessibility prompts to the PR template.

**Acceptance Criteria**

- PR template asks for desktop and mobile screenshots when UI changes.
- PR template asks contributors to confirm no overlap or unreadable text.
- The template stays short.

**Skills Required**  
Markdown, UI QA

**Estimated Difficulty**  
Beginner

**Estimated Time**  
30 min

**Files Likely Affected**

- `.github/PULL_REQUEST_TEMPLATE.md`

### 20. Add route map to architecture docs

**Description**  
New contributors need a quick map from UI actions to API endpoints.

**Expected Solution**  
Add a table connecting upload, search, profile, auth, and explore flows to their files and endpoints.

**Acceptance Criteria**

- Table includes UI file, API route, and service file.
- README links to the new section or doc.
- No endpoint behavior is changed.

**Skills Required**  
Markdown, Next.js basics, NestJS basics

**Estimated Difficulty**  
Beginner

**Estimated Time**  
1.5 hours

**Files Likely Affected**

- `docs/architecture.md`
- `README.md`

## Intermediate Issues

### 21. Add root test and lint scripts

**Description**  
Test files exist, but the root package does not provide obvious `test`, `lint`, or `format` scripts.

**Expected Solution**  
Add standardized root scripts and workspace scripts with the needed dependencies/configuration.

**Acceptance Criteria**

- `npm run test` runs available tests.
- `npm run lint` gives actionable feedback.
- README and CONTRIBUTING list the commands.
- CI can call the same scripts.

**Skills Required**  
Node.js, TypeScript, Jest, ESLint

**Estimated Difficulty**  
Intermediate

**Estimated Time**  
3 hours

**Files Likely Affected**

- `package.json`
- `apps/api/package.json`
- `apps/web/package.json`
- config files as needed

### 22. Add GitHub Actions CI

**Description**  
The repository needs automated verification for pull requests.

**Expected Solution**  
Add a workflow that installs dependencies, generates Prisma client, builds packages, and runs tests/lint when available.

**Acceptance Criteria**

- CI runs on pull requests and pushes to main.
- CI uses the same commands documented for contributors.
- Workflow avoids requiring production secrets.

**Skills Required**  
GitHub Actions, Node.js, Prisma

**Estimated Difficulty**  
Intermediate

**Estimated Time**  
3 hours

**Files Likely Affected**

- `.github/workflows/ci.yml`
- `package.json`
- `README.md`

### 23. Add real API pagination metadata

**Description**  
Search returns `total: posts.length`, and explore returns basic `hasMore`; contributors need reliable pagination.

**Expected Solution**  
Return `page`, `limit`, `total`, and `hasMore` consistently from search and explore.

**Acceptance Criteria**

- Search performs a real count query.
- Explore and search response shapes are documented.
- Tests cover first page and later page behavior.

**Skills Required**  
NestJS, Prisma, TypeScript, testing

**Estimated Difficulty**  
Intermediate

**Estimated Time**  
4 hours

**Files Likely Affected**

- `apps/api/src/posts/posts.service.ts`
- `apps/api/src/posts/posts.controller.ts`
- `apps/api/src/posts/posts.spec.ts`
- `docs/api.md`

### 24. Verify optional JWT context safely

**Description**  
Public endpoints decode bearer tokens without verifying the JWT signature to derive optional user context.

**Expected Solution**  
Use Nest/JWT verification for optional auth context without throwing on anonymous requests.

**Acceptance Criteria**

- Invalid tokens do not authenticate a user.
- Anonymous requests still work.
- Public, friends, and private visibility behavior remains correct.
- Tests cover invalid, missing, and valid tokens.

**Skills Required**  
NestJS, JWT, security testing

**Estimated Difficulty**  
Intermediate

**Estimated Time**  
4 hours

**Files Likely Affected**

- `apps/api/src/posts/posts.controller.ts`
- `apps/api/src/auth/jwt.strategy.ts`
- `apps/api/src/posts/posts.spec.ts`

### 25. Add visibility rule integration tests

**Description**  
Privacy logic is central to TerraFlow but needs stronger regression coverage.

**Expected Solution**  
Add tests for public, friends-only, private, owner, follower, and anonymous scenarios.

**Acceptance Criteria**

- Tests cover `explore`, `searchPosts`, and `findById`.
- Unauthorized users cannot see private or friends-only posts.
- Owners can see their own non-public posts.

**Skills Required**  
Jest, Prisma mocking, NestJS

**Estimated Difficulty**  
Intermediate

**Estimated Time**  
4 hours

**Files Likely Affected**

- `apps/api/src/posts/posts.spec.ts`
- `apps/api/src/posts/posts.service.ts`

### 26. Add search integration with memory results on the globe

**Description**  
The UI searches Nominatim locations but does not expose memory search results from `/posts/search`.

**Expected Solution**  
Show location results and memory results in separate sections.

**Acceptance Criteria**

- Users can search public memory titles/descriptions.
- Selecting a memory flies to the pin and opens its card.
- Empty and loading states are handled.

**Skills Required**  
React, TypeScript, API integration

**Estimated Difficulty**  
Intermediate

**Estimated Time**  
5 hours

**Files Likely Affected**

- `apps/web/src/app/page.tsx`
- `apps/web/src/components/MemoryCard.tsx`
- `apps/api/src/posts/posts.service.ts`

### 27. Add upload progress and retry state

**Description**  
The upload modal shows uploading text, but no retry affordance or progress detail.

**Expected Solution**  
Add clear upload states: idle, uploading, uploaded, failed, retrying.

**Acceptance Criteria**

- Failed uploads can be retried without closing the modal.
- Submit is disabled while upload is incomplete or failed.
- Accessible status text announces progress.

**Skills Required**  
React, TypeScript, accessibility

**Estimated Difficulty**  
Intermediate

**Estimated Time**  
4 hours

**Files Likely Affected**

- `apps/web/src/components/PostModal.tsx`
- `apps/web/src/app/globals.css`

### 28. Add public profile page

**Description**  
The API supports public profile lookup by username, but the web app has no dedicated public profile route.

**Expected Solution**  
Create a route that shows public profile details and public memories while preserving the globe-first feel.

**Acceptance Criteria**

- `/u/[username]` loads public profile data.
- Missing users show a helpful not-found state.
- Public memories can fly the globe to their coordinates.
- Private and friends-only posts are not shown.

**Skills Required**  
Next.js, React, TypeScript

**Estimated Difficulty**  
Intermediate

**Estimated Time**  
6 hours

**Files Likely Affected**

- `apps/web/src/app/u/[username]/page.tsx`
- `apps/web/src/components/ProfilePanel.tsx`
- `apps/api/src/auth/auth.controller.ts`

### 29. Add demo seed data workflow

**Description**  
The app has hardcoded featured demo memories, but contributors need database-backed demo content.

**Expected Solution**  
Add a Prisma seed script with a few public memory posts and media URLs.

**Acceptance Criteria**

- `npm run db:seed` creates demo users and public posts.
- Seed is idempotent or documents reset behavior.
- README explains how to load demo data.

**Skills Required**  
Prisma, TypeScript, Node.js

**Estimated Difficulty**  
Intermediate

**Estimated Time**  
4 hours

**Files Likely Affected**

- `packages/database/prisma/seed.ts`
- `packages/database/package.json`
- `README.md`

### 30. Add frontend component smoke tests

**Description**  
Core UI components are untested.

**Expected Solution**  
Add smoke tests for upload modal, memory card, and profile panel.

**Acceptance Criteria**

- Tests render components without browser-only crashes.
- Tests cover key empty/error states.
- Test command is documented.

**Skills Required**  
React Testing Library, Jest or Vitest, TypeScript

**Estimated Difficulty**  
Intermediate

**Estimated Time**  
5 hours

**Files Likely Affected**

- `apps/web/src/components/*.test.tsx`
- `apps/web/package.json`
- test config files

## Advanced Issues

### 31. Replace placeholder EXIF GPS parsing with real extraction

**Description**  
`extractExifGPS` currently simulates coordinates when image width is over 2000px instead of parsing GPS metadata.

**Expected Solution**  
Use a reliable EXIF parser, normalize GPS coordinates, and return null when GPS is absent.

**Acceptance Criteria**

- Real GPS EXIF latitude/longitude is parsed correctly.
- Images without GPS return null.
- Malformed EXIF does not crash uploads.
- Tests use fixture images or mocked metadata.

**Skills Required**  
Node.js, image metadata, NestJS, testing

**Estimated Difficulty**  
Advanced

**Estimated Time**  
1 day

**Files Likely Affected**

- `apps/api/src/posts/storage.service.ts`
- `apps/api/src/posts/posts.spec.ts`
- test fixtures

### 32. Add Cesium performance budget and lazy asset strategy

**Description**  
Cesium assets are copied into `public/cesium`, and route bundles need explicit performance targets.

**Expected Solution**  
Measure load behavior, document budgets, and optimize loading without breaking the globe.

**Acceptance Criteria**

- Performance docs define target route load and globe readiness metrics.
- Cesium loading remains lazy and verified on desktop/mobile.
- Build output and bundle impact are recorded before and after.

**Skills Required**  
Next.js, Cesium, performance profiling

**Estimated Difficulty**  
Advanced

**Estimated Time**  
1-2 days

**Files Likely Affected**

- `apps/web/src/components/globe/CesiumGlobe.tsx`
- `apps/web/copy-cesium-assets.js`
- `docs/performance.md`

### 33. Add moderation and report review workflow

**Description**  
The Prisma schema has `Report`, `isModerated`, and user roles, but no complete moderation workflow.

**Expected Solution**  
Create backend endpoints and a minimal maintainer UI for reviewing reports.

**Acceptance Criteria**

- Authenticated users can report posts with reasons.
- Moderators/admins can list and resolve reports.
- Non-moderators cannot access moderation endpoints.
- Tests cover authorization and state transitions.

**Skills Required**  
NestJS, Prisma, authorization, React

**Estimated Difficulty**  
Advanced

**Estimated Time**  
2 days

**Files Likely Affected**

- `apps/api/src/social/`
- `apps/api/src/posts/`
- `packages/database/prisma/schema.prisma`
- `apps/web/src/components/`

### 34. Implement reliable travel stats geocoding

**Description**  
Travel stats currently infer city/country from latitude thresholds, which is not production-ready.

**Expected Solution**  
Use reverse geocoding or a local geo dataset to update countries and cities accurately.

**Acceptance Criteria**

- Stats use real city/country data.
- External API failures do not block post creation.
- Results are cached or rate-limited.
- Tests cover known coordinates and failure paths.

**Skills Required**  
Node.js, geocoding, Prisma, background jobs

**Estimated Difficulty**  
Advanced

**Estimated Time**  
2 days

**Files Likely Affected**

- `apps/api/src/posts/posts.service.ts`
- `apps/api/src/worker/`
- `packages/database/prisma/schema.prisma`

### 35. Add end-to-end browser tests for first-time exploration

**Description**  
The core user journey should be protected: guest opens the globe, searches a place, views a memory, and is asked to sign in only when uploading.

**Expected Solution**  
Add Playwright tests for the exploration-first journey.

**Acceptance Criteria**

- Test starts web and API locally or uses documented commands.
- Guest exploration works without login.
- Upload action opens auth gate for guests.
- Authenticated path can publish a memory using seeded data or mocked API.

**Skills Required**  
Playwright, Next.js, NestJS, test orchestration

**Estimated Difficulty**  
Advanced

**Estimated Time**  
2-3 days

**Files Likely Affected**

- `e2e/`
- `package.json`
- `apps/web/src/app/page.tsx`
- `.github/workflows/ci.yml`

## Contributor Experience Improvements

- Add `npm run test`, `npm run lint`, and `npm run format` at the root.
- Add CI before inviting broad contributor traffic.
- Add `docs/api.md`, `docs/qa/globe-homepage.md`, and screenshot capture instructions.
- Add a seed-data workflow so contributors can see real pins without creating accounts manually.
- Add issue labels and keep beginner issues under 1-2 hours.
- Add screenshots or short recordings to every UI issue.
- Document which features are production-ready, partial, or planned.
- Add a project board with columns: Triage, Ready, In Progress, Review, Done.

## Hacktoberfest and First-Time Contributor Actions

- Apply `hacktoberfest`, `good first issue`, and `help wanted` only to issues with acceptance criteria and likely files.
- Pin a "Start here" issue that links to setup, design principles, and the easiest issues.
- Keep at least 15 unassigned good first issues available through October.
- Add a 10-minute local setup video or GIF to the README.
- Create a Discord or GitHub Discussions welcome thread.
- Promise review expectations, for example "maintainers review beginner PRs within 72 hours."
- Avoid assigning large architectural work to first-time contributors.
- Add screenshots to UI issues so contributors know the target state.
- Create a `first-time-contributor` project view filtered to docs, UI copy, accessibility, and tests.
- Celebrate merged contributor PRs in release notes.
