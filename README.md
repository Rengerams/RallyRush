# RENFFR OPEN — 3D Tennis

**Version 0.2.0** · Windows desktop game · [MIT License](./LICENSE)

RENFFR OPEN is a single-player 3D tennis game. Play a full match against a computer opponent, build your player, pick a court and AI style, and improve your timing across seven different shots. The game runs in its own Windows app window, with its own rendering runtime: you do not need to install or open a separate browser.

**This is a local, single-player game.** There is no online multiplayer or shared leaderboard. Your settings, match history and rankings are saved on this device.

## Get started

### Windows

Download the **RENFFR-OPEN-Windows** artifact from the latest successful **Windows desktop build** in the repository's **Actions** tab. Open the downloaded archive and run the Windows setup installer. The installed game does not need Node.js, a backend or a separate browser.

### Build from source

Install Node.js 22 or newer. From the `frontend/` directory, run:

```bash
npm install --legacy-peer-deps
npm run desktop
```

This starts the development server and opens the game in its own desktop window. To build a Windows installer on Windows, run:

```bash
npm run desktop:dist
```

`npm run build` creates the frontend build for development or hosting.

## What you can do

- **Play full tennis matches:** Choose a Quick Set or a best-of-three match, with tennis scoring, deuce, advantage, alternating serves and tie-breaks.
- **Choose your court:** Play on Hard Court, Clay, Grass, Kunstgras (artificial grass) or Smashcourt. Each surface has different bounce, friction and movement.
- **Set the challenge:** Pick Easy, Medium, Hard or Pro difficulty, then choose a Baseline, Net Rusher, Defensive or Aggressive AI opponent.
- **Build your player:** Choose a name and distribute 18 points across Power, Stamina and Accuracy. Or select the special **Legend renffr** preset.
- **Learn seven shots:** Flat, Topspin, Slice, Lob, Drop Shot, Serve and Smash. A timing grade tells you whether each hit was a Miss, Late, Good or Perfect.
- **Play your way:** Use keyboard and mouse on desktop, or the on-screen movement pad and shot buttons on a touchscreen.
- **Follow the match:** See the score and serve indicator, hear the umpire and crowd, and watch cinematic replays of highlights and match points.
- **Review your performance:** Compare aces, winners, errors, double faults, perfect shots and points won. Check rally lengths, match duration, match history and your local leaderboard.
- **Make it yours:** Turn sound, umpire voice and automatic replays on or off from the pause menu. Change between the Court and Broadcast camera views.

## Match setup

### Match format

| Format | Rules |
|---|---|
| **Quick Set** | One set; first to 3 games wins. A tie-break is played at 3–3. |
| **Original Rules** | Best of 3 sets; first to 6 games wins each set. A tie-break is played at 6–6. |

### Your player

Choose a name (up to 24 characters) and share **18 points** across:

- **Power** — shot strength
- **Stamina** — endurance while sprinting and playing long rallies
- **Accuracy** — shot control

Each attribute ranges from 1 to 10. The Legend renffr preset uses 10 / 10 / 10, has no point limit, and includes a gold kit and RENFFR branding.

### Opponent

| Difficulty | What to expect |
|---|---|
| **Easy** | More reaction time, slower movement and lighter shots |
| **Medium** | Balanced opponent |
| **Hard** | Faster reactions and movement, stronger shots; leaves balls going out |
| **Pro** | Fastest reactions, movement and shots; leaves balls going out |

Choose the opponent's play style too:

- **Baseline:** Plays from the back with flat and topspin shots.
- **Net Rusher:** Comes forward and uses flat shots and drop shots.
- **Defensive:** Stays deep and uses lobs and slices.
- **Aggressive:** Attacks with powerful flat shots and smashes.

## Controls

### Keyboard

| Key | Action |
|---|---|
| `W A S D` or arrow keys | Move; left and right also aim while hitting |
| `Shift` | Sprint (uses stamina) |
| `Space` | Slide |
| `1` | Flat — fast and direct |
| `2` | Topspin — dips and kicks high |
| `3` | Slice — low, skidding bounce |
| `4` | Lob — high over an opponent at the net |
| `5` | Drop Shot — soft and short |
| `6` | Serve — press once to toss, again to hit |
| `7` | Smash — powerful hit on a high ball |
| `Esc` or `P` | Pause |
| `Enter` | Skip a replay |

Hold a shot key to prepare for an incoming return. Your player swings when the ball reaches contact range. Tapping a shot still works with a short input buffer.

### Mouse

| Input | Action |
|---|---|
| Move over the court | Guide your player around your half of the court |
| Hold right mouse button | Aim without steering your player toward the aim marker |
| Left click | Attempt the selected shot; when serving, click once to toss and again to hit |
| Hold left mouse button | Prepare a return using the selected shot |
| On-screen shot buttons | Select and attempt a shot |
| Mouse on/off button | Toggle pointer movement and aiming |

Keyboard movement stays available when mouse controls are on. Move before serving, during the toss and while waiting to receive. The **Court / Broadcast** button changes the camera view.

### Shot timing

Two rings around your player show how close the ball is. A hit within about **1 metre** is Perfect, within **2 metres** is Good, and within **2.5 metres** is Late. A shot from farther away is a Miss. Well-timed shots are more reliable and effective.

## Scoring, results and privacy

The scoreboard uses Love, 15, 30 and 40, followed by deuce and advantage. You must win a game or tie-break by two points. A set is decided by its selected match format, and the serve alternates each game.

The local leaderboard awards points for wins by difficulty: **Easy 10 · Medium 20 · Hard 35 · Pro 60**. A loss earns 2 points. Players are ranked by points, then wins.

Your settings, match results, history and leaderboard stay in local storage on this device. They are not uploaded to a server, shared with other players or synchronized across devices. Uninstalling or clearing the app's local data may remove them.

## Presentation and accessibility

RENFFR OPEN features a 3D stadium, animated players, court markings, spectators, shadows, a ball trail and an umpire who calls points on screen and aloud. The match intro includes music and crowd sound. Replays cover aces, rallies of six or more shots and the final point; you can also replay a point manually, skip it or disable automatic replays.

The game uses WebGL for 3D graphics. If graphics initialization fails or the WebGL context is lost, the game pauses and offers a retry. On slower devices, visual effects are reduced while gameplay remains in 3D. A reduced-motion setting disables the preview ball animation.

## About this project

RENFFR OPEN is built with React, Vite, Three.js and a custom JavaScript tennis simulation. It was rebuilt from the Unity C# project `TennisGame_Upgraded` and is dedicated to **renffr**. Player models are procedural game characters, not photoreal scans or licensed professional-player likenesses.

## Changelog

### 0.2.0 — 2026-10-15
- Standalone Windows desktop app; the game opens in its own window.
- 3D stadium and animated players, with Court and Broadcast camera views.
- Five court surfaces, four AI difficulties and four opponent styles.
- Keyboard and mouse play, held-shot timing, serve repositioning and serve indicator.
- Cinematic replays, post-match breakdowns, rally charts, match history and local leaderboard.
- Local-first play with no online account, backend or shared competition.

### 0.1.0
- First playable version based on the Unity project.
- Match intro, audio, slow-motion replays, leaderboard and match history.

## License

MIT © 2026 renffr
