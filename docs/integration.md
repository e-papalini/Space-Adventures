# Integration contract · version 1

Every stage exports `mount(container, gameState, onComplete)` from its `index.js`.
Render only inside `container`. The state is a private structured clone: edit it
locally and call `onComplete(gameState)` once the agreed gameplay is complete.
Return a synchronous cleanup function that removes listeners, timers, animation
frames, audio, and other resources. Do not change pages or import another stage
to advance. The core decides the next stage. No framework or bundler is required.

The initial stage files are integration placeholders, not proposed gameplay.
Replace their implementation freely. Shared helpers in `src/ui/` are optional.
Scope CSS under `.stage-preparation1`, `.stage-preparation2`, `.stage-research`,
or a similarly unique root for a new stage. Avoid selectors targeting `body`,
all buttons, or another stage. Put assets in your assigned assets folder; use
`new URL('../../../assets/research/example.png', import.meta.url).href` in stage
JavaScript to keep paths valid under GitHub Pages subdirectories.

## State ownership

| Field | Contract |
| --- | --- |
| `schemaVersion` | Shared contract version; currently 1 |
| `selectedDestinationId` | null initially; Preparation 1 selects a catalogue ID; fixed after that stage |
| `currentStage`, `currentLocation`, `completedStages`, `missionStatus` | Core-owned; edits returned by stages cannot skip progression |
| `selectedEquipment` | Array of stable equipment ID strings; initially empty |
| `remainingEnergy`, `remainingStorage` | Non-negative finite numbers; initially 100 prototype units each |
| `collectedSamples` | Array; recommended entry `{ destinationId, materialId, quantity }` |
| `scientificDiscoveries` | Array; recommended entry `{ destinationId, discoveryId }` |
| `stageData` | Stage-owned namespaces, e.g. `stageData.research = { scannedSites: [] }` |

Resource costs, equipment IDs, sample quantities, and scoring are not defined
gameplay yet. Coordinate meanings before other stages consume them. Keep state
JSON-compatible: no DOM nodes, functions, Maps, or cyclic references. Preserve
other stages' fields when calling completion. State lives in memory; refreshing
starts over. Persistence and migrations can be added later without committing to
a save format now. Increment the version and document migrations if shared field
meanings change. Prefer additive fields and retain existing IDs to avoid breaking
stages. Reset through the mission-completion button clears the mission.

## Registry and expansion

`src/core/stageRegistry.js` is the ordered stage list. Each entry contains a unique
`id`, a `title`, a `mount` function, a `location` (`earth` or `destination`), an
optional stylesheet URL, and `requiresDestination`. Completing one stage loads
the next registered entry; the final entry completes the mission. The current
configuration enforces both preparation stages on Earth before Research.

To add a stage, create its folder and assets, export the contract, then coordinate
one import and entry in the registry. The shell, progress label, and development
harness read the registry. No navigation rewrite is needed. Removing or reordering
entries changes the progression deliberately; preserve the mandatory preparation
sequence unless the team explicitly changes that requirement.

To add a destination, append an entry in `src/data/destinations.js` with a stable
unique ID and the same fields. All selections derive from this list. Material and
discovery IDs are unique within a destination; pair them with the destination ID
in state. The catalogue is frozen: read it, do not mutate it. Cite sources and
distinguish observation from inference. Laboratory findings are not necessarily
things an instrument can identify directly on a surface. Organics and amino acids
are never proof of life. Mission date ranges refer to the original exploration or
sample-return phase, not the end of all spacecraft operations.

## Independent testing

Serve the repository and visit `/dev/stage.html`. Choose a stage and any destination.
This separate fixture sets up predecessor completion and lets you inspect the
state returned through `onComplete`. It deliberately bypasses the main flow for
development only. Adjust local fixture data in `dev/stage.js` if your stage needs
equipment or discoveries; coordinate shared fixture changes. Always also test the
stage through `index.html` to check integration.

## Branch ownership and merging

Create `preparation-1`, `preparation-2`, and `research` from the merged foundation
on `main`. Additional feature or stage branches can be created at any time.
Each teammate owns their `src/stages/<stage>/` and `assets/<stage>/` folders.
Keep shared changes in small coordinated pull requests: `src/core/`, `src/data/`,
`src/ui/`, `src/main.js`, global styles, the shell, tests, and this contract.
These files can evolve; they are not permanently locked.

Bring current `main` into your branch before requesting a merge. Describe any
shared-state additions and test your stage in the harness and full sequence.
Review conflicts together rather than replacing another teammate's files.
Merge one stage PR at a time, run `npm test`, and repeat the browser checklist.
Do not commit credentials or generated dependencies. No remote, branch, commit,
or deployment is automatically created by this foundation.
