# RENFFR OPEN control design — 2026-10-14

## Explicit user direction
- Keep separate keys for each shot (1–7).
- Mouse control as well as keyboard.
- Always 3D; clear view of the court.
- Free positioning before serving and while waiting for a serve.
- Compare other tennis games for logical control design.

## References consulted
- Tennis Elbow 4 official documentation, gameplay / movement, strikes & aiming:
  https://www.managames.com/tennis/doc/Tennis_Elbow-Tennis_Game.html
  Holding a strike prepares contact; directional controls manage movement and aim.
- TopSpin 2K25 official gameplay report:
  https://2k.com/games/topspin-2k/topspin-2k25/centre-court-report/gameplay/
  Readable timing feedback for forehands, backhands, and serves.

## Adaptation for this browser game
This is not an exact clone of either control system.
- WASD / arrows move; number keys 1–7 select and attempt their respective shots.
- Holding a shot key prepares an incoming return and waits for reachable contact.
- Mouse movement guides the player to a ground-plane target, within their own half.
- Holding right mouse explicitly aims the chosen shot without pulling the player to the net.
- Left click attempts the selected shot; holding prepares an incoming return.
- Serve: first shot input tosses, second input hits. A live toss-height meter shows the timing window.
- Keyboard direction overrides an old mouse movement target. Pause, blur and replay completion clear input.
- Mouse following can be switched off; mouse shots still work with keyboard movement.
- Serving and receiving no longer lock player movement. Second serves preserve repositioning.
- The gameplay camera is fixed and court-aligned by default; optional broadcast view remains in 3D.
- Performance adaptation lowers effects; it never silently changes to 2D.

## Current limits
- Player meshes are procedurally modeled, articulated athletes, not photoreal scans or licensed pro likenesses.
- Timing remains primarily position/contact based, not a full TopSpin release-to-hit meter system.
- Serve foot faults and net-cord lets remain candidates for a future tennis-rules refinement; no claim of complete simulation parity.