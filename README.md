# Rally Rush

**Rally Rush 0.2.0** is a single-player, arcade-style 3D tennis game for Windows and the browser. Play fast matches against AI opponents, build a player, and learn to time each shot across five court surfaces.

> **Local play only:** matches, match history, and leaderboard entries are saved on this device. There is no online multiplayer, account system, or shared online ranking.

## Features

- **3D tennis simulation** with ball physics, player movement, stamina, sprinting, slides, and recorded point replays.
- **Seven shot types:** flat, topspin, slice, lob, drop shot, serve, and smash. Each shot has a timing grade, from Miss and Late through Good and Perfect.
- **Five court surfaces:** Hard Court, Clay, Grass, Kunstgras (artificial grass), and Smashcourt. Each changes ball bounce and movement.
- **Four AI difficulty levels:** Easy, Medium, Hard, and Pro.
- **Four AI styles:** Baseline, Net Rusher, Defensive, and Aggressive.
- **Player setup:** choose a name and distribute attribute points across Power, Stamina, and Accuracy, or use the Legend preset.
- **Two match formats:** Quick Set (one set, first to three games) and Original Rules (best of three sets, six games per set).
- **Tennis scoring:** deuce, advantage, and tie-break rules.
- **Match feedback and stats:** scoreboards, umpire callouts, shot-quality feedback, aces, rally counts, perfect shots, match breakdowns, and a match archive.
- **Replay and presentation options:** replay the last point, switch between Court and Broadcast cameras, and toggle sound, voice callouts, and replays.
- **Keyboard and optional mouse controls**, plus on-screen shot and movement controls.

## Windows desktop

Download the latest `Rally-Rush-0.2.0-Windows-Setup.exe` installer from [GitHub Releases](https://github.com/Rengerams/tennnisNL/releases). Install and launch Rally Rush like a regular Windows app.

- Supported: Windows 10 or 11, 64-bit.
- A separate browser, Node.js, server, or database is not needed to play the installed desktop version.
- The game needs hardware-accelerated graphics with WebGL support.

The desktop app keeps its local matches and rankings in its application storage on this device. Those records do not sync to another computer.

## Controls

### Keyboard

| Action | Control |
| --- | --- |
| Move | **W A S D** or **Arrow keys** |
| Sprint | **Shift** |
| Slide | **Space** |
| Select a shot | **1–7** |
| Prepare and take a shot | Hold a shot key, then release |
| Pause or resume | **P** or **Esc** |
| End a point replay | **Enter** |

The shot keys are **1 Flat**, **2 Topspin**, **3 Slice**, **4 Lob**, **5 Drop Shot**, **6 Serve**, and **7 Smash**. Timing the release affects the quality of a shot. The on-screen shot pad and movement pad can also be used with pointer or touch input.

### Optional mouse movement

Enable **Mouse** in the match controls to move with the pointer. Hold the right mouse button to aim; hold the left mouse button to prepare a shot and release it to swing. Mouse movement is optional.

## Local rankings and saved data

The leaderboard is a **local ranking on this device**. It is not an online competition, and entries are not uploaded or shared. Match history and setup preferences are also saved locally. Clearing Rally Rush's app/browser storage removes those local records.

## Run from source

Requirements: Node.js and npm. From the repository root:

```bash
cd frontend
npm ci --legacy-peer-deps
npm run desktop
```

This starts the Vite development server and opens the game in Electron.

For browser-based development, run `npm start` from `frontend/` and open the local address printed by Vite. The browser version is useful for development and testing; the packaged desktop app runs in its own window.

## Build and test

Run these commands from `frontend/`:

```bash
npm test
npm run build
```

Create the Windows installer on Windows with:

```bash
npm run desktop:dist
```

The installer is written to `frontend/release/`.

## Project layout

- `frontend/src/game/` — tennis simulation, scoring, physics, AI, input, and replay logic.
- `frontend/src/game/three/` — 3D court, player models, camera, animation, and rendering.
- `frontend/src/components/game/` — match interface, court canvas, scoreboard, controls, and statistics.
- `frontend/src/pages/` — home, match setup, gameplay, local leaderboard, and match history.
- `frontend/desktop/` — Electron desktop shell.

## Next version

See the [Rally Rush 0.3.0 roadmap](ROADMAP.md) for the proposed UI, onboarding, practice, local data, testing, and release plan.

## License

MIT. See [frontend/package.json](frontend/package.json).
