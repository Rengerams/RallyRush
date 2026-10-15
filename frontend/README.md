# Rally Rush frontend

This directory contains the Rally Rush 0.2.0 game client and Electron desktop app. For the player-facing overview, features, local ranking details, and controls, see the [root README](../README.md).

## Development

Requires Node.js and npm.

```bash
npm ci --legacy-peer-deps
npm run desktop
```

This starts Vite and opens the game in an Electron window. For browser-based development, use `npm start`; Vite prints the local URL.

## Test and build

```bash
npm test
npm run build
```

Vite writes the optimized browser build to `dist/`.

On Windows, create the desktop installer with:

```bash
npm run desktop:dist
```

The installer is written to `release/`. The installed desktop app does not require a separate browser, Node.js, backend service, or database.

## Main source areas

- `src/game/` — simulation, physics, scoring, AI, input, and replays.
- `src/game/three/` — 3D court, cameras, player models, animation, and rendering.
- `src/components/game/` — court canvas, scoreboard, shot controls, serving, and match statistics.
- `src/pages/` — Home, Setup, Play, Leaderboard, and History.

Gameplay requires hardware-accelerated WebGL. If WebGL is unavailable or its context is lost, the game displays a retry message and suspends the simulation.
