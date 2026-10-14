# RENFFR OPEN — 3D Tennis Frontend

The React frontend for RENFFR OPEN, a single-player **3D tennis game** rendered with **Three.js and WebGL**. A custom JavaScript simulation handles ball physics, player movement, computer opponents, scoring and replay recording.

See the [main README](../README.md) for controls, court surfaces, features, API endpoints and backend setup.

## Development

Use Yarn for frontend dependencies and scripts:

```bash
yarn install
yarn start
```

Set `REACT_APP_BACKEND_URL` in `frontend/.env` to the application's backend base URL. The frontend appends `/api` when calling the FastAPI service.

```bash
yarn test --watchAll=false --runInBand
yarn build
```

The build uses Create React App with CRACO configuration. `yarn build` writes the optimized frontend to `build/`.

## Main source areas

- `src/game/three/`: 3D stadium, cameras, articulated players, animations and rendering.
- `src/game/engine.js`, `physics.js`, `scoring.js`: simulation, AI and match rules.
- `src/game/input.js`, `replay.js`: keyboard/mouse control and recorded-action playback.
- `src/components/game/`: court canvas, scoreboard, shot controls, serve timing, replay UI and match statistics.
- `src/pages/`: Home, Setup, Play, Leaderboard and History.

## Graphics requirements

Gameplay requires WebGL and stays in 3D. Low frame rates trigger reduced effects rather than a rendering-mode switch. If WebGL is unavailable or its context is lost, a retry message appears and the simulation is suspended.