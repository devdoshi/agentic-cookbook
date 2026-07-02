#!/usr/bin/env sh
set -eu

log_file=/tmp/agentic-cookbook-demo.log
pid_file=/tmp/agentic-cookbook-demo.pid

run_pnpm() {
  if command -v pnpm >/dev/null 2>&1 && [ "$(pnpm --version)" = "10.5.2" ]; then
    pnpm "$@"
    return
  fi

  corepack pnpm "$@"
}

if [ -f "$pid_file" ] && kill -0 "$(cat "$pid_file")" >/dev/null 2>&1; then
  printf 'Agentic Cookbook demo is already running on port 5173.\n'
else
  printf 'Starting Agentic Cookbook demo on port 5173...\n'
  (run_pnpm demo >"$log_file" 2>&1 & echo "$!" >"$pid_file")
fi

cat <<'EOF'

Open the forwarded port 5173 to see durable execution in action.

First clicks:
1. Open /recipes/scatter-gather-basic.
2. Pick Temporal, then Run recipe.
3. Pick AWS Durable, then Run recipe.
4. Open /scenarios and run the recipe vectors for each runtime.

Useful commands:
- pnpm run test:local
- pnpm run verify:devcontainer

Demo server log:
- /tmp/agentic-cookbook-demo.log

EOF
