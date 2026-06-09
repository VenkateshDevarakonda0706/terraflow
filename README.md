# TerraFlow

TerraFlow is the Memory Layer of Earth: a premium, exploration-first WebGL globe for discovering, mapping, and sharing physical memories. The product centers on a full-screen Cesium globe, public discovery before login, and lightweight publishing when a traveler is ready to pin a story to a place.

## Features

- Full-screen interactive 3D globe powered by Cesium.
- Guest exploration with featured public memories and search-driven globe navigation.
- Email and Google OAuth authentication for publishing and profile features.
- Geolocated media uploads with local filesystem fallback and optional Google Cloud Storage.
- Public, friends-only, and private memory visibility controls.
- Spatial explore API with H3 clustering for globe-scale discovery.
- Profile, save, follow, social, notification, and messaging data models ready for expansion.

## Tech Stack

- Monorepo: npm workspaces
- Web: Next.js, React, TypeScript, Tailwind CSS, Cesium
- API: NestJS, Passport, JWT, Socket.IO, BullMQ
- Database: PostgreSQL, Prisma
- Storage: local uploads or Google Cloud Storage

## Architecture

```text
apps/
  web/              Next.js app, Cesium globe, upload and profile UI
  api/              NestJS API, auth, posts, social graph, gateway, worker
packages/
  database/         Prisma schema and generated database client entrypoint
  shared/           Shared TypeScript types and constants
docs/               Product and contributor documentation
skills/             TerraFlow project review and QA instructions
```

The user journey should keep Earth as the primary surface. Guests can explore first; account creation appears only when a user uploads, saves, follows, or manages a profile.

## Design System

For styling guidelines, typography, color tokens, and core components, see the [TerraFlow Design System](docs/terraflow-design-system.md).

All contributions should align with these core user experience principles:

- **Globe-First Experience**: Keep the 3D globe central; controls should support exploration without competing for attention.
- **Exploration Before Login**: Allow users to explore public content before authentication. Require login only when necessary for interaction or creation.
- **Lightweight Uploads**: Keep publishing workflows fast and simple with minimal friction.

## Prerequisites

- Node.js 18 or newer
- npm 9 or newer
- PostgreSQL 14 or newer
- Optional: Redis for worker-backed flows
- Optional: Google Cloud Storage credentials for production media storage

On Windows PowerShell, use `npm.cmd` (for example, `npm.cmd install` or `npm.cmd run build`) if plain `npm` is blocked by script execution policy. This workaround avoids the need to change PowerShell execution policies globally.

## Installation

```bash
git clone https://github.com/<your-org>/terraflow.git
cd terraflow
npm install
cp .env.example .env
```

Edit `.env` with local values. At minimum, set `DATABASE_URL`, `JWT_SECRET`, and `JWT_REFRESH_SECRET`.

## Environment Variables

| Variable                         | Required | Description                                                       |
| -------------------------------- | -------- | ----------------------------------------------------------------- |
| `PORT`                           | Yes      | API port, usually `4000`.                                         |
| `CLIENT_URL`                     | Yes      | Web origin, usually `http://localhost:3000`.                      |
| `DATABASE_URL`                   | Yes      | PostgreSQL connection string for Prisma.                          |
| `JWT_SECRET`                     | Yes      | Access token signing secret. Use a long random value.             |
| `JWT_REFRESH_SECRET`             | Yes      | Refresh token signing secret. Use a different long random value.  |
| `NEXT_PUBLIC_API_URL`            | No       | Web app API base URL. Defaults to `http://localhost:4000/api/v1`. |
| `GOOGLE_CLIENT_ID`               | No       | Google OAuth client ID.                                           |
| `GOOGLE_CLIENT_SECRET`           | No       | Google OAuth client secret.                                       |
| `GOOGLE_CALLBACK_URL`            | No       | Google OAuth callback URL.                                        |
| `GOOGLE_APPLICATION_CREDENTIALS` | No       | Path to a GCS service account JSON file.                          |
| `GCS_BUCKET_NAME`                | No       | Google Cloud Storage bucket name.                                 |
| `API_PUBLIC_URL`                 | No       | Public API origin used for local upload URLs.                     |
| `REDIS_URL`                      | No       | Redis connection string for worker features.                      |

## Database Setup

```bash
npm run db:generate
npm run db:push
```

### Loading Demo Data

To populate your local database with public demo memory posts and users, run:

```bash
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
```

The seed script will populate the database with the following resources:

- **Demo Users**:
  - `maya` (`maya@example.com`): Bio: Explorer and photographer.
  - `ren` (`ren@example.com`): Bio: Traveler and coffee enthusiast.
  - `amina` (`amina@example.com`): Bio: Seeking sunrises from above.
    _Note: All demo users are seeded with the default password `password123`._
- **Demo Memories**:
  - Yosemite (`Morning light over the valley` by `maya`)
  - Kyoto (`Rain on the old stone path` by `ren`)
  - Cappadocia (`Balloons before breakfast` by `amina`)

The seed script is completely idempotent and can be run repeatedly; it will clean up and recreate only the targeted demo records while leaving other developer-created data intact.

## Local Development

Run the API and web app in separate terminals:

```bash
npm run dev:api
npm run dev:web
```

Open `http://localhost:3000`.

The API runs at `http://localhost:4000` by default. Uploaded local files are served from `http://localhost:4000/uploads`.

## Verification & Code Quality

The repository provides standard root-level scripts to verify changes across the monorepo:

- **`npm run build`**: Compiles all workspaces and builds production assets.
- **`npm run test`**: Runs unit and integration tests. This delegates to `npm run test --workspaces --if-present` to execute test suites in current workspaces and will automatically include future workspace tests as they are added.
- **`npm run lint`**: Analyzes code quality using ESLint.
- **`npm run format`**: Automatically formats source code using Prettier.
- **`npm run format:check`**: Validates code formatting style rules (used in CI pipelines).

## Contributing

Start with [CONTRIBUTING.md](./CONTRIBUTING.md), then review [docs/OPEN_SOURCE_ISSUES.md](./docs/OPEN_SOURCE_ISSUES.md) for ready-to-publish issues. Good first issues are scoped for first-time contributors and should include clear acceptance criteria.

Before opening a pull request:

- Keep the globe central and preserve exploration before login.
- Add or update tests for behavior changes when practical.
- Run `npm run test`, `npm run lint`, `npm run format:check`, and `npm run build`.
- Include screenshots for UI changes.
- Avoid unrelated refactors in the same PR.

## Roadmap

- Add root lint and test commands for contributor confidence.
- Replace placeholder EXIF geocoding with real GPS parsing.
- Add API pagination metadata and validation coverage.
- Improve mobile globe and upload accessibility.
- Add public demo seed data and screenshots.
- Add CI for build, tests, formatting, and type checks.
- Expand moderation, reporting, and abuse prevention flows.
- Add performance budgets for Cesium assets and route bundles.

## License

TerraFlow is licensed under the GNU General Public License v3.0. See [LICENSE](./LICENSE).
