# Rally Rush · proposed 0.3.0 plan

**Status:** Proposal  
**Current release:** 0.2.0  
**Target:** 0.3.0  
**Theme:** Make Rally Rush easier to learn, clearer during play, and more useful between matches.

This plan builds on the existing single-player game: 3D tennis simulation, four AI difficulty levels and styles, five court surfaces, seven shot types, two match formats, point replays, and local match records.

## Goals

1. Help a first-time player understand movement, shot choice, and release timing before a full match.
2. Make the match HUD and controls easier to read on desktop and small screens, while giving the court the available screen space during play.
3. Keep match results and ranking behavior transparent and protect local save data.
4. Add a low-pressure way to practice the core timing mechanic.
5. Make rallies and player movement feel more convincing without losing responsive arcade controls.
6. Polish the court, players, crowd, and match feedback while preserving stable frame pacing and installer behavior on supported Windows systems.

## Release scope

### P0 — Onboarding and in-game UI

**First-session guide**
- Add a short, skippable interactive tutorial for movement, sprinting, sliding, selecting a shot, and releasing at contact.
- Teach one mechanic at a time with a clear continue/skip option.
- Let players replay the guide from Setup or Pause.

**Match HUD**
- Clarify the relationship between points, games, sets, and tie-breaks.
- Make the active server, shot selection, stamina, and current timing feedback legible at laptop and mobile widths.
- Show keyboard, pointer, and touch instructions in the appropriate control context.
- Keep controls collapsible so the court remains the visual focus.
- On desktop during an active match, let the court use the available viewport; hide or collapse the branded header/logo and other non-gameplay chrome. Keep the score and essential controls visible.
- Keep branding on Setup and Pause screens, where it does not compete with the court.

**Accessibility and preferences**
- Add text-size options for the HUD and controls.
- Respect reduced-motion preferences for transitions and intro animations.
- Ensure visible keyboard focus, readable contrast, and useful accessible names for controls.
- Offer a reduced visual-effects option in addition to automatic quality reduction.

**Acceptance checks**
- A new player can reach and start a match without guessing which keys perform the basic actions.
- Tutorial can be skipped and replayed without changing saved player settings.
- Play, Pause, and Match End remain usable at 1280×720 and 390×844.
- During desktop play, the court is the main view and the logo/header does not take space from it; score and essential controls remain visible.
- All gameplay actions remain available through keyboard and on-screen controls.

### P1 — Practice mode

Add a standalone practice area that uses the existing simulation and shot timing.

- **Timing drill:** return balls and score release timing from Miss through Perfect.
- **Serve drill:** practice the toss and serve timing, including fault feedback.
- **Shot targets:** choose a target area and practice Flat, Topspin, Slice, Lob, Drop Shot, Serve, or Smash.
- **Session summary:** show attempts, timing distribution, target hits, and a plain-language tip.
- Keep practice unranked and separate from match history and the leaderboard.

**Acceptance checks**
- Practice does not add fabricated match records or leaderboard rating.
- Drill results are repeatable with deterministic tests for scoring and state transitions.
- Players can leave a drill and return to Setup without losing preferences.

### P1 — Local data controls

Make the local-first behavior actionable and easy to understand.

- Add a Settings section that says records stay on this device and are not shared online.
- Provide export and import for setup and match-history data in a versioned JSON format.
- Validate imported data, reject malformed or oversized files, and preview the number of records before import.
- Add a clear “Delete local data” action with confirmation.
- Preserve current saves and migrate them safely if the storage schema changes.

**Acceptance checks**
- Export followed by import reproduces valid records and preferences.
- Invalid files leave existing data untouched and show a helpful error.
- Delete requires confirmation and removes only Rally Rush data.
- No account, server, or network connection is required for these features.

### P2 — Match depth and replay polish

After onboarding and practice are stable:

- Add optional match presets for quick play (surface, AI style, difficulty, and format).
- Improve replay controls with pause, speed selection, and clearer point outcome labels.
- Add a post-match “what to practice” summary based on timing grades and shot outcomes.
- Tune AI difficulty and stamina using playtest feedback rather than increasing difficulty by raw speed alone.

**Acceptance checks**
- Existing tennis scoring and simulation tests remain green.
- Replay controls do not alter the live match state or saved result.
- Match presets are editable and do not silently replace player attributes.

### P2 — Gameplay feel and graphics polish

Make rallies feel more convincing and readable while keeping Rally Rush's responsive arcade identity.

- Tune acceleration, turning, footwork, sliding, and recovery so movement feels grounded and court surfaces matter without making controls sluggish.
- Make ball and racket contact clearer; shot timing, shot type, spin, and surface bounce should produce consistent, readable results.
- Refine AI positioning, recovery, and shot selection through playtests; higher difficulty should not come only from faster reactions or shots.
- Polish court materials, lighting, shadows, player animations, crowd/fan and referee presentation, and ball impact cues.
- Keep visual effects optional, preserve the reduced-effects setting, and keep the ball and gameplay feedback easy to read.

**Acceptance checks**
- Playtests can distinguish the effect of timing, shot type, and court surface while controls remain responsive.
- Physics and scoring changes have deterministic coverage and do not regress tennis rules or replay state.
- AI difficulty feels fair across the existing levels and styles.
- Visual polish keeps the stylized arcade look and stable frame pacing on modest integrated graphics.
- Reduced visual effects remains available.

## Suggested delivery sequence

1. **Discovery and baseline:** record current test/build status, inspect layout at desktop and narrow widths, and capture a small set of first-time-player observations.
2. **UI foundation:** implement responsive HUD refinements, court-first desktop match layout, preferences storage, reduced-motion support, and control-context help.
3. **Tutorial:** add reusable tutorial steps and test skip, replay, and completion flows.
4. **Practice:** build drills on existing engine events; add focused engine and UI tests.
5. **Local data tools:** add versioned import/export, validation, confirmation, and migration tests.
6. **Gameplay and visual polish:** tune movement, ball behavior, and AI; improve court and match feedback; playtest responsiveness and frame pacing.
7. **Polish and release candidate:** tune replay and match summary, run the full test/build pipeline, package Windows, then test installation and saved data.
8. **0.3.0 release:** publish the installer, release notes, known limitations, and updated consumer documentation.

## Quality gates

- `npm ci --legacy-peer-deps`, `npm test`, and `npm run build` pass from `frontend/`.
- Verify a packaged Windows installer with a clean install and upgrade over 0.2.0.
- Test on Windows 10 build 19045 and Windows 11 x64.
- Confirm that quitting, pausing, replaying, and returning to Setup do not corrupt match state or local records.
- Check keyboard-only controls, touch controls, reduced motion, and narrow-screen layout.
- Confirm that the app still works offline after installation and that no local ranking is described as online competition.
- Review dependency audit output and update dependencies deliberately; avoid automatic breaking upgrades without compatibility testing.

## Out of scope for 0.3.0

- Online multiplayer, cloud saves, accounts, and shared leaderboards. These need a backend, security model, moderation/abuse controls, and ongoing hosting; they should be planned as a separate project.
- A broad visual redesign that changes the arcade identity.
- New platforms or store distribution until Windows packaging and local save behavior are dependable.

## Risks and decisions

| Risk | Mitigation |
| --- | --- |
| Tutorial interrupts experienced players | Make it skippable and replayable; remember completion locally. |
| Import overwrites valued match history | Preview, validate, and require explicit confirmation; offer export first. |
| Extra HUD options increase layout complexity | Test actual desktop and narrow-screen sizes and retain sensible defaults. |
| Court-first layout hides useful match information | Keep score and essential controls visible and test at 1280×720 and 390×844. |
| Practice accidentally affects rankings | Keep practice data separate from match records and test this invariant. |
| Gameplay tuning feels sluggish or unfair | Preserve responsive controls and use playtests across surfaces, shots, and difficulty levels. |
| Performance drops from extra effects | Keep visual options optional and test on modest integrated graphics. |

## Success measures

- First-time testers can start a match and complete a return without help.
- During desktop matches, testers see the court as the main view without the logo/header taking up play space.
- Fewer missed actions caused by unclear controls or hidden feedback.
- Gameplay testers can describe how timing, shot choice, and court surface change rallies, while controls remain responsive.
- Practice gives repeatable and understandable timing feedback.
- Players can back up, restore, and intentionally clear local records.
- The Windows installer passes clean-install and upgrade checks on Windows 10 build 19045 and Windows 11 x64.
