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

### Bennu Research prototype

Research currently supports Bennu only. Other destinations display an explicit
unsupported-prototype message. Preparation and navigation are unchanged.
The main flow currently provides no installed equipment; test playable Research
at `/dev/stage.html?stage=research&destination=bennu`.

`dev/researchFixture.js` is a temporary harness-only loadout injection. Research
never imports it or fills an empty `selectedEquipment`. Provisional IDs and
default instrument definitions live in `src/stages/research/config.js`.
The fixture requires an explicit `{ freshDevelopmentState: true }` third argument
from the development harness. It refuses nonempty selections, supplied catalogues
(even empty catalogues), and states that already received a fixture. It cannot
run implicitly during Research or replace a real loadout. Both Preparation stages
are currently placeholders for equipment: neither selects instruments. The team
still needs to agree which stage owns selection, stable equipment IDs, catalogue
delivery, and the meaning of resource units. No Preparation code is changed here.
To integrate real Preparation definitions, replace the default catalogue or pass
JSON-compatible definitions in `stageData.researchEquipmentDefinitions` with
`{ id, name, kind, watts, mb }`. Allowed Bennu kinds are `camera`, `infrared`,
`lidar`, and `sample`. `selectedEquipment` must contain the matching real IDs.
Then remove the development fixture injection. This adapter changes no gameplay.

For this prototype, one energy unit is one Wh and one storage unit is one MB.
Each action represents 60 simulated seconds, costing `watts * 60 / 3600` Wh
and the configured MB. Existing balances are retained. Movement and returns have
no energy cost. These are gameplay conventions, not historical specifications.
Other stages must agree to these units before their resource gameplay is added.

`stageData.research.bennu` stores position, cumulative trip distance, actions,
return count, completion and mission timing/results. The map is now 1800 × 1200
game metres and repeats in all directions. There is no distance cap, warning or
automatic recall. `tripDistance` records actual movement across seams; it does not
count the wrap as a teleport across the map. Voluntary animated returns remain.
Returns reset position and trip distance, retaining tasks, discoveries, samples,
and balances. Complete any one installed-instrument task to end the mission early.
The five-minute timer starts at Start Exploring, continues across returns and
background tabs, and ends in a results overlay. Expiry preserves partial results;
it never fills in incomplete tasks. Only the results button calls `onComplete`.
Set `stageData.researchSettings.missionDurationSeconds` before mount to configure
the duration (default `bennu.missionDurationSeconds = 300` in `config.js`). The
timer and phase live in `stageData.research.bennu.mission`. `completed` means the
required science objective was achieved; core progression remains core-owned.
Optional equipment definition `singleUse: true` is enforced and shown in the HUD.
The existing 60-second action duration is a resource-cost convention; the short
1.4-second operation animation is presentation time, not 60 seconds on the clock.
Cancelled operations (recall or time expiry) do not consume resources or create
findings. Successful operations revalidate equipment, proximity and resources.

Research presentation is separated into `world.js` (cached procedural terrain,
overhead rover, camera, effects and minimap), `style.css` (scoped HUD),
`controls.js` (keyboard and multitouch), `motion.js` (acceleration/rotation),
`mission.js` (clock and phase), and the existing `model.js` (science/resources).
`topology.js` provides shared wraparound distances for motion, camera tracking,
collisions, click hit tests, effects and nearby sites. The rover keeps velocity
and heading across edges. The flag and site IDs remain fixed; repeating tiles
are views of the same places, not new sites or reset tasks. This is a simplified
game map, not a scientific model of Bennu's shape.

The briefing introduces only installed tools, with short explanations and examples.
At a site, E or a click/tap first opens a free information panel. It does not spend
resources or reveal the finding. Recommended installed tools glow in the toolbar;
missing tools are explained without adding them. Choose a tool and press E or the
action button again to investigate. The panel closes with × or when driving away.
All stage listeners, animation frames and resize observers are cleaned up.
Discoveries are destination-qualified simulated observations, not laboratory
identifications. Unanalysed samples use `materialId: 'unanalysed-regolith'`.
The rover is explicitly an educational abstraction of spacecraft exploration.
State remains in memory; refreshing still starts over.

Manual checks: wait on the briefing and verify 05:00 is unchanged; begin and
drive without clicking the canvas. WASD/arrows drive, 1–4 select, E looks closer
then uses a tool. Hold two touch-pad directions for diagonal driving. Inspect and
investigate all site types; try an inappropriate instrument; return voluntarily
after an action and compare balances and log. Cross each edge in both directions,
including corners; keep driving a full circuit and find the same red flag again.
Check that findings, tasks, resource balances and the mission clock continue.
Finish a task and inspect the returned
state. Check the one-minute warning and final-30-second urgency, then expiry with
unfinished tasks. Test `&equipment=camera` for partial tasks and `&equipment=` for no equipment.
Photography alone completes with three distinct geological images (60 MB).

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
