import { spawn } from 'node:child_process';
import net from 'node:net';
import process from 'node:process';
import { chromium } from 'playwright';

const serverHost = process.env.UI_SMOKE_HOST ?? '127.0.0.1';
let serverPort = process.env.UI_SMOKE_PORT;
let baseUrl = process.env.UI_SMOKE_BASE_URL;
const timeoutMs = Number(process.env.UI_SMOKE_TIMEOUT_MS ?? 120_000);
const settleMs = Number(process.env.UI_SMOKE_SETTLE_MS ?? 3_000);
const appCwd = new URL('../', import.meta.url);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getAvailablePort = async () =>
  new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.once('error', reject);
    server.listen(0, serverHost, () => {
      const address = server.address();
      server.close(() => {
        if (address && typeof address === 'object') {
          resolve(String(address.port));
          return;
        }

        reject(new Error('Unable to allocate an available UI smoke port'));
      });
    });
  });

const waitForServer = async () => {
  const deadline = Date.now() + timeoutMs;
  let lastError = '';

  while (Date.now() < deadline) {
    try {
      const response = await fetch(baseUrl);
      if (response.ok) {
        return;
      }
      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }

    await sleep(500);
  }

  throw new Error(`Timed out waiting for ${baseUrl}: ${lastError}`);
};

const runCommand = async (command, args, options = {}) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: appCwd,
      env: process.env,
      stdio: 'inherit',
      ...options,
    });

    child.once('error', reject);
    child.once('exit', (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(
        new Error(
          `${command} ${args.join(' ')} exited with ${signal ?? `code ${code}`}`,
        ),
      );
    });
  });

const gotoStablePage = async (page, path) => {
  await page.goto(`${baseUrl}${path}`, { waitUntil: 'domcontentloaded' });
  await page.getByTestId('page-shell').waitFor({ timeout: timeoutMs });
  await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {
    // Vite's dev server can keep a connection open; the explicit settle covers
    // the dependency-optimization reload that matters for these smoke checks.
  });
  await page.waitForTimeout(settleMs);
  await page.getByTestId('page-shell').waitFor({ timeout: timeoutMs });
};

const runRecipeSmoke = async (page, runtime) => {
  console.log(`ui-smoke: recipe runtime=${runtime}`);
  await gotoStablePage(page, '/recipes/scatter-gather-basic');
  await page.getByTestId('recipe-runtime-select').selectOption(runtime);
  await page.getByTestId('recipe-run-button').click();

  const recipeResult = page.getByTestId('recipe-run-result');
  await recipeResult.waitFor({ timeout: timeoutMs });
  await recipeResult
    .getByText('status: complete', { exact: false })
    .waitFor({ timeout: timeoutMs });
  await page.getByTestId('recipe-timeline-panel').waitFor();
  await page.getByTestId('timeline-native-tab-recipe').click();
};

const runScenarioSmoke = async (page, runtime) => {
  console.log(`ui-smoke: scenarios runtime=${runtime}`);
  await gotoStablePage(page, '/scenarios');
  await page.getByTestId('scenario-runtime-select').selectOption(runtime);
  await page
    .getByTestId('scenario-group-select')
    .selectOption('recipe-vectors');
  await page.getByTestId('scenario-run-button').click();

  const scenarioResult = page.getByTestId('scenario-run-result');
  await scenarioResult.waitFor({ timeout: timeoutMs });
  await scenarioResult.getByText('failed: 0').waitFor({ timeout: timeoutMs });
  await page.getByTestId('scenario-table').waitFor();
  await page.getByTestId('scenario-timeline-panel').waitFor();
};

const run = async () => {
  await runCommand('react-router', ['build']);

  serverPort ??= await getAvailablePort();
  baseUrl ??= `http://${serverHost}:${serverPort}`;
  console.log(`ui-smoke: serving ${baseUrl}`);

  const server = spawn('react-router-serve', ['./build/server/index.js'], {
    cwd: appCwd,
    env: {
      ...process.env,
      HOST: serverHost,
      PORT: serverPort,
      NODE_ENV: 'production',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  const serverLogs = [];
  const collectLog = (chunk) => {
    const text = chunk.toString();
    serverLogs.push(text);
    if (serverLogs.length > 80) {
      serverLogs.shift();
    }
    process.stdout.write(text);
  };

  server.stdout.on('data', collectLog);
  server.stderr.on('data', collectLog);

  const stopServer = async () => {
    if (server.exitCode !== null || server.signalCode !== null) {
      return;
    }

    const exited = new Promise((resolve) => server.once('exit', resolve));
    server.kill('SIGTERM');
    const stopped = await Promise.race([
      exited.then(() => true),
      sleep(5_000).then(() => false),
    ]);

    if (!stopped && server.exitCode === null && server.signalCode === null) {
      server.kill('SIGKILL');
      await exited;
    }
  };

  try {
    await waitForServer();

    const browser = await chromium.launch();
    const page = await browser.newPage();

    for (const runtime of ['temporal', 'aws-durable']) {
      await runRecipeSmoke(page, runtime);
      await runScenarioSmoke(page, runtime);
    }

    await browser.close();
  } catch (error) {
    process.stderr.write('\n--- tutorials server logs ---\n');
    process.stderr.write(serverLogs.join(''));
    process.stderr.write('\n--- end tutorials server logs ---\n');
    throw error;
  } finally {
    await stopServer();
  }
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
