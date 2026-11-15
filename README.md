# Space Adventures
NASA Space Apps 2026 Hackathon Game

Browser game inspired by NASA, ESA, and JAXA missions. The `integration-test`
branch connects the existing destination map, rover builder, spacecraft flight,
Bennu exploration and data-transmission games through the shared controller.
Bennu is the complete playable route; other destinations await exploration integration.

See [the gameplay integration guide](docs/gameplay-integration.md) for controls,
source-branch provenance, state handoffs, resource rules and remaining limitations.

## Run locally in VS Code

Open this folder in VS Code. From a terminal in the repository root run:

```sh
python -m http.server 8000 --bind 127.0.0.1
```

Open http://localhost:8000 in a browser. Stop the server with Ctrl+C.
Alternatively use the VS Code Live Server extension on `index.html`.
Do not open the HTML with `file://`: JavaScript modules need HTTP.
No installation or build is needed. A modern browser is required.

## Play the complete mission

1. Start a mission and choose Bennu on the Earth map.
2. Begin Rover Building, install at least the infrared spectrometer, and authorize
   a valid payload. All original mass, power, data and timer rules apply.
3. Fly using WASD, Q/E, Space/Ctrl and Shift. Reach the 450 m landing zone and stay
   there for four seconds. Leaving resets the countdown. Landing then starts by itself.
4. Landing automatically opens Exploration. Start Exploring, drive to gold markers,
   inspect with E, choose an installed tool, then use E again to investigate.
5. Complete one available task and end early, or let the five-minute timer expire.
   Continue from the results screen to Data Transmission.
6. Start the onboard preparation activity, pick a real finding and match its
   installed tool. Then open a prepared packet's console and start lining up the
   waves. Accuracy updates live; frequency 1.14 / phase 35 degrees gives 100%.
   Send at 50% or better and repeat as resources permit. Review the stage rewards.
7. Finish the mission and review the score breakdown and saved total. Return to
   Earth to replay; mission resources reset, but points and best scores persist.
   Other level unlocks are recorded; unfinished missions stay unavailable.
8. Independent stage testing remains at http://localhost:8000/dev/stage.html.

With Node.js 20 or newer installed, run the dependency-free automated checks:

```sh
npm test
```

Tests cover the foundation, rover movement, timer, science and resource rules,
equipment integration, packet handoffs, transmission, progression and cleanup.
Player points, best scores and completed mission history now persist locally.
The active expedition itself still starts over on refresh. See the
[progression rules and destination expansion plan](docs/progression-plan.md).
The current landing and relay rules are in [the mini-game guide](docs/landing-transmission.md).

## Team integration

Read [the integration contract](docs/integration.md) and the gameplay integration guide.
The flow is configured in `src/core/stageRegistry.js`. Shared science and sources
live in `src/data/destinations.js`; stages use the same data for every destination.
Stage owners work in their stage and asset folders. Shared changes are coordinated
through small pull requests. More branches and stages can be added at any time.

## GitHub and publishing

Review the foundation files in VS Code Source Control, commit them, and push to
the team's repository. Merge the foundation into `main` before teammates branch
from it. Each stage can then be merged through its own pull request.

For a public demo, publish these static files using GitHub Pages (repository
Settings → Pages → Deploy from a branch → `main` → `/ (root)`) or another static
host. No build or secrets are required. Relative module and asset paths support
a repository subdirectory URL. Test the published URL with the browser checklist.
