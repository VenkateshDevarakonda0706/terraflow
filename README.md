# TerraFlow — The Memory Layer of Earth 🌍

TerraFlow is a premium, consumer-focused WebGL 3D globe application designed for mapping, exploring, and sharing physical memories across the globe. By embedding traveler memories onto a fully interactive virtual Earth, TerraFlow transforms geolocated discoveries into a beautiful, immersive journey.

---

## 🚀 Core Features

* **Interactive WebGL 3D Globe**: Rendered via Cesium, utilizing real-time geographic coordinates, responsive custom billboard pins, and fast fly-to viewport orbits.
* **Persistent Session Authentication**: Seamless email register/login and Google OAuth integrations. Auth sessions persist across refreshes using secure JWT local storage.
* **Geolocated Media Uploads**: Fast, multipart file uploading directly to local/cloud storage, parsing location metadata dynamically.
* **Reverse Geocoding**: Integrated with OpenStreetMap Nominatim for free forward/reverse location tagging, converting click coordinates to actual place names.
* **Granular Privacy & Visibility shields**: Support for `PUBLIC` (visible to everyone), `FRIENDS` (visible to followers), and `PRIVATE` (only you) memories.
* **Traveler Dashboard & Grid**: Floating high-contrast HUD showing real-time statistics like countries visited, cities visited, streak count, and km traveled.

---

## 📂 Architecture

TerraFlow is built as a lightweight TypeScript monorepo structured for optimal workspace scalability:

```
├── apps/
│   ├── web/          # Next.js 15 Front-End (Cesium, TailwindCSS, CSS Glassmorphism)
│   └── api/          # NestJS Server (Express, Passport JWT, Sharp, class-validator)
├── packages/
│   ├── database/     # Prisma Client, migrations, and PostgreSQL schema definitions
│   └── shared/       # Shared TS typings and global constant fields
└── skills/           # Project-level design, product, QA, and security validation skills
```

---

## 🛠️ Getting Started

### 1. Prerequisites
Ensure you have the following installed on your system:
* **Node.js**: `v18.x` or later
* **npm**: `v9.x` or later
* **PostgreSQL**: Local or hosted database instance

### 2. Environment Configuration
Create a `.env` file in the monorepo root (copy from `.env.example` if present) with your credentials:

```ini
# API Configurations
PORT=4000
DATABASE_URL="postgresql://username:password@localhost:5432/terraflow_db?schema=public"

# Auth Tokens (JWT)
JWT_SECRET="your-super-secure-jwt-secret-key"
JWT_REFRESH_SECRET="your-super-secure-jwt-refresh-key"

# Social Auth
CLIENT_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_CALLBACK_URL="http://localhost:4000/api/v1/auth/google/callback"
```

### 3. Database Generation
Generate the Prisma schema client and migrate your schema:
```bash
# Generate Prisma Client
npm run db:generate

# Push schema changes to your database
npm run db:push
```

### 4. Running the Development Workspace
Start both the back-end API server and the front-end dev application in parallel:
```bash
# Run API (NestJS) on http://localhost:4000
npm run dev:api

# Run Web App (Next.js) on http://localhost:3000
npm run dev:web
```

### 5. Compiling for Production
To generate optimized production bundles:
```bash
# Run monorepo production build
npm run build
```

---

## 🔒 Security & Performance Guidelines
* **Rate Limiting**: Global API protection mapping a max of 120 requests/minute per IP address via NestJS Throttler.
* **XSS Protections**: Global Sanitizer Interceptor filters HTML, raw scripts, and SQL payload vectors from incoming requests.
* **Strict Validation**: Rigid schema validations using `class-validator` payload decorators.
* **Prisma Performance**: Clean, index-optimised queries for spatial explore viewports (clustering).

---

## 📄 License
This project is licensed under private terms. All rights reserved.
