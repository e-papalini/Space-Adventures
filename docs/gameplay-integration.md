# Integrated gameplay on integration-test

## Safety and provenance

Backup branch: `backup/integration-test-before-gameplay-2026-11-15` at `49ca2c5`.
The gameplay was imported from these fetched snapshots without switching or
modifying the source branches:

| Source | Commit | Imported location |
| --- | --- | --- |
| Rover-building-stage | b4eded5 | `src/stages/preparation2/rover-building/` |
| survey_flight | 8782a2c | `src/stages/flight/original/` |
| Explore | cbfc024 | `src/stages/research/` |
| data-transmission | 18967f5 | `src/stages/transmission/` |

This is a source import with adapters, not a blind Git merge. Conflicting main
pages and Research implementations were kept separate. Flight's original files
are unchanged. Builder internals and Exploration gameplay are unchanged.
Imported stage entry points are also saved as `imported-index.js.txt` beside
their adapted wrappers. No commits or pushes to main are part of this work.

## Play locally

From the repository root:

```powershell
python -m http.server 8000 --bind 127.0.0.1
```

Open http://localhost:8000/ and click **Start mission**. No build or installation
is needed. Do not use a file:// URL. Stop the server with Ctrl+C.

1. Earth: select Bennu on the original destination map and confirm.
2. Rover Building: read the briefing, begin assembly, choose instruments and
   click mounts (or drag and drop). Bennu's primary objective requires the
   infrared spectrometer. Mass, operating power, data and the assembly timer
   still use the original builder rules. Authorize a valid payload to continue.
3. Flight: use the original WASD, Q/E, Space/Ctrl and Shift controls. Approach
   Bennu, slow below 40 m/s, descend below 65 m, align with the approach vector,
   and attempt landing. Completed landing automatically starts Exploration.
4. Exploration: Start Exploring, drive with WASD/arrows or the touch pad. E or
   tapping a nearby object opens free inspection. Choose a recommended installed
   tool, then use E/the action button again. Finish one available science task,
   end early, review results and continue. The five-minute timer also ends the
   expedition while preserving partial findings.
5. Transmission: collected observations already appear as packets. Select one,
   open the original tuning console, adjust frequency and phase to lock the
   relay, and send. A reliable lock is frequency 1.14 and phase 35 degrees. Send
   additional packets as resources permit, then Finish mission.

The final screen reports sent and unsent packets. State is in memory: refresh
starts a new mission. The shared state inspector shows each completed handoff.

## Connections and state

`src/core/stageRegistry.js` declares:

`preparation1 → preparation2 → flight → research → transmission`

All stages use `mount(container, gameState, onComplete)` and return cleanup.
The original shared navigation controller controls progression and locks the
destination after Earth. The Earth map reuses builder graphics. Builder's map
remains available but cannot change the mission destination after Earth.

`src/data/equipment.js` adapts the authoritative builder catalogue. Selected IDs
are not renamed. In particular `bennu-ir-spectrometer` is mapped to Exploration's
`infrared` capability through `stageData.researchEquipmentDefinitions`. No test
fixture runs in the main game. The development fixture remains harness-only.

Flight's standalone global controller, canvas, CSS and inputs are isolated in an
iframe. `host.html` reuses its exact page with a base URL and an extra bridge.
The bridge sets and locks the selected destination, then forwards the original
`flightstagecomplete` event. Removing the iframe stops its animation and input
listeners. No synthetic completion or automatic pilot is included in the game.

Exploration writes its usual destination-qualified `scientificDiscoveries`,
`collectedSamples`, action log and resource balances. Transmission's handoff
creates uniquely identified packets for these observations once, without
recollecting data or charging storage again. Each packet retains its source
discovery and explanation. Sending releases only that packet's storage and adds
a receipt; the original scientific result and samples remain intact.

## Resource conventions and limitations

- Battery begins at 100 Wh; storage begins at 100 MB. Exploration retains its
  operating-duration conversion (`watts * 60 / 3600` Wh per observation).
- Transmission retains its original gameplay cost: `ceil(2 + 1.5 * packet MB)`
  energy units, now interpreted as Wh. Its collection and tuning mechanics remain.
- Flight retains its separate 100-unit propellant tank and original restart
  mechanic. It does not reset or refill the scientific battery. Remaining fuel
  and the landing result are recorded in `stageData.flight`.
- The original builder's 15 kg limit applies to scientific payload. A standard
  spacecraft radio (the transmission game's original 5.2 kg high-gain dish,
  6 MB/contact) is platform equipment, not an added scientific instrument.
  Transmission displays actual payload mass plus radio mass against 20.2 kg.
- Large records are split into packets of up to 6 MB, keeping the original
  antenna limit and tuning for each contact. Transmission costs can prevent
  sending every observation. Unsent packets remain in shared state when finishing;
  the game does not secretly refill energy or declare all data transmitted.
- Original battery-reset/failure testing controls are visible only with an
  explicit development fixture. The independent Transmission game and tests
  retain those mechanics. Simulated failure releases only queued packet storage.
- Bennu is the only complete integrated destination: the existing rover game
  implements only Bennu. Other destination data, builder options and original
  flight games are preserved, but the Earth screen prevents entering an incomplete
  route. Wild 2 is absent from the original Flight game and must not be presented
  as a historical surface landing. Adding other routes needs real gameplay work.
- Flight uses original keyboard controls; it has no touch-flight controller.
  Exploration retains its mobile controls. Complete play currently targets desktop.
- Original Flight fonts are requested from Google Fonts; local fallback fonts
  are available when offline.

## Verification

```powershell
npm.cmd test
```

Tests preserve the original scientific, movement and transmission checks and add
equipment mapping, five-stage progression, packet accounting, duplicate handoff
protection and failure-storage checks. Foundation assertions were updated for the
two newly registered stages. Browser checks should additionally exercise the
full mission, original builder interaction, Flight thrust and landing, installed
instrument restrictions, Exploration inspection/actions and the signal console.

Integration verification completed: all 33 automated tests pass. A Chrome browser
scenario completed all five stages using the real builder, Flight thrust and
landing sequence, keyboard rover driving, free inspection, spectrometer action,
and both packet transmissions through the tuning console. The landing test placed
the ship in a controlled valid approach envelope; it did not replace the landing
mechanic or add a skip to the game. No uncaught browser exceptions occurred.
The final state retained the original observation and loadout, recorded all five
completed stages, and held 77.75 Wh and 100 MB free after sending a 12 MB finding.
Byte comparison verified 30 imported builder-internal, Exploration and original
Flight files match their source-branch versions exactly.

Independent tests remain at `/dev/stage.html?stage=research&destination=bennu`,
`?stage=preparation2&destination=bennu` or `?stage=transmission&destination=bennu`.
The preserved standalone flight is at `/src/stages/flight/original/index.html`.
