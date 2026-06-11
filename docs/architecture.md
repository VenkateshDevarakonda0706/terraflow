# TerraFlow Architecture & Route Mappings

This document connects frontend UI actions and components with their respective REST API routes, NestJS controllers, and backend services.

---

## Architecture Overview

TerraFlow is structured as a modular spatial application utilizing the following components:

* **Monorepo Structure**: Managed via `npm workspaces` separating applications (`apps/`) and package libraries (`packages/`).
* **Next.js Frontend**: The client application (`apps/web`) built on Next.js, React, and Tailwind CSS.
* **NestJS Backend**: The server application (`apps/api`) built on NestJS using controller-service structures and Passport JWT authorization.
* **Prisma & PostgreSQL**: Database schema and ORM client (`packages/database`) executing SQL queries against a PostgreSQL database.
* **Cesium Globe**: Interactive 3D maps and spatial rendering using `@cesium/engine` and `@cesium/widgets`.
* **H3 Spatial Indexing**: Hierarchical hexagonal spatial index computation calculated on coordinates using `h3-js`.

---

## Flow Mapping Table

| Flow | UI Component / Page | REST API Route | Backend Controller | Backend Service |
| :--- | :--- | :--- | :--- | :--- |
| **Upload** | `apps/web/src/components/PostModal.tsx`<br>`apps/web/src/app/page.tsx` | **Step 1**: `POST /api/v1/posts/upload` (Media upload)<br>**Step 2**: `POST /api/v1/posts` (Post creation) | `PostsController`<br>(`apps/api/src/posts/posts.controller.ts`) | `StorageService` (Upload and EXIF extraction)<br>`PostsService` (Database persistence)<br>(`apps/api/src/posts/posts.service.ts`) |
| **Search** | `apps/web/src/app/page.tsx` | `GET /api/v1/posts/search`<br>_External Nominatim API_ | `PostsController`<br>(`apps/api/src/posts/posts.controller.ts`) | `PostsService`<br>(`apps/api/src/posts/posts.service.ts`) |
| **Profile** | `apps/web/src/components/ProfilePanel.tsx`<br>`apps/web/src/components/PublicProfile.tsx`<br>`apps/web/src/app/u/[username]/page.tsx` | `GET /api/v1/auth/users/:username`<br>`PATCH /api/v1/auth/profile`<br>`POST /api/v1/posts/upload` | `AuthController`<br>(`apps/api/src/auth/auth.controller.ts`) | `AuthService`<br>(`apps/api/src/auth/auth.service.ts`) |
| **Authentication** | `apps/web/src/app/page.tsx` | `POST /api/v1/auth/register`<br>`POST /api/v1/auth/login`<br>`GET /api/v1/auth/google`<br>`GET /api/v1/auth/google/callback`<br>`POST /api/v1/auth/logout`<br>`GET /api/v1/auth/me` | `AuthController`<br>(`apps/api/src/auth/auth.controller.ts`) | `AuthService`<br>(`apps/api/src/auth/auth.service.ts`) |
| **Explore** | `apps/web/src/app/page.tsx`<br>`apps/web/src/components/globe/CesiumGlobe.tsx` | `GET /api/v1/posts/explore` | `PostsController`<br>(`apps/api/src/posts/posts.controller.ts`) | `PostsService`<br>(`apps/api/src/posts/posts.service.ts`) |

---

## Flow Breakdown & Explanations

### 1. Upload Flow
* **Overview**: Handles capturing a user memory and publishing it onto the 3D globe using a two-step process:
  * **Step 1: Media Upload**: Selecting a media file in `apps/web/src/components/PostModal.tsx` triggers a `POST` request to `POST /api/v1/posts/upload` to store the asset and retrieve any geocoding EXIF coordinates.
  * **Step 2: Post Creation**: Form metadata (title, description, coordinates, visibility) is submitted via a `POST` request to `POST /api/v1/posts`, which registers the geolocated memory.
* **Frontend Process**: Selecting the Upload option from navigation triggers `apps/web/src/components/PostModal.tsx` (via the main layout in `apps/web/src/app/page.tsx`). File constraints check the file formats (MIME type limits, and maximum file size of 10MB for images and 50MB for video). It is uploaded as `FormData` during Step 1. In Step 2, a JSON payload is submitted containing the title, description, and visibility parameters.
* **Backend Process**:
  * `PostsController.uploadMedia` handles Step 1, calling `StorageService.uploadFile` to upload the raw stream, and `StorageService.extractExifGPS` to attempt GPS coordinate extraction from raw images.
  - `PostsController.create` handles Step 2. `PostsService.createPost` creates the post via Prisma. It maps lat/lng into an H3 spatial index (`latLngToCell`) at resolution 8. Finally, `PostsService` triggers an asynchronous reverse-geocoding process (`asyncUpdateTravelStats`) using the OpenStreetMap Nominatim reverse API to query city/country records and update travel stats.

### 2. Search Flow
* **Overview**: Resolves text inputs into physical positions on Earth and queries relevant memory posts.
* **Frontend Process**: Changing the search text in the search pane of `apps/web/src/app/page.tsx` starts a debounced (360ms) function.
* **Backend Process**:
  - The frontend queries OpenStreetMap's Nominatim search endpoint (`https://nominatim.openstreetmap.org/search?q={query}&format=json&limit=5`) to geocode place names, allowing camera flying on the globe.
  - The frontend concurrently calls `/api/v1/posts/search?q={query}`. `PostsController.search` accepts the query string and delegates to `PostsService.searchPosts`, executing case-insensitive database matching via Prisma against the title and description fields, filtered to respect visibility permissions.

### 3. Profile Flow
* **Overview**: Displays traveler stats (countries, cities, distance, badges) and lists their memories, permitting detail updates.
* **Frontend Process**: 
  - Navigating to `apps/web/src/app/u/[username]/page.tsx` or opening the main `apps/web/src/components/ProfilePanel.tsx` requests public data.
  - Clicking "Edit Profile" edits name and bio. Replacing an avatar picture triggers `POST /api/v1/posts/upload`, storing the media and updating the profile details with `PATCH /api/v1/auth/profile`.
* **Backend Process**:
  - `AuthController.getPublicProfile` retrieves the user record by username, aggregating public memories and travel statistics.
  - `AuthController.updateProfile` patches user records in PostgreSQL.

### 4. Authentication Flow
* **Overview**: Handles local registration/login and social Google Sign-In.
* **Frontend Process**: Handled inside `apps/web/src/app/page.tsx`. Active tokens (`tf_token`) are verified on launch. Clicking options triggers credential checks or Google OAuth redirects.
* **Backend Process**:
  - Local authentication maps username and password credentials using `/api/v1/auth/register` and `/api/v1/auth/login`. On login, `setAuthCookies` assigns `accessToken` and `refreshToken` headers.
  - Google OAuth initiates at `GET /api/v1/auth/google`. Callback landing at `GET /api/v1/auth/google/callback` attaches cookies and redirects user to frontend with tokens.
  - In-memory validation uses `/api/v1/auth/me` to retrieve current profile parameters, while logout clears cookie state.

### 5. Explore Flow
* **Overview**: Provides map coordinates query mechanisms utilizing client globe bounding boxes and zoom thresholds to yield posts or spatial H3 hexagonal clusters.
* **Frontend Process**: Changing view bounds or zooming the Cesium globe triggers a fetch call to `/api/v1/posts/explore?minLat={minLat}&maxLat={maxLat}&minLng={minLng}&maxLng={maxLng}&zoom={zoomLevel}`.
* **Backend Process**:
  * `PostsController.explore` extracts query coordinate bounds parameters.
  * `PostsService.explore` filters posts within spatial boundaries, accounting for the requester's visibility permissions (public, friends-only, or private).
  * **Clustering Threshold**: Hexagonal aggregation is triggered at zoom levels `<= 9`. For zoom levels `> 9`, individual pins are returned.
  * **Clustering Resolutions**: H3 indexing resolutions are mapped dynamically:
    * Zoom `≤ 3`: Resolution `2` (Country/Continent clusters)
    * Zoom `≤ 5`: Resolution `4` (Regional clusters)
    * Zoom `≤ 8`: Resolution `6` (Metro clusters)
    * Zoom `9`: Resolution `8` (Neighborhood details)
  * **Pagination and Limits**: The query caps database retrievals with a default limit of 50 records per page (`limit = 50`), computed dynamically as `(page - 1) * limit` based on the query page parameter.
