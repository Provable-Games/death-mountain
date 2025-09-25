# Repository Guidelines

## Project Structure & Module Organization
Source lives in `src/`. `lib.cairo` wires the modules, while `constants/` stores balance knobs and chain IDs. `models/` defines packed structs and events (for example `models/adventurer/*.cairo`), and `systems/<module>/contracts.cairo` hosts the StarkNet entry points. Shared helpers sit in `utils/`, including the Dojo test scaffolding in `utils/setup_denshokan.cairo`. Deployment and tooling scripts are under `scripts/`, and environment manifests such as `dojo_sepolia.toml` or `manifest_dev.json` describe world configuration. `target/` is generated output; do not edit it manually.

## Build, Test, and Development Commands
Use `scarb build` to compile Sierra and CASM artifacts into `target/dev`. Run `scarb test` for the Cairo unit and integration tests that rely on Dojo’s testing toolkit. `scarb fmt` applies the repository’s formatting profile (`max-line-length = 120`). Deployment helpers include `scripts/deploy_sepolia.sh` or `scripts/deploy_slot.sh`; run them from this directory after exporting the required RPC credentials.

## Coding Style & Naming Conventions
Follow Cairo 2 defaults: four-space indentation, `snake_case` for functions/modules, and `UpperCamelCase` for types. Constants stay in uppercase with underscores. Prefer explicit module imports over wildcards, and keep public interfaces grouped under `#[starknet::interface]` above their `#[dojo::contract]` modules. Always run `scarb fmt` before pushing to ensure consistent ordering (`sort-module-level-items = true`).

## Testing Guidelines
Tests live alongside the code inside `contracts.cairo` modules (`#[test]` functions near the bottom). Use `dojo_cairo_test::spawn_test_world` helpers to provision a world and set expectations with `assert` or `#[should_panic(expected = ...)]`. Name tests with the `test_*` pattern and ensure both success paths and guarded failures are covered. Execute `scarb test` locally and include any reliance on `starknet::testing` utilities when seeding deterministic contexts.

## Commit & Pull Request Guidelines
Match the existing history: concise, present-tense subjects such as `fix client trait calculation`; add context lines if rationale is non-obvious, and append PR numbers in parentheses when applicable. For pull requests, describe the gameplay or contract impact, note required migrations or manifest updates, list manual test commands (`scarb test`, deploy scripts), and link the tracked issue. Screenshots or log excerpts are welcome when behavior changes.

## Deployment & Configuration Tips
Keep profile-specific settings in the corresponding `dojo_*.toml` files and update manifests when new systems or models are introduced. Regenerate SVG or other assets via `scripts/generate_svg.sh` whenever constants affecting visuals change. Verify world permissions in tests using the helpers in `utils/setup_denshokan.cairo` before promoting changes to shared environments.
