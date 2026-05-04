# Aura

Aura is a web-first Life OS for helping people raise their aura across every part of life, not just fitness, school, or work. The goal is to help someone check in with themselves, notice what needs attention, take small daily actions, and build a more balanced life over time.

This repo is now organized around a React web MVP and a tiny C backend scaffold. The first milestone is local-first: the web app saves progress in the browser while the backend stays small and ready for future persistence.

## Current milestone

- Web MVP: daily aura dashboard, six life areas, ratings, suggested actions, and local progress.
- Backend scaffold: raw-socket C HTTP server with health/version endpoints.
- Mobile: planned later, likely with Expo/React Native after the web experience feels right.

## Repo layout

```text
.
├── backend/          # Tiny C backend scaffold
├── web/              # React + Vite frontend
├── README.md         # Project vision, setup, and roadmap
└── .gitignore        # Generated files and local junk
```

## Run the web app

```bash
cd web
npm install
npm run dev
```

Vite will print the local URL, usually `http://localhost:5173`.

## Run the C backend

```bash
cd backend
make
./aura_server
```

The server listens on `http://localhost:8080`.

Useful checks:

```bash
curl http://localhost:8080/health
curl http://localhost:8080/version
```

## Product direction

Aura v1 uses six balanced life areas:

- Mind
- Body
- Work/School
- Social
- Purpose
- Style/Confidence

Each day, users rate where they are, complete small actions, and watch their aura score update. The point is not perfection. The point is honest awareness plus steady movement.

## Roadmap

1. Web dashboard with local check-ins and actions.
2. Real C API persistence, likely with SQLite.
3. Accounts and sync across devices.
4. Mobile app with Expo/React Native.

## Notes for future builders

- The frontend intentionally owns local persistence for now through `localStorage`.
- The C backend is intentionally tiny and readable. It does not store user data yet.
- Future API endpoints should cover users, daily check-ins, aura areas, suggested actions, and history.
- Keep the product broad: Aura should support mental health, body, ambition, school/work, relationships, confidence, purpose, and environment over time.
