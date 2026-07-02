# Runnable Workspaces

This repo is a durable execution cookbook, not just a React app or a devcontainer example. It is for comparing runtime semantics by running the same agentic workflow recipes and scenarios across adapters.

A runnable shared workspace must support the full recipe and scenario loop:

- author workflow recipes in `@agentic-cookbook/workflow-spec`,
- execute the same recipe inputs through multiple durable runtime adapters,
- compare canonical `WorkflowOutcome` values across runtimes,
- inspect normalized traces and runtime-native histories in the tutorials UI,
- leave room for future runtime tracks identified in the durable execution research.

The checked-in Dev Container at `.devcontainer/devcontainer.json` is the primary sharing contract because it is portable across GitHub Codespaces, Ona, VS Code Dev Containers, DevPod, and other Dev Container hosts.

## Recommendation

Use Dev Containers as the shared environment definition, then choose a host by audience:

- GitHub Codespaces for public GitHub users who want the easiest browser-based path.
- Ona for teams that previously expected Gitpod-style cloud development environments or want hosted development environments outside Codespaces.
- VS Code Dev Containers for contributors who want the same environment locally with Docker.
- DevPod for contributors who want the same environment on local Docker, a remote VM, Kubernetes, or another provider.

Do not add `.gitpod.yml` as the main path. Gitpod Classic is no longer the right target; Ona uses `devcontainer.json` for environment configuration.

## What Must Work

The minimum runnable workspace is defined by the current runtime matrix:

- Temporal TypeScript local harness in `apps/temporal-harness`.
- AWS Lambda durable functions local test harness in `apps/aws-durable-harness`.
- Shared scenarios in `@agentic-cookbook/test-kit`.
- Shared recipes and canonical result types in `@agentic-cookbook/workflow-spec`.
- Tutorials UI and interactive scenario runner in `apps/tutorials-web`.

Core validation commands:

```bash
pnpm run test:durable
pnpm run test:temporal
pnpm run test:local
pnpm check
```

Interactive runtime exploration:

```bash
pnpm demo
```

Then open the forwarded `5173` port and use:

- `/recipes/scatter-gather-basic`
- `/recipes/scatter-gather-ai-complete`
- `/recipes/scatter-gather-quorum-timeout`
- `/scenarios`
- `/runtime/semantics`

## Why This Matters

The cookbook teaches durable execution semantics by running the same scenario plan through different runtime adapters. The current scenarios cover:

- recipe vectors and expected statuses,
- determinism checks,
- duplicate-ID validation failures,
- simulated task failures,
- timeout and partial-completion behavior.

The tutorials UI also exposes normalized trace replay, in-memory OpenTelemetry spans, and runtime-native history tabs. A cloud workspace that only starts the web app is insufficient if it cannot also run the Temporal and AWS durable harness tests.

## Current Runtime Caveats

Temporal tests use `@temporalio/testing`. By default the harness creates an ephemeral local Temporal test server. It can also connect to an existing server:

```bash
TEMPORAL_ADDRESS=127.0.0.1:7233 pnpm run test:temporal
```

If a workspace host blocks the Temporal test server binary or process model, use an existing Temporal server and set `TEMPORAL_ADDRESS`.

The AWS durable harness uses `@aws/durable-execution-sdk-js-testing` and does not require cloud credentials for the current local scenario tests.

Duplicate task IDs intentionally fail during validation. The Temporal adapter normalizes this as a non-retryable workflow failure so shared error scenarios stay bounded.

## Future Runtime Tracks

Recent durable execution research in this repo points to additional runtime candidates:

- DBOS TypeScript as the next likely implementation candidate.
- Cloudflare Workflows after DBOS for edge/serverless durable execution.
- Rivet Actors / Workflows as a durable actor and agent-runtime track.
- Restate as a spike candidate for durable services and version-pinned execution.

That roadmap affects workspace design. The Dev Container should remain the portable baseline, but future runtime tracks may add optional services:

- DBOS likely introduces a Postgres-backed local dependency.
- Cloudflare Workflows likely introduces Wrangler and Worker-style local emulation.
- Restate may require a Restate server, possibly through Docker or Testcontainers.
- Actor/runtime tracks may need additional local ports and service startup commands.

Prefer adding those as optional documented layers or separate Dev Container compose services only when the runtime adapter lands. Keep the default workspace able to run the current Temporal and AWS parity suite without cloud credentials.

## What the Dev Container Provides Today

- Node 22 on Debian Bookworm.
- pnpm 10.5.2 through Corepack.
- `pnpm install --frozen-lockfile` on first create.
- Port forwarding for the tutorials web app and scenario runner on port `5173`.
- Container-managed volumes for `node_modules` and the pnpm store, so macOS or host-mounted dependency folders do not break installs.
- VS Code recommendations for Biome and Vitest.
- A suggested 4 vCPU / 8 GB RAM / 16 GB disk workspace for smoother harness tests.

## GitHub Codespaces

Fast path:

1. Open [the Codespaces launcher](https://codespaces.new/devdoshi/agentic-cookbook?quickstart=1).
2. Create the codespace on `main`.
3. Wait for the Dev Container setup to finish.
4. Open the forwarded `5173` port.
5. Visit `/recipes/scatter-gather-basic`.
6. Click **Run recipe** with `temporal`, then switch to `aws-durable` and run it again.
7. Visit `/scenarios`, run `recipe-vectors`, and compare traces.

The Dev Container runs `scripts/start-demo-workspace.sh` on attach, which starts:

```bash
pnpm demo
```

If the browser does not open automatically, use the Codespaces **Ports** tab and open `5173`.

To validate the durable runtime harnesses directly:

```bash
pnpm run test:local
```

To restart the tutorials and scenario UI yourself:

```bash
pnpm demo
```

If Temporal local test server startup fails in Codespaces, run a Temporal server separately and set `TEMPORAL_ADDRESS`.

## Ona

Ona is the current successor to Gitpod for this use case. Create an environment from the GitHub repository and let Ona detect `.devcontainer/devcontainer.json`.

After the install step:

```bash
pnpm run test:local
pnpm demo
```

Use Ona recovery mode if the Dev Container build fails. For this repo, the first thing to inspect is whether Node, pnpm, and the local Temporal test server can start correctly.

## VS Code Dev Containers

1. Install Docker Desktop or another Docker-compatible runtime.
2. Install the VS Code **Dev Containers** extension.
3. Open this repo in VS Code.
4. Run **Dev Containers: Reopen in Container** from the command palette.
5. Validate the durable runtime suite:

```bash
pnpm run test:local
```

6. Start the tutorials UI:

```bash
pnpm demo
```

The app will be available through the forwarded `5173` port.

## DevPod

DevPod can run the same Dev Container locally, on a remote machine, in Kubernetes, or on a cloud VM through providers.

Example:

```bash
devpod up github.com/YOUR_ORG/agentic-cookbook
```

After the workspace starts:

```bash
pnpm run test:local
pnpm demo
```

DevPod is a good fit if future runtime tracks need stronger control over the backing machine, Docker availability, or adjacent local services.

## Local Fallback

Use this when you do not want a containerized workspace:

```bash
corepack enable
corepack prepare pnpm@10.5.2 --activate
pnpm install
pnpm run test:local
pnpm check
pnpm demo
```

## Docker CI Image

The repo also includes `Dockerfile.ci` for repeatable non-interactive checks:

```bash
pnpm run ci:docker
```

Use this for validation, not as the primary interactive development environment. The Dev Container is better for sharing a ready-to-code workspace because it includes editor, port-forwarding, lifecycle metadata, and a path to future runtime services.

## Maintenance Notes

- Keep `packageManager` in `package.json`, `Dockerfile.ci`, and `.devcontainer/devcontainer.json` on the same pnpm version.
- Keep the Dev Container on the same Node major as `package.json` engines.
- Before claiming a workspace host is supported, run both `pnpm run test:durable` and `pnpm run test:temporal`.
- Keep Dev Container dependencies on container volumes rather than the host bind mount.
- Add future runtime dependencies only when their adapter exists and the recipe/scenario contract is clear.
- Prefer optional service layers for future DBOS, Cloudflare, Rivet, or Restate work so the current beginner path stays small.
- Rebuild the container after changing `.devcontainer/devcontainer.json`.

## Repo References

- [`docs/runtime/semantics-matrix.md`](runtime/semantics-matrix.md)
- [`docs/scenarios/durable-execution.md`](scenarios/durable-execution.md)
- [`docs/scenarios/scenario-authoring.md`](scenarios/scenario-authoring.md)
- [`docs/roadmap/durable-execution-platform-research-2026-06-30.md`](roadmap/durable-execution-platform-research-2026-06-30.md)

## External References

- [Development Containers supporting tools and services](https://containers.dev/supporting)
- [GitHub Codespaces dev container introduction](https://docs.github.com/en/codespaces/setting-up-your-project-for-codespaces/adding-a-dev-container-configuration/introduction-to-dev-containers)
- [Ona Dev Container configuration](https://ona.com/docs/ona/configuration/devcontainer/overview)
- [Ona migration from Gitpod Classic to Dev Container](https://ona.com/stories/gitpod-classic-payg-sunset)
- [DevPod devcontainer.json docs](https://devpod.sh/docs/developing-in-workspaces/devcontainer-json)
