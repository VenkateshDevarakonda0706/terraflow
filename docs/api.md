# TerraFlow API Documentation

This document provides a comprehensive overview of the REST API endpoints exposed by the TerraFlow backend application (`apps/api`).

---

## Base URL

By default, the backend API server runs on port `4000`. 
The Next.js client-side application communicates with the API using the base URL configured by the environment variable `NEXT_PUBLIC_API_URL`, which defaults to:

```text
http://localhost:4000/api/v1
```

All route paths documented below are relative to this base URL.

---

## Pagination Fields

All paginated endpoints return a consistent set of pagination metadata in their responses:

| Field | Type | Description |
| :--- | :--- | :--- |
| `total` | number | Total number of matching records (from a `COUNT` query) |
| `page` | number | Current page number (1-indexed) |
| `limit` | number | Maximum number of records returned per page |
| `hasMore` | boolean | `true` if there are additional pages beyond the current one |

**`hasMore` is computed as:** `skip + limit < total` where `skip = (page - 1) * limit`.

---

## Authentication

TerraFlow uses JWT/cookie-based session persistence.

- **Protected Routes**: Routes marked as requiring authentication verify the authenticated JWT session and cookies (`accessToken` and `refreshToken`). If valid credentials are not found, these endpoints return `401 Unauthorized`.
- **Optional Authentication**: Some routes dynamically resolve user context if present (using `OptionalJwtAuthGuard`) to apply visibility controls (e.g., public vs. friends-only memories) but allow anonymous access.
- **Moderation Routes**: Restrict access to users with authorized privileges. Access requires a valid JWT session and a user account containing either the `ADMIN` or `MODERATOR` role.

---

## Endpoint Reference

### 1. Authentication

Endpoints mapping to `/auth` handle user creation, session authentication, OAuth redirects, and profile details.

| Method | Path | Auth Required | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | No | Register a new user account using email, username, name, and password. |
| `POST` | `/auth/login` | No | Authenticate with an email or username and password. Sets HTTP-only `accessToken` and `refreshToken` cookies. |
| `GET` | `/auth/google` | No | Initiates the Google OAuth 2.0 redirection flow. |
| `GET` | `/auth/google/callback` | No | Callback endpoint for Google OAuth to validate user profiles, set session cookies, and redirect to the frontend. |
| `POST` | `/auth/logout` | No | Clears the `accessToken` and `refreshToken` HTTP-only cookies. |
| `PATCH` | `/auth/profile` | Yes (JWT) | Updates the authenticated user's profile metadata (`name`, `bio`, `profilePic`). |
| `GET` | `/auth/users/:username` | No | Retrieves public user profile details for a given username. |
| `GET` | `/auth/me` | Yes (JWT) | Retrieves the profile of the current authenticated user. |
| `GET` | `/auth/apple` | No | Disabled mock endpoint returning `503 Service Unavailable`. |
| `POST` | `/auth/apple/callback` | No | Disabled mock endpoint redirecting to the client application with `error=apple_disabled`. |

### 2. Uploads

Endpoints mapping to `/posts` handling media binary uploads.

| Method | Path | Auth Required | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `/posts/upload` | Yes (JWT) | Uploads a media file (JPEG, PNG, WEBP, MP4) as `multipart/form-data`. Extracts EXIF GPS data if available and returns the asset URL. |

### 3. Posts

Endpoints mapping to `/posts` handling spatial memories and their lifecycles.

| Method | Path | Auth Required | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `/posts` | Yes (JWT) | Creates a new travel memory/post containing title, description, category, coordinates, privacy, tags, and media URLs. |
| `GET` | `/posts/search` | Optional | Searches memories by text query (`q`), tag (`tag`), and page (`page`), respecting visibility rules. |
| `GET` | `/posts/explore` | Optional | Queries memories in a coordinate bounding box (`minLat`, `maxLat`, `minLng`, `maxLng`, `zoom`, `category`, `page`) utilizing spatial H3 clustering for globe-scale discovery. |
| `GET` | `/posts/timeline` | Optional | Retrieves memories nearby a location (`lat`, `lng`) within a given `radius` (in kilometers, defaults to 5). |
| `GET` | `/posts/:id` | Optional | Retrieves a single memory post by its ID, respecting visibility rules. |
| `DELETE` | `/posts/:id` | Yes (JWT) | Deletes a memory post by ID. Restricted to the owner of the post. |
| `POST` | `/posts/:id/report` | Yes (JWT) | Reports a post for moderation review with a specified `reason`. |

#### GET /posts/timeline Query Parameters

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `lat` | number | **Yes** | Latitude of center coordinate. |
| `lng` | number | **Yes** | Longitude of center coordinate. |
| `radius` | number | No | Search radius in kilometers (defaults to `5`). |

**Response**: Returns an array of timeline groups categorized by year:

```json
[
  {
    "year": "2026",
    "count": 1,
    "posts": [
      {
        "id": "post-uuid",
        "title": "Kyoto Path",
        "description": "Rain on the old stone path",
        "latitude": 35.0116,
        "longitude": 135.7681,
        "createdAt": "2026-06-11T12:00:00.000Z",
        "media": []
      }
    ]
  }
]
```

### 4. Social Graph

Endpoints mapping to `/social` managing comments, likes, saves, and following states.

| Method | Path | Auth Required | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `/social/follow/:userId` | Yes (JWT) | Follows or unfollows a target user (toggles follow state). |
| `POST` | `/social/like/:postId` | Yes (JWT) | Likes or unlikes a post (toggles like state). |
| `POST` | `/social/save/:postId` | Yes (JWT) | Saves or unsaves a post to the user's bookmarks (toggles save state). |
| `POST` | `/social/comment/:postId` | Yes (JWT) | Adds a comment with text `content` to a specific memory post. |
| `GET` | `/social/comment/:postId` | No | Retrieves all comments for a post. |

### 5. Moderation

Endpoints mapping to `/moderation` allowing moderators and administrators to triage reports.

| Method | Path | Auth Required | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/moderation/reports` | Yes (JWT + Role) | Retrieves a list of reports. Requires the `ADMIN` or `MODERATOR` role. Query parameters: `status`, `page`, `limit`. |
| `PATCH` | `/moderation/reports/:id` | Yes (JWT + Role) | Updates the status of a report. Requires the `ADMIN` or `MODERATOR` role. Body: `{ status }`. |
