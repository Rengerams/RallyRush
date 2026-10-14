# RENFFR OPEN — Tennis Web App (rebuild of Unity TennisGame_Upgraded.zip)

## Original problem
"unzip and review rebuild in a great web-app". Choices: single-player vs AI, modern 2D top-down court, leaderboard & match history in backend, keep original logic/upgrade experience, add user's name "renffr" in a special place.

## Architecture
- Frontend React + HTML5 canvas engine (`src/game/`: constants, physics, scoring, engine, render, audio). Pages: Home, Setup, Play, Leaderboard, History.
- Backend FastAPI + MongoDB: POST/GET /api/matches, GET /api/leaderboard (aggregation, rating by difficulty).

## Implemented (2026-06)
- Ported ScoringSystem (deuce/adv, 6 games win by 2, best of 3) + tie-break, server rotation, Quick Set format
- 7 shot types (keys 1-7), timing quality Miss/Late/Good/Perfect, input buffer, power/accuracy/fatigue modifiers
- Stamina, sprint (Shift), slide (Space); surfaces Hard/Clay/Grass modifiers from CourtSurface.cs
- AI difficulty Easy..Pro & styles Baseline/NetRusher/Defensive/Aggressive, trajectory prediction, smart let-go of out balls
- Serve toss/strike, faults, double faults, aces, winners, net, out; umpire callouts + speech, synth SFX, crowd
- renffr: court watermark "RENFFR OPEN", nav badge, Legend renffr preset (10/10/10, gold aura), Hall of Fame card, gold name everywhere
- Match end modal auto-saves; leaderboard & history with filters
- Tested: backend 100%, frontend 100% (iteration_1)

## Backlog
- P1: Training mode (ball machine from GameModes.cs), replay of last point (ReplaySystem.cs)
- P1: Local 2-player / online multiplayer (Networking scripts)
- P2: Player outfits/colors customization, achievements, mobile layout polish
