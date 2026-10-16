# Rally Rush 0.3.0 quality baseline

Captured against `main` at `cce58bf` with the gameplay changes in this working branch. This is the automated baseline for issues #58 and #63; it does not replace hands-on play or release-device checks.

## Automated checks

| Check | Result |
| --- | --- |
| `npm test -- --reporter=dot` | 105 tests passed across 21 files |
| `npm run lint` | Passed with zero warnings |
| `npm run build` | Passed; Vite reports the existing `ThreeView` chunk at 574.84 kB, above its 500 kB advisory threshold |
| `npm run playtest:ai` | 48 difficulty/style/profile rows × 8 fixed seeds = 384 completed matches; deterministic repeat check passed |

The fixed-seed baseline-player results are:

| Difficulty | Beginner wins | Club wins | Sharp wins |
| --- | ---: | ---: | ---: |
| Easy | 8/8 | 7/8 | 8/8 |
| Medium | 7/8 | 5/8 | 6/8 |
| Hard | 1/8 | 3/8 | 2/8 |
| Pro | 0/8 | 0/8 | 0/8 |

The matrix now checks that Baseline wins do not increase as difficulty rises for these three bot profiles. This is a deterministic balance smoke test, not a claim that every play style or a human player has the same win rate. The full matrix shows substantial differences by AI style; defensive and aggressive matchups still need tuning against human play.

## Manual checks still required

- First-time-player observations and subjective feel on keyboard and touch.
- HUD readability, focus, and layout at 1280×720 and 390×844; reduced-motion and pause/replay behavior.
- Human play across surfaces for movement, contact feel, spin, bounce, referee presentation, and audio mix.
- Windows 10/11 clean install and upgrade from 0.2.0. The project owner reports that the Windows build works; these separate install and upgrade paths have not been recorded here.
- Final release validation, dependency review, and installer publication.
