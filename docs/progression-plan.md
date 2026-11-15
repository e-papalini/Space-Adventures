# Easier landing and saved mission progress

## Implemented foundation

The integrated Flight page adds `automaticLanding.js`. Original Flight source
files are untouched. The player still pilots with the same graphics and controls.
Entering a 450 m three-dimensional zone and staying inside for four seconds
starts a smooth 2.5-second descent. Leaving resets the countdown. No button press,
precise heading, low speed or low altitude is required. The existing completion
event and controller start Exploration. See [current relay and landing rules](landing-transmission.md).

`src/core/progression.js` owns unlock thresholds, pure scoring functions and
browser progress storage. `src/ui/missionResults.js` renders the results without
adding another navigation controller. A unique mission ID prevents paying twice
for the same completed mission. Earth reads the saved profile and displays all
five levels, total points, their status and distance to the next unlock. Both
Earth's UI and an optional controller guard reject locked or unfinished routes.

Unlock order and total-point thresholds:

| Level | Destination | Points | Complete gameplay now? |
| --- | --- | --- | --- |
| 1 | Bennu | 0 | Yes |
| 2 | Itokawa | 60 | No; exploration must be developed |
| 3 | Ryugu | 140 | No; exploration must be developed |
| 4 | Wild 2 | 220 | No; Flight and dust flyby must be developed |
| 5 | Comet 67P | 300 | No; exploration must be developed |

Unlocking records the player's earned access; it does not claim a world exists.
Earth labels earned-but-unfinished destinations as "Unlocked · mission being
built" and never opens placeholder gameplay. Set a level's `playable` flag only
after its full route has passed integration tests. All five playable destinations
are therefore **not implemented by this foundation change**.

## Child-friendly score rules

- Finish a mission with a real scientific finding: 20 points.
- Finish a science task: 20 points each (up to four).
- Make different scientific findings: 10 points each (up to six).
- Collect from a sample site: 10 points each (up to two places).
- Send a complete scientific finding home: 10 points each (up to six).
- Prepare a real finding: 5 points each (up to six).
- Best complete signal connection: 10/20/30 points once per mission.
- Prepared water clues or sample information sent: 5 extra each (up to four).
- Retain at least 20 Wh and 10 MB free after useful science: 5 points.

A basic infrared task, its finding, preparation and excellent transmission scores 105 points. That
unlocks Itokawa without requiring perfect play. A repeated action, duplicate
discovery, arbitrary scan made at the relay or extra packet does not multiply
the score. Incomplete transmissions do not count as full sent findings.

Lifetime points are the sum of the player's best score at each destination.
A first run adds its score; later runs add only improvement over the previous
best. Equal or lower-score replays remain playable and recorded, but award no
additional points. This prevents unlimited rewards for identical repeated runs.

The browser saves total points, derived unlocks, completed mission IDs/results
and best scores in localStorage key `space-adventures-progress-v1`. Mission
resources still reset for each new expedition, while the player profile survives
return to Earth and refresh. No account or server is required. The same browser
and origin must be used: localhost:8000 and localhost:8123 have separate saves.
Corrupt or unavailable storage shows a warning and keeps the session playable.
Private mode, clearing site data or changing origin can remove/access a different
save. No automatic reset or deletion control was added.

## Existing destination work and staged expansion plan

Inspection of the working tree and teammate branch snapshots found the following:

- The builder contains real instruments and science objectives for all five
  requested destinations. The shared science catalogue contains destination
  materials, background discoveries and source links.
- Original Flight has Bennu, Itokawa, Ryugu, comet-67p and Dimorphos environments.
  The existing bridge maps shared `67p` to the flight identifier `comet-67p`.
  Wild 2 has no original Flight environment. Dimorphos is not one of these levels.
- Exploration is explicitly Bennu-only. Its configuration, model, coordinate
  helpers, renderer, timer, UI and scientific explanations reference Bennu.
  No Itokawa, Ryugu, Wild 2 or 67P exploration worlds were found on Explore.
- The transmission console is already destination-independent. Its handoff and
  score rules need the new destination action/data definitions before enabling
  additional routes. Merely changing a name would produce false science.

Proposed development sequence, before writing extensive additional gameplay:

1. **Itokawa:** extract the shared exploration engine's destination configuration
   without changing Bennu behavior. Adapt the builder's multiband camera,
   infrared spectrometer, laser rangefinder and X-ray spectrometer. Add rocky
   rubble terrain and separate tasks for pictures, silicate clues, distances and
   elemental clues. Elemental X-ray results must not claim exact mineral identity.
   Add size-aware transmission and scoring tests, then enable Level 2.
2. **Ryugu:** add dark boulder terrain, multispectral imaging, temperature mapping,
   hydrated-mineral clues and a genuinely single-use impactor that exposes a new
   site. Do not reset the spent impactor after returning or wrapping. Test its
   task/equipment/resource restrictions, then enable Level 3.
3. **Wild 2:** add a separate comet flyby Flight destination and a spacecraft dust
   exploration mode, not a landing or a surface rover. Reuse motion, timer,
   toolbar, state and transmission components. Implement imaging, dust detection,
   composition clues and aerogel collection. Use the builder's existing Wild 2
   IDs and capacities. Only enable Level 4 after testing the complete flyby route.
4. **67P:** add icy/dusty comet terrain and site-specific panoramic imaging, gas
   mass-spectrometer clues, subsurface drilling and temperature probes. Distinguish
   possible organics from proof of life and keep mission simplifications clear.
   Test the existing Flight ID bridge, new exploration, packets and rewards before
   enabling Level 5.

Each step should retain the original Bennu regression suite, add destination
science/content and equipment tests, and complete an actual browser mission.
This work adds new gameplay and is intentionally staged instead of exposing
empty screens or pretending every destination already exists.

## Local testing

```powershell
python -m http.server 8000 --bind 127.0.0.1
```

Open http://localhost:8000/, start Bennu, build a valid payload, and fly toward
the target. Landing should start at proximity with no click. Finish the science
task and transmission, inspect the score breakdown, return to Earth and refresh.
Points and the earned Itokawa unlock should remain. Replaying with the same score
should award zero additional points. Improvement should award only the difference.

Run all automated checks with `npm.cmd test`. New tests cover automatic approach,
smooth descent, scoring, duplicate rewards, replay improvement, threshold order,
save/restore, corrupted storage and unavailable storage.
