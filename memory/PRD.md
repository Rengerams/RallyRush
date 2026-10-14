# RENFFR OPEN — Tennis Web App (rebuild of Unity TennisGame_Upgraded.zip)

## Original problem
"unzip and review rebuild in a great web-app". Choices: single-player vs AI, leaderboard & match history in backend, keep original Unity mechanics/upgrade experience, add user's name "renffr". Initial 2D requirement was superseded by explicit always-3D gameplay, realistic-looking players, a clear court view, mouse controls and unrestricted pre-serve/receiving movement.

## Architecture
- Frontend React + custom JS tennis engine + Three.js WebGL (`src/game/`: constants, physics, scoring, engine, input, replay, audio; `src/game/three/`: ThreeView, stadium, parts, anatomy, player, animatePlayer). Legacy 2D renderer remains unused.
- Pages: Home, Setup, Play, Leaderboard, History
- Backend FastAPI + MongoDB: POST/GET /api/matches, GET /api/leaderboard (aggregation, rating by difficulty)
- Always 3D on Play; reduced effects for low FPS, explicit retry error for unavailable/lost WebGL. No 2D toggle/fallback. Simulation stops while graphics are unavailable.
- Match data now includes optional opponent_stats and rally_lengths (backward-compatible with older documents).

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

## Implemented (2026-10-14 — visual, replay & controls upgrade)
- Replaced capsule avatars with articulated anatomical athletes: contoured torsos/limbs, facial details, hair/headbands, fabric-textured shirts/shorts, socks/shoes, hands, strung rackets, branded clothing and run/swing/serve poses. These are procedural characters, NOT photoreal scans or licensed pro likenesses.
- Fixed obstructed court: removed side roofs crossing camera sightlines, default steady elevated baseline camera with optional broadcast camera. Larger gameplay area and transparent net improve visibility. Player names no longer truncate on the scoreboard.
- Removed automatic 2D fallback per explicit user request. Effects/pixel ratio reduce instead; WebGL errors have retry and preserve simulation state.
- Keyboard movement before serving, during toss, receiving, between points and fault pauses. Second serves retain player position. The tossed ball inherits movement rather than remaining artificially attached.
- Retained 1–7 separate shot keys (explicit user choice); held keys prepare reachable returns, taps retain short input buffering. Added mouse following, explicit right-button aiming and left-button shot/held preparation. Keyboard overrides mouse targets; pause/blur/replay clear stale input.
- Research informed controls: official Tennis Elbow 4 documentation and TopSpin 2K25 gameplay report. Rationale, sources and exact mapping in `memory/CONTROL_DESIGN.md`.
- Serve status/toss-height timing meter, shot selection highlight, optional mouse following. Responsive scoreboard/serve HUD avoids overlap at 320px. Touch DPad captures and clears pointers correctly.
- Timestamped interpolated replays with cinematic subject-framing camera, speed/progress, manual last-point replay, skip, and correct live-state restoration. Final-point automatic/manual replays return to results without re-awarding points or re-saving matches.
- Completed match comparison charts, aces/winners/errors/double faults/perfect shots/longest rally/points, rally histogram/average and duration. Extended real backend persistence. Match history exposes saved breakdowns and remembers expanded rows across reloads. Retry button on save failure.
- Surface mini-court preview updates colors/metrics for all five surfaces. Home copy corrected to 3D and five surfaces.
- Added guard preventing buffered shots after a point is over.

## Verification (2026-10-14)
- Testing agent report: `test_reports/iteration_4.json`; 35/35 backend tests and 8/8 engine/input/replay unit tests passed. Agent confirmed 3D rendering, camera toggle, keyboard movement, RMB context suppression, held keys, serve meter, responsive widths, and API persistence.
- Agent flagged history expansion persistence and outdated surface count. Both fixed and browser-verified; original report retained as historical evidence.
- Main-agent browser checks after fixes: controlled match-point fixture -> automatic final replay -> result -> real backend save; manual replay skip and natural completion restore identical score/stats and save count stays unchanged. This was a controlled edge-case test, not a full naturally played match.
- Browser checks verified prepared shot waits for reachable contact, dead points reject shots, and 320px scoreboard/serve meter do not overlap or horizontally overflow.
- Production frontend build compiled successfully; unit tests rerun 8/8. No mocked application APIs or integrations. No authentication required (`memory/test_credentials.md`).
- Supplementary verification: `test_reports/iteration_4_followup.json`.

## Documentation correction (2026-10-14)
- User identified stale README wording: "A top-down 2D tennis game for the browser".
- Updated the root README to describe the current Three.js/WebGL 3D game, cameras, adaptive effects, articulated models, keyboard/mouse controls, serving, replay speeds, saved stats and all five surfaces.
- Replaced frontend Create React App boilerplate README with project-specific 3D frontend setup, Yarn commands and source layout.
- Documentation-only change; gameplay code and prior test results remain unchanged. Checked descriptions against current implementation and scanned both READMEs for the obsolete description.

## Prioritized next actions / backlog
- P0: No known functional blockers from targeted tests. User to try a match and give control-feel feedback; full natural long-play balancing remains useful.
- P1: Higher-fidelity licensed/scanned player assets and animations if photorealism is required; current procedural athletes are not equivalent to professional sports-game models.
- P1: Player outfit/color customization and achievements (not implemented).
- P2: Local/online multiplayer, additional camera options, further touch polish.
- P2: Tennis-rule fidelity refinements (e.g. foot faults/net-cord lets) and deeper long-match balancing.
- Suggested enhancement: a practice court for serving and return timing with optional landing guides (not implemented).
