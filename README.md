# RENFFR OPEN — 3D Tennis Web App

**Version:** 0.1.0
**License:** MIT (see [LICENSE](./LICENSE))

A 3D tennis game for the browser, rendered with **Three.js and WebGL** and rebuilt from the Unity C# project `TennisGame_Upgraded`. Play singles against a computer opponent in a blue-court stadium, with keyboard and mouse controls, cinematic replays, and match results saved to a leaderboard and match history.

Built for and dedicated to **renffr**.

## About the game

RENFFR OPEN is a single-player 3D tennis game. Play a full match against an AI opponent, using keyboard and mouse or touchscreen controls. Pick a court surface, AI difficulty and play style, then choose a quick set or a best-of-three match.

There are seven shots to learn, serve timing, stamina, tennis scoring, an umpire, crowd reactions and cinematic replays. After each match, review your stats and results. No account or server is needed: settings, match history and leaderboard stay in this browser on this device.

---

## Features

- **3D stadium and articulated players:** animated running, swings and serves, detailed tennis outfits, rackets, court markings, spectators, shadows and a visible ball trail. Players are procedural models, not photoreal scans or licensed professional-player likenesses
- **Clear court cameras:** a steady elevated baseline view by default, plus an optional angled broadcast view
- **Always-3D gameplay:** slower devices use reduced visual effects rather than switching to a different rendering mode
- Match intro with a fanfare, drums, crowd noise and an announcer voice (you can skip it)
- Tennis scoring: Love / 15 / 30 / 40, deuce and advantage. Games are won by 2, sets have a tie-break at all-square, and the serve alternates each game
- Seven shot types, each graded **Miss / Late / Good / Perfect** depending on how well you time the hit
- Stamina: sprinting drains it, and when you're tired your speed, power and accuracy drop
- Serving: toss the ball and hit it, with a toss-height timing meter, faults, double faults and aces. Reposition before serving, during the toss, and while waiting to receive
- An umpire who announces calls on screen and out loud, plus sound effects and a crowd that reacts
- **Cinematic replay:** recorded action plays at 0.65x, slowing to 0.3x near the end. Automatic highlights cover aces, rallies of 6 or more shots and the final point; manual replay, progress, skip and an automatic-replay toggle are available
- **Post-match breakdown:** compare aces, winners, errors, double faults, perfect shots and points won; inspect longest/average rally lengths, a rally histogram and match duration
- Match history, leaderboard and detailed stats saved locally in this browser
- Five court surfaces with a color-matched mini-court preview on the setup screen
- renffr tributes: "RENFFR OPEN" painted on the court, a gold nav badge, a Hall of Fame card and a **Legend renffr** player preset

---

## Controls

### Keyboard

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

Hold a shot key to prepare an incoming return; the player hits when the ball reaches contact range. Tapping still attempts a shot with a short input buffer. Movement stays available before a serve and while receiving; pause and replay suspend live play.

### Mouse

| Input | Action |
|-------|--------|
| Move the pointer over the court | Guide your player toward a position in your own half |
| Hold the right mouse button | Aim the selected shot without steering your player toward the aiming marker |
| Left click | Attempt the selected shot; when serving, click once to toss and again to strike |
| Hold the left mouse button | Prepare an incoming return using the selected shot |
| On-screen shot buttons | Select and attempt one of the seven shots |
| Mouse on/off button | Toggle mouse movement and aiming; keyboard movement and mouse shot inputs remain available |

Keyboard movement takes priority over an existing mouse destination. Aim markers use the selected shot's depth; serves aim into the correct service box. The **Court / Broadcast** button changes the camera without changing the 3D game mode.

**Timing:** Perfect means the ball is within about 1.0 m when you hit, Good within about 2.0 m, and Late within 2.5 m. Anything further is a Miss. While a ball is coming at you, two rings around your player show these distances.

---

## Match options (Setup screen)

### Player
- **Name**: up to 24 characters
- **Power / Stamina / Accuracy**: 1–10 each, sharing a budget of **18 points**
- **Legend renffr preset**: 10 / 10 / 10 with no budget limit, a gold-colored kit and renffr branding

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
| Kunstgras (artificial grass) | 0.85 | 0.92 | 1.05 |
| Smashcourt | 0.82 | 0.82 | 0.88 |

These are surface multipliers used by the game physics. Selecting a surface updates the setup preview and the match court.

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
- **Frontend:** React, Tailwind, framer-motion, **Three.js/WebGL 3D rendering**, a custom JavaScript tennis simulation, Web Audio API and SpeechSynthesis

A WebGL-capable browser is required. If graphics initialization fails or the WebGL context is lost, the game displays a retry control and suspends the simulation. Automatic quality adjustment reduces effects while retaining 3D rendering.

### Project structure
```
frontend/src/game/      constants, physics, scoring, engine (AI/rules), input, replay, audio
frontend/src/game/three/ ThreeView, stadium, player models, anatomy, animation, shared parts
frontend/src/pages/     Home, Setup, Play, Leaderboard, History
frontend/src/components/game/  GameCanvas, Scoreboard, ShotPad, DPad, ServeIndicator,
                               SurfacePreview, MatchStats, MatchEndModal, PauseModal, MatchIntro
```

### Run the game locally

The game runs entirely in your browser and needs no API, database or account. From `frontend/`, install dependencies once, then start it:

```bash
corepack yarn install
corepack yarn start
```

It opens at `http://localhost:3000`. Match results, history, settings and leaderboard stay in this browser on this device.

---

## Changelog
### 3D gameplay and usability update — 2026-10-14
- Three.js stadium, articulated athletes, unobstructed court/broadcast cameras and adaptive 3D effects
- Mouse movement, explicit right-button aiming, left-button shots, and held-key shot preparation
- Free pre-serve/receiving movement, second-serve position retention and a serve timing indicator
- Cinematic final-point/manual replays, comparison statistics, rally charts and saved match breakdowns
- All five surfaces documented, with responsive surface previews and improved mobile HUD spacing

### 0.1.0
- First web version, based on the Unity project
- Match intro with audio, instant slow-motion replays, leaderboard and match history

## License
MIT © 2026 renffr
