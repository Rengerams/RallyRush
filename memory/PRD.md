# RENFFR OPEN — Tennis Web App (rebuild of Unity TennisGame_Upgraded.zip)

## Original problem
"unzip and review rebuild in a great web-app". Choices: single-player vs AI, modern 2D top-down court, leaderboard & match history in backend, keep original logic/upgrade experience, add user's name "renffr" in a special place.

## Architecture
- Frontend React + HTML5 Canvas engine + Three.js 3D view (`src/game/`: constants, physics, scoring, engine, render, audio; `src/game/three/`: ThreeView, stadium, parts)
- Pages: Home, Setup, Play, Leaderboard, History
- Backend FastAPI + MongoDB: POST/GET /api/matches, GET /api/leaderboard (aggregation, rating by difficulty)
- 2D/3D toggle on Play page with automatic FPS-based fallback to 2D for low-GPU devices

## Implemented (2026-06)
- Ported ScoringSystem (deuce/adv, 6 games win by 2, best of 3) + tie-break, server rotation, Quick Set format
- 7 shot types (keys 1-7), timing quality Miss/Late/Good/Perfect, input buffer, power/accuracy/fatigue modifiers
- Stamina, sprint (Shift), slide (Space); surfaces Hard/Clay/Grass + Kunstgras + Smashcourt modifiers
- AI difficulty Easy..Pro & styles Baseline/NetRusher/Defensive/Aggressive
- Serve toss/strike, faults, double faults, aces, winners, net, out; umpire callouts + speech, synth SFX, crowd
- renffr: court watermark "RENFFR OPEN", nav badge, Legend renffr preset, Hall of Fame card
- Match end modal auto-saves; leaderboard & history with surface filters
- Instant slow-motion point replays for aces and long rallies
- Cinematic audio intro (MatchIntro.jsx)
- README.md and LICENSE

## Implemented (2026-10 — 3D Rebuild)
- Three.js 3D stadium view with side-angle TV broadcast camera
- Blue themed stadium matching reference image: vibrant blue court, stadium stands with 850 instanced spectators
- Umpire chair, canopy/roof structures, stadium light poles
- "RENFFR OPEN" and "renffr edition" advertising boards around the court
- Player models with swing animations, ball with trail and shadow
- Camera subtly tracks ball, dramatic close-up angle during replays
- Automatic FPS-based fallback (2D if <8 FPS) with manual override toggle
- 2 new court surfaces: Kunstgras (artificial grass, fast/low bounce) and Smashcourt (medium pace, clay-like)
- Backend updated to accept all 5 surfaces
- Tested: backend 100% (14/14), frontend 100% (12/12) — iteration_2

## Code Quality Refactoring (2026-10)
- Converted `predictIntercept()` from 8 positional params to named object parameter
- Extracted `updateAIServe()` and `aiComputeTarget()` from complex `updateAI()` (complexity 33 → three focused methods)
- Extracted `netCollision()` and `groundBounce()` from `stepBall()` for clarity
- Split `actors()` into `createPlayers()`, `createBall()`, `createEffects()` in ThreeView.js
- Split `stands()` into `sideStands()` and `backStands()` in stadium.js
- Fixed Scoreboard array index key with composite key
- Added localStorage data validation in api.js `validateSetup()`
- Added ESLint suppress comments with reasoning for all intentional minimal hook deps

## Backlog
- P1: Local 2-player / online multiplayer
- P2: Player outfits/colors customization, achievements, mobile layout polish
- P2: Additional 3D camera angles (behind player, top-down 3D)
