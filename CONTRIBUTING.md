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

On Windows PowerShell, use `npm.cmd` if `npm` is blocked by execution policy:

```bash
npm.cmd run build
```

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

## Pull Request Checklist

- [ ] The PR has a clear title and short summary.
- [ ] The change is scoped to one issue or one related set of files.
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

At minimum, run:

```bash
npm run build
```

If you add tests, include the exact command in the PR description. The repository currently needs a standardized root test command, so issue-specific verification notes are welcome.

## Reporting Security Issues

Do not open public issues for vulnerabilities. Email or privately contact the maintainers with:

- Affected area
- Reproduction steps
- Impact
- Suggested fix, if known

## Maintainer Response Expectations

Maintainers should review beginner PRs with actionable feedback, explain requested changes, and avoid expanding the scope after the PR is opened unless a correctness or safety issue requires it.
