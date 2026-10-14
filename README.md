# RENFFR OPEN — Tennis Web App

**Version:** 0.1.0
**License:** MIT (see [LICENSE](./LICENSE))

A top-down 2D tennis game for the browser, rebuilt from the Unity C# project `TennisGame_Upgraded`. You play one player against a computer opponent. Matches are saved to a leaderboard and a match history.

Built for and dedicated to **renffr**.

---

## Features

- Match intro with a fanfare, drums, crowd noise and an announcer voice (you can skip it)
- Tennis scoring: Love / 15 / 30 / 40, deuce and advantage. Games are won by 2, sets have a tie-break at all-square, and the serve alternates each game
- Seven shot types, each graded **Miss / Late / Good / Perfect** depending on how well you time the hit
- Stamina: sprinting drains it, and when you're tired your speed, power and accuracy drop
- Serving: toss the ball and hit it, with faults, double faults and aces
- An umpire who announces calls on screen and out loud, plus sound effects and a crowd that reacts
- **Instant replay** in slow motion (0.4x) after aces and rallies of 6 or more shots (you can skip it or turn it off)
- Leaderboard and match history saved on the backend
- renffr tributes: "RENFFR OPEN" painted on the court, a gold nav badge, a Hall of Fame card and a **Legend renffr** player preset

---

## Controls

| Key | Action |
|-----|--------|
| `W A S D` / Arrow keys | Move (left/right while hitting aims the shot) |
| `Shift` | Sprint (uses stamina) |
| `Space` | Slide |
| `1` | Flat: fast and direct |
| `2` | Topspin: dips and kicks high |
| `3` | Slice: low, skidding bounce |
| `4` | Lob: high over a player at the net |
| `5` | Drop Shot: soft and dies short |
| `6` | Serve: press once to toss, again to hit (any shot key also works when serving) |
| `7` | Smash: hits high balls hard |
| `Esc` / `P` | Pause |
| `Enter` | Skip replay |

On touchscreens, use the on-screen shot buttons and the arrow pad.

**Timing:** Perfect means the ball is within about 1.0 m when you hit, Good within about 2.0 m, and Late within 2.5 m. Anything further is a Miss. While a ball is coming at you, two rings around your player show these distances.

---

## Match options (Setup screen)

### Player
- **Name**: up to 24 characters
- **Power / Stamina / Accuracy**: 1–10 each, sharing a budget of **18 points**
- **Legend renffr preset**: 10 / 10 / 10 with no budget limit and a golden glow on court

### AI difficulty
| Level | Reaction time | Error chance | Shot power | Move speed |
|-------|---------------|--------------|------------|------------|
| Easy | 1.5x | 40% | 0.8x | 0.7x |
| Medium | 1.0x | 20% | 1.0x | 1.0x |
| Hard | 0.7x | 10% | 1.1x | 1.1x |
| Pro | 0.4x | 5% | 1.2x | 1.2x |

Hard and Pro opponents leave balls that are going out.

### AI play style
- **Baseline**: flat and topspin shots from the back of the court
- **Net Rusher**: comes to the net, plays flat shots and drop shots
- **Defensive**: lobs and slices, stays far back
- **Aggressive**: big flat shots and smashes

### Court surface
| Surface | Bounce | Friction | Player speed |
|---------|--------|----------|--------------|
| Hard Court | 0.90 | 0.95 | 1.00 |
| Clay | 0.80 | 0.80 | 0.85 |
| Grass | 0.95 | 0.90 | 0.90 |

### Match format
- **Quick Set**: 1 set, first to 3 games (tie-break at 3-3)
- **Original Rules**: best of 3 sets, 6 games per set (tie-break at 6-6)

### In-game toggles (pause menu)
- Sound on/off · Umpire voice on/off · Replays on/off · Restart match · Quit to setup

---

## Leaderboard rating
A win earns points based on difficulty: **Easy 10 · Medium 20 · Hard 35 · Pro 60**. A loss earns 2 points. Players are ranked by total points, then by wins. Names are matched without regard to upper/lower case.

---

## Tech stack
- **Frontend:** React, Tailwind, framer-motion, HTML5 Canvas game engine (`frontend/src/game/`), Web Audio API and SpeechSynthesis
- **Backend:** FastAPI + MongoDB (Motor)

### Project structure
```
frontend/src/game/      constants, physics, scoring, engine (AI, rules, replay), render, audio
frontend/src/pages/     Home, Setup, Play, Leaderboard, History
frontend/src/components/game/  Scoreboard, ShotPad, DPad, Callouts, StaminaBar, PauseModal, MatchEndModal, MatchIntro
backend/server.py       REST API
```

### API
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/matches` | Save a finished match |
| `GET` | `/api/matches?player=&surface=&limit=` | Match history, newest first |
| `GET` | `/api/leaderboard` | Rankings per player |

### Environment
- `backend/.env`: `MONGO_URL`, `DB_NAME`, `CORS_ORIGINS`
- `frontend/.env`: `REACT_APP_BACKEND_URL`

### Run locally
```bash
cd backend && pip install -r requirements.txt && uvicorn server:app --port 8001
cd frontend && yarn install && yarn start
```

---

## Changelog
### 0.1.0
- First web version, based on the Unity project
- Match intro with audio, instant slow-motion replays, leaderboard and match history

## License
MIT © 2026 renffr
