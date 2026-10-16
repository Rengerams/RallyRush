# Rally Rush

[![Release](https://img.shields.io/github/v/release/Rengerams/tennnisNL?label=release&style=flat-square)](https://github.com/Rengerams/tennnisNL/releases#release-0.2.0)
[![Downloads](https://img.shields.io/github/downloads/Rengerams/tennnisNL/total?style=flat-square)](https://github.com/Rengerams/tennnisNL/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Windows 10/11](https://img.shields.io/badge/Windows-10%20%2F%2011-0078D6?style=flat-square&logo=windows&logoColor=white)](#windows-desktop)
[![Browser playable](https://img.shields.io/badge/Browser-playable-4285F4?style=flat-square)](#run-from-source)
[![Offline single-player](https://img.shields.io/badge/Play-offline%20single--player-208A5D?style=flat-square)](#features)

Rally Rush (v0.2.0) is a single-player, arcade-style 3D tennis game for Windows and the browser. Play fast matches against AI opponents, build a player, and master seven shot types across five court surfaces.

> Local play only: matches, match history, and leaderboard entries are saved on this device. There is no online multiplayer, account system, or shared online ranking.

- Homepage: https://github.com/Rengerams/tennnisNL
- Changelog & releases: https://github.com/Rengerams/tennnisNL/releases

## Screenshots

### Match setup

![Rally Rush match setup screen](assets/match-setup.webp)

### Gameplay

![Rally Rush gameplay scene](assets/gameplay-scene.webp)

## Table of contents

- [Features](#features)
- [Screenshots](#screenshots)
- [Download (Windows)](#windows-desktop)
- [Controls](#controls)
- [Run from source](#run-from-source)
- [Build and test](#build-and-test)
- [Project layout](#project-layout)
- [Contributing](#contributing)
- [Reporting bugs & feedback](#reporting-bugs--feedback)
- [Roadmap](#next-version)
- [License](#license)

## Features

- 3D tennis simulation with ball physics, player movement, stamina, sprinting, slides, and recorded point replays.
- Seven shot types: flat, topspin, slice, lob, drop shot, serve, and smash. Each shot has a timing grade (Miss → Perfect).
- Five court surfaces: Hard Court, Clay, Grass, Kunstgras (artificial grass), and Smashcourt (affects bounce & movement).
- Four AI difficulty levels and four AI play styles.
- Player setup: name, attribute distribution (Power, Stamina, Accuracy), or Legend preset.
- Two match formats: Quick Set and Original Rules (best of three sets).
- Tennis scoring (deuce, advantage, tie-break), match stats, replay and presentation options.
- Keyboard + optional mouse controls, local leaderboard and match archive.

## Windows desktop

Download the [Rally Rush 0.2.0 Windows installer](https://github.com/Rengerams/tennnisNL/releases/download/0.2.0/Rally-Rush-0.2.0-Windows-Setup.exe).

For other versions, visit the [Releases page](https://github.com/Rengerams/tennnisNL/releases).

Notes:
- Supported: Windows 10 or 11, 64-bit.
- Desktop version stores matches and rankings locally on this device.
- Requires hardware-accelerated graphics with WebGL support.

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

Shot keys: **1 Flat**, **2 Topspin**, **3 Slice**, **4 Lob**, **5 Drop Shot**, **6 Serve**, **7 Smash**.

### Optional mouse movement

Enable "Mouse" in the match controls to move with the pointer. Hold right-click to aim; hold left-click to prepare and release to swing.

## Run from source

Requirements: Node.js and npm. From the repository root:

```bash
npm ci --legacy-peer-deps
npm run desktop
```

This starts the Vite development server and opens the game in Electron. For browser-based development, run `npm start` from the repository root and open the local address printed by Vite.

## Build and test

From the repository root:

```bash
npm test
npm run build
```

Create the Windows installer (on Windows):

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
- `assets/` — README screenshots and visual references.

## Contributing

Thanks for considering contributing! A few ways to help:

- Open issues for bugs or feature requests.
- Fork the repo, make a branch, and open a PR with a clear description.
- Add screenshots or a short demo GIF in `assets/` and update this README.

If you want me to add a CONTRIBUTING.md or templates for issues/PRs, I can create them.

## Reporting bugs & feedback

Please use the GitHub Issues page to report problems or request enhancements:
https://github.com/Rengerams/tennnisNL/issues

Include:
- What you did (steps to reproduce)
- What you expected to happen
- What actually happened (logs/screenshots if available)

## Next version

See the [Rally Rush 0.3.0 roadmap](ROADMAP.md) for proposed UI, onboarding, practice, local data, testing, and release plans.

## License

This project is licensed under the [MIT License](LICENSE).
