# Outbound: Asteroid Flight

A playable, browser-based flight-stage prototype for a larger asteroid exploration game. The stage begins at the handoff from Preparation Part 2, carries the selected destination through flight and landing, deploys a rover, and emits a result for the Research stage.

## Play

Open `index.html` in a modern browser. No package install, build step, or server is required.

- `W` / `S`: accelerate / reverse
- `A` / `D`: yaw
- `Q` / `E`: roll
- `Space` / `Left Ctrl`: climb / descend
- `Shift`: temporary boost; uses extra fuel
- Mouse: look around
- `F`: attempt landing when inside the landing envelope
- After touchdown, select **Deploy rover**; use `W` / `S` and `A` / `D` to drive, then press `E` near each marked site to survey
- `↻`: restart the stage

Movement has inertia: releasing thrust does not stop the spacecraft. Land with speed below 40 m/s, altitude below 65 m, and a suitable approach heading. Failed attempts explain which condition needs adjustment.

## Stage integration

`src/stages.js` is the central progression contract. Its stage order is Earth, Preparation Part 1, Preparation Part 2, Flight, Research. It does not inspect branch names. The host game should record completed stage IDs and the selected destination centrally, then call `FlightStage.canEnter(context)` with `completedStages` containing `preparation-2` and a valid `destinationId`.

The standalone page supplies that handoff for local play; it does not implement or replace either preparation stage. The flight stage returns `destinationId`, `landed`, `roverDeployed`, `surveys`, and `nextStage: 'research'` through `FlightStage.getResult()` and the `flightstagecomplete` event. All five destinations are selectable from the start.

The stage boundary is `window.FlightStage`; simulation modules are split by responsibility under `src/`: destination data, stage order, ship physics, scene rendering, mission state, HUD, and input/render loop. A future host can mount these modules in a shared shell while keeping its own visual design and mechanics for other stages.

## Notes

This is a 2D canvas game with a projected depth/altitude axis, not a 3D simulator. Mission facts are concise gameplay context and should be checked against primary mission sources before public educational release. Engine audio is not included in this first playable slice.