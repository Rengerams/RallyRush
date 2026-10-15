# RENFFR OPEN — 3D Tennis Frontend

The React frontend for RENFFR OPEN, a single-player **3D tennis game** rendered with **Three.js and WebGL**. A custom JavaScript simulation handles ball physics, player movement, computer opponents, scoring and replay recording.

See the [main README](../README.md) for controls, court surfaces, features, API endpoints and backend setup.

## Desktop app

On Windows, download the RENFFR OPEN installer from GitHub Actions or Releases and launch it like any other game. It runs in its own app window and does not require a separate browser, Node.js, an API, or MongoDB.

For development, install dependencies once and run:

```bash
npm install --legacy-peer-deps
npm run desktop
```

The desktop command starts the local development server and opens the game in an Electron window. Match results, history and rankings are stored locally on this device.

## Browser development

To work on the browser version (served by Vite) instead:

```bash
npm start
```

The frontend is available at `http://127.0.0.1:3000`. To create a Windows installer from a Windows machine, run `npm run desktop:dist`.

## Development

```bash
npm test
npm run build
```

The development server and production build use Vite. `npm run build` writes the optimized frontend to `dist/`.

## Main source areas

- `src/game/three/`: 3D stadium, cameras, articulated players, animations and rendering.
- `src/game/engine.js`, `physics.js`, `scoring.js`: simulation, AI and match rules.
- `src/game/input.js`, `replay.js`: keyboard/mouse control and recorded-action playback.
- `src/components/game/`: court canvas, scoreboard, shot controls, serve timing, replay UI and match statistics.
- `src/pages/`: Home, Setup, Play, Leaderboard and History.

## Graphics requirements

Gameplay requires WebGL and stays in 3D. Low frame rates trigger reduced effects rather than a rendering-mode switch. If WebGL is unavailable or its context is lost, a retry message appears and the simulation is suspended.