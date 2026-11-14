# Space Adventures
NASA Space Apps 2026 Hackathon Game

Shared foundation for a browser game inspired by NASA, ESA, and JAXA missions.
Stage gameplay is intentionally left to the three stage owners. The temporary
screens exercise integration only; they are not the final design.

## Run locally in VS Code

Open this folder in VS Code. From a terminal in the repository root run:

```sh
python -m http.server 8000 --bind 127.0.0.1
```

Open http://localhost:8000 in a browser. Stop the server with Ctrl+C.
Alternatively use the VS Code Live Server extension on `index.html`.
Do not open the HTML with `file://`: JavaScript modules need HTTP.
No installation or build is needed. A modern browser is required.

## Verify the foundation

1. Start a test mission. All five destinations are available.
2. Choose one in Preparation Part 1; completion is disabled until selection.
3. Simulate completion. Preparation Part 2 still shows Earth and your destination.
4. Complete Preparation Part 2. Research shows the selected destination as location.
5. Expand **Inspect shared state** to check preserved destination, resources, and progress.
6. Finish Research, return to Earth, and choose another destination. State is reset.
7. Repeat with each destination. Check the browser developer console for errors.
8. Test a stage independently at http://localhost:8000/dev/stage.html.

With Node.js 20 or newer installed, run the dependency-free automated checks:

```sh
npm test
```

Tests cover destination data, mandatory progression, state preservation, rejected
invalid updates, replay, a future stage, callback safety, and cleanup.
Refresh intentionally resets this prototype; saving is not yet implemented.

## Team integration

Read [the integration contract](docs/integration.md) before replacing a placeholder.
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
