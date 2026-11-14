# Project Instructions

This repository contains the Outbound asteroid flight stage, designed to run after Preparation Part 2 and hand off to Research after landing, rover deployment, and surface surveys.

- Keep stage order in `src/stages.js`; never infer progression from Git branches.
- The host must provide a completed `preparation-2` stage and a valid destination ID before entering `FlightStage`.
- Keep flight behavior modular: destination data, physics, rendering, mission state, HUD, and input are separate files under `src/`.
- Preserve the standalone `index.html` demo and the `FlightStage.getResult()` integration contract.
- Keep the game dependency-free unless a focused change justifies a library.