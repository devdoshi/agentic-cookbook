import { spawn } from 'node:child_process';
import { mkdir, readdir, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';

const repoRoot = path.resolve(import.meta.dirname, '../../..');
const appDir = path.resolve(import.meta.dirname, '..');
const outputDir = path.resolve(repoRoot, 'docs/videos');
const tempVideoDir = path.resolve(outputDir, '.demo-tmp');
const baseUrl = process.env.DEMO_VIDEO_BASE_URL ?? 'http://127.0.0.1:4183';
const serverPort = process.env.PORT ?? '4183';
const useDirectPnpm = process.env.USE_DIRECT_PNPM === '1';
const pnpmCommand = useDirectPnpm ? 'pnpm' : 'corepack';
const pnpmArgs = useDirectPnpm ? [] : ['pnpm'];

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const runCommand = (command, args, cwd, env = process.env) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env,
      stdio: 'inherit',
    });

    child.on('error', reject);
    child.on('exit', (code, signal) => {
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

const commandExists = (command) =>
  new Promise((resolve) => {
    const child = spawn('sh', ['-c', `command -v ${command} >/dev/null 2>&1`], {
      stdio: 'ignore',
    });
    child.on('exit', (code) => resolve(code === 0));
    child.on('error', () => resolve(false));
  });

const waitForServer = async () => {
  const startedAt = Date.now();
  const timeoutMs = 45_000;

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(baseUrl);
      if (response.ok) {
        return;
      }
    } catch {
      // ignore while server boots
    }

    await wait(500);
  }

  throw new Error(`timed out waiting for server at ${baseUrl}`);
};

const startServer = () => {
  const child = spawn('react-router-serve', ['./build/server/index.js'], {
    cwd: appDir,
    env: {
      ...process.env,
      HOST: '127.0.0.1',
      PORT: serverPort,
      NODE_ENV: 'production',
    },
    detached: true,
    stdio: 'ignore',
  });

  child.unref();
  return child;
};

const clearPreviousDemoMedia = async () => {
  await mkdir(outputDir, { recursive: true });
  await rm(tempVideoDir, { recursive: true, force: true });
  await mkdir(tempVideoDir, { recursive: true });

  const entries = await readdir(outputDir, { withFileTypes: true });
  await Promise.all(
    entries
      .filter(
        (entry) =>
          entry.isFile() &&
          (entry.name.startsWith('demo-') ||
            entry.name === 'demo-manifest.json'),
      )
      .map((entry) => rm(path.resolve(outputDir, entry.name), { force: true })),
  );
};

const selectRuntimeAndRunRecipe = async (page, runtime) => {
  await page.getByTestId('recipe-runtime-select').selectOption(runtime);
  await wait(900);
  await page.getByTestId('recipe-run-button').click();
  const result = page.getByTestId('recipe-run-result');
  await result.waitFor({ timeout: 120_000 });
  await result.getByText('status: complete').waitFor({ timeout: 120_000 });
  await wait(1400);
};

const runScenarioGroup = async (page, runtime) => {
  await page.getByTestId('scenario-runtime-select').selectOption(runtime);
  await wait(900);
  await page
    .getByTestId('scenario-group-select')
    .selectOption('recipe-vectors');
  await wait(900);
  await page.getByTestId('scenario-run-button').click();
  const result = page.getByTestId('scenario-run-result');
  await result.waitFor({ timeout: 120_000 });
  await result.getByText('failed: 0').waitFor({ timeout: 120_000 });
  await page.getByTestId('scenario-table').waitFor({ timeout: 120_000 });
  await wait(1400);
};

const captureDemo = async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    baseURL: baseUrl,
    viewport: { width: 1440, height: 900 },
    recordVideo: {
      dir: tempVideoDir,
      size: { width: 1440, height: 900 },
    },
  });
  const page = await context.newPage();

  await page.goto('/recipes/scatter-gather-basic', {
    waitUntil: 'domcontentloaded',
  });
  await page.getByTestId('page-shell').waitFor({ timeout: 45_000 });
  await wait(1500);
  await page.screenshot({
    path: path.resolve(outputDir, 'demo-recipe-ready.png'),
    fullPage: true,
  });

  await selectRuntimeAndRunRecipe(page, 'temporal');
  await page.screenshot({
    path: path.resolve(outputDir, 'demo-recipe-temporal.png'),
    fullPage: true,
  });
  await page.getByTestId('timeline-native-tab-recipe').click();
  await wait(1200);

  await selectRuntimeAndRunRecipe(page, 'aws-durable');
  await page.screenshot({
    path: path.resolve(outputDir, 'demo-recipe-aws-durable.png'),
    fullPage: true,
  });
  await page.getByTestId('timeline-normalized-tab-recipe').click();
  await wait(1200);

  await page.goto('/scenarios', { waitUntil: 'domcontentloaded' });
  await page.getByTestId('page-shell').waitFor({ timeout: 45_000 });
  await wait(1300);

  await runScenarioGroup(page, 'temporal');
  await page.screenshot({
    path: path.resolve(outputDir, 'demo-scenarios-temporal.png'),
    fullPage: true,
  });

  await runScenarioGroup(page, 'aws-durable');
  await page.screenshot({
    path: path.resolve(outputDir, 'demo-scenarios-aws-durable.png'),
    fullPage: true,
  });
  await page.getByTestId('timeline-native-tab-scenario').click();
  await wait(1200);
  await page.getByTestId('timeline-normalized-tab-scenario').click();
  await wait(1600);

  const video = page.video();
  if (!video) {
    throw new Error('video capture unavailable');
  }

  await context.close();
  const recordedPath = await video.path();
  const videoPath = path.resolve(outputDir, 'demo-recipes-and-scenarios.webm');
  await rename(recordedPath, videoPath);
  await browser.close();

  return {
    video: 'demo-recipes-and-scenarios.webm',
    gif: 'demo-recipes-and-scenarios.gif',
    screenshots: [
      'demo-recipe-ready.png',
      'demo-recipe-temporal.png',
      'demo-recipe-aws-durable.png',
      'demo-scenarios-temporal.png',
      'demo-scenarios-aws-durable.png',
    ],
  };
};

const main = async () => {
  await clearPreviousDemoMedia();
  await runCommand(pnpmCommand, [...pnpmArgs, 'build'], appDir);

  const server = startServer();

  try {
    await waitForServer();
    const manifest = await captureDemo();
    if (await commandExists('ffmpeg')) {
      await runCommand(
        'ffmpeg',
        [
          '-y',
          '-i',
          path.resolve(outputDir, manifest.video),
          '-vf',
          'fps=8,scale=960:-1:flags=lanczos,split[s0][s1];[s0]palettegen=stats_mode=diff[p];[s1][p]paletteuse=dither=bayer:bayer_scale=5',
          '-loop',
          '0',
          path.resolve(outputDir, manifest.gif),
        ],
        repoRoot,
      );
    } else {
      console.warn('ffmpeg not found; skipped README GIF generation');
    }

    await writeFile(
      path.resolve(outputDir, 'demo-manifest.json'),
      JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          baseUrl,
          ...manifest,
        },
        null,
        2,
      ),
      'utf8',
    );
    console.log(`recorded demo media into ${outputDir}`);
  } finally {
    if (server.pid) {
      try {
        process.kill(-server.pid, 'SIGTERM');
      } catch {
        try {
          process.kill(server.pid, 'SIGTERM');
        } catch {
          // ignore cleanup errors
        }
      }
    }

    await rm(tempVideoDir, { recursive: true, force: true });
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
