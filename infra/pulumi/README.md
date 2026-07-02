# Pulumi Infrastructure Track

This folder hosts infrastructure-as-code for deploying cookbook workflows and tutorial environments.

## Deployment goals

- Reproducible deployment path for each runtime recipe.
- Shared baseline for logs, metrics, and environment config.
- Tutorial-friendly stacks that map directly to docs pages.

## Proposed structure

- `infra/pulumi/components/`
  - reusable building blocks (IAM, queues, networking, observability)
- `infra/pulumi/stacks/aws-durable/`
  - Lambda durable workflow deployment stacks
- `infra/pulumi/stacks/temporal/`
  - Temporal deployment options (self-hosted/dev-friendly baseline)
- `infra/pulumi/examples/`
  - minimal "hello world" end-to-end deploys aligned to tutorials

## First delivery milestone

1. AWS durable hello-world stack:
   - Lambda function(s)
   - IAM role/policies
   - log groups
2. Temporal dev stack:
   - local-friendly deployment baseline
   - namespace/task-queue bootstrap notes
3. Shared outputs for tutorials:
   - endpoint URLs
   - workflow IDs/task queues
   - invocation commands

## Curriculum coupling

Each stack must reference the matching tutorial page and recipe doc:
- Getting Started
- Hello World
- Recipe-specific deployment walkthrough

## Guardrails

- Keep stack inputs explicit and typed.
- Default to least-privilege IAM policies.
- Include `destroy`/cleanup instructions in every stack README.
