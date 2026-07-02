#!/usr/bin/env sh
set -eu

run_pnpm() {
  if [ "${USE_DIRECT_PNPM:-0}" = "1" ]; then
    pnpm "$@"
    return
  fi

  if command -v pnpm >/dev/null 2>&1 && [ "$(pnpm --version)" = "10.5.2" ]; then
    pnpm "$@"
    return
  fi

  corepack pnpm "$@"
}

run_pnpm check

if [ "$(uname -s)" = "Linux" ]; then
  run_pnpm --filter @agentic-cookbook/tutorials-web exec playwright install --with-deps chromium
else
  run_pnpm --filter @agentic-cookbook/tutorials-web exec playwright install chromium
fi

run_pnpm test:ui
