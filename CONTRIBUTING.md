# Contributing to TerraFlow

Thanks for helping build TerraFlow, the Memory Layer of Earth. This project values small, clear, evidence-backed contributions that keep the globe central and make exploration feel effortless.

## Product Principles

- The globe is the homepage and the primary product surface.
- Exploration comes before login.
- Uploading should feel lightweight and fast.
- Avoid dashboard-style or SaaS-style UI unless it is truly necessary.
- Prefer stable root-cause fixes over cosmetic patches.
- Verify behavior before claiming a feature works.

## Development Setup

```bash
npm install
cp .env.example .env
npm run db:generate
npm run db:push
npm run dev:api
npm run dev:web
```

On Windows PowerShell, use `npm.cmd` if standard `npm` commands are blocked by execution policy (for example, `npm.cmd install` or `npm.cmd run build`). This workaround avoids changing PowerShell execution policies globally:

```bash
npm.cmd install
npm.cmd run build
```

## Local Upload Files

When running the API locally, uploaded files may be created under `apps/api/public/uploads/`.

These files are development artifacts and should not be committed to Git. The repository's `.gitignore` is configured to ignore newly generated upload files.

If you want to remove local upload artifacts, you can safely delete untracked files in the uploads directory:

```bash
git clean -fdX apps/api/public/uploads
```

Do not remove or modify any tracked files in this directory unless requested by a maintainer.

## Branch Naming

Use short, descriptive branch names:

- `fix/upload-error-message`
- `docs/setup-guide`
- `feat/search-empty-state`
- `test/posts-visibility`

## Choosing an Issue

Good first issues should be small and self-contained. Read the issue, comment that you would like to work on it, and wait for maintainer confirmation if someone else is already assigned.

Recommended first contributions:

- Documentation cleanup
- Small accessibility improvements
- Empty states and loading states
- Focused tests around existing services
- Minor UI polish with screenshots

## Issue Triage and Claiming Work

Use labels to find work that matches your experience and the area you want to
improve:

- `good first issue` and `beginner` for small, self-contained starter tasks
- `help wanted` when maintainers are actively inviting outside help
- `documentation`, `frontend`, `backend`, `testing`, `ui/ux`, `performance`,
  and `security` to filter by project area
- `blocked` and `needs reproduction` to spot issues that may need maintainer
  follow-up before code changes are useful

Before you start coding, leave a comment on the issue so maintainers and other
contributors know you plan to work on it. If the issue is already assigned or a
recent contributor comment shows someone is actively working on it, wait for a
maintainer response before opening a pull request.

Keep first pull requests tightly scoped. One issue, one focused change, and one
clear verification path are easier to review and merge.

## Pull Request Checklist

- [ ] The PR has a clear title and short summary.
- [ ] `npm run test` passes.
- [ ] `npm run lint` passes.
- [ ] `npm run format:check` passes.
- [ ] `npm run build` passes.
- [ ] UI changes include before/after screenshots or a short screen recording.
- [ ] API behavior changes include tests or a clear manual verification note.
- [ ] Documentation is updated when setup, behavior, or environment variables change.
- [ ] No secrets, credentials, generated local uploads, or unrelated files are committed.

## Code Style

- Use TypeScript for application code.
- Follow the existing Next.js and NestJS patterns.
- Keep components focused and avoid large unrelated refactors.
- Prefer clear names over comments. Add comments only when they explain non-obvious behavior.
- Keep user-facing copy concise and aligned with exploration and memory.

## Testing and Verification

Before opening a pull request, run:

```bash
npm run test
npm run lint
npm run format:check
npm run build
```

Run `npm run format` to automatically format files using Prettier before committing.

## Reporting Security Issues

Do not open public issues for vulnerabilities. Email or privately contact the maintainers with:

- Affected area
- Reproduction steps
- Impact
- Suggested fix, if known

## Maintainer Response Expectations

Maintainers should review beginner PRs with actionable feedback, explain requested changes, and avoid expanding the scope after the PR is opened unless a correctness or safety issue requires it.

When triaging beginner-friendly issues, maintainers should confirm whether an
issue is still available, point contributors to the right labels or files when
needed, and keep review requests specific enough that a new contributor can act
on them without guessing.
