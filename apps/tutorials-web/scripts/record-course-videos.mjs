import { spawn } from 'node:child_process';
import {
  copyFile,
  mkdir,
  readdir,
  rename,
  rm,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';

const repoRoot = path.resolve(import.meta.dirname, '../../..');
const appDir = path.resolve(import.meta.dirname, '..');
const outputDir = path.resolve(repoRoot, 'docs/videos');
const tempVideoDir = path.resolve(outputDir, '.tmp');
const baseUrl = process.env.COURSE_VIDEO_BASE_URL ?? 'http://127.0.0.1:4173';
const serverPort = process.env.PORT ?? '4173';
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
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(
        new Error(`${command} ${args.join(' ')} exited with code ${code}`),
      );
    });
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

const scrollDown = async (page, steps = 6, delta = 420, pauseMs = 700) => {
  for (let i = 0; i < steps; i += 1) {
    await page.mouse.wheel(0, delta);
    await wait(pauseMs);
  }
};

const scrollToTop = async (page) => {
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  await wait(1000);
};

const runRecipeWalkthrough = async (page, options) => {
  await page.getByTestId('recipe-runtime-select').selectOption(options.runtime);
  await wait(1000);
  if (options.presetId) {
    await page
      .getByTestId('recipe-preset-select')
      .selectOption(options.presetId);
    await wait(1000);
  }

  const editor = page.getByTestId('recipe-input-json');
  await editor.click();
  await editor.press('ControlOrMeta+End');
  await wait(300);
  await editor.type(' ');
  await editor.press('Backspace');
  await wait(500);

  await page.getByTestId('recipe-run-button').click();
  await page.getByTestId('recipe-run-result').waitFor({ timeout: 120_000 });
  await wait(1200);
  await page.getByTestId('timeline-play-toggle-recipe').click();
  await wait(1400);
  await page.getByTestId('timeline-play-toggle-recipe').click();
  await page.getByTestId('timeline-speed-select-recipe').selectOption('1.5');
  await wait(500);
  await page.getByTestId('timeline-scrubber-recipe').evaluate((element) => {
    const input = element;
    const max = Number(input.max || 100);
    input.value = String(Math.max(1, Math.floor(max * 0.6)));
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await wait(600);
  await page.getByTestId('timeline-native-tab-recipe').click();
  await wait(900);
  await page.getByTestId('timeline-normalized-tab-recipe').click();
  await wait(900);
  await scrollDown(page, 3, 480, 650);
};

const runScenarioWalkthrough = async (page) => {
  await page.getByTestId('scenario-runtime-select').selectOption('aws-durable');
  await wait(1000);
  await page
    .getByTestId('scenario-group-select')
    .selectOption('recipe-vectors');
  await wait(900);
  await page.getByTestId('scenario-run-button').click();
  await page.getByTestId('scenario-table').waitFor({ timeout: 120_000 });
  await wait(1000);
  await page.getByTestId('scenario-trace-select').click();
  await wait(500);
  await page.getByTestId('timeline-play-toggle-scenario').click();
  await wait(1000);
  await page.getByTestId('timeline-play-toggle-scenario').click();
  await page.getByTestId('timeline-scrubber-scenario').evaluate((element) => {
    const input = element;
    const max = Number(input.max || 100);
    input.value = String(Math.max(1, Math.floor(max * 0.5)));
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await wait(700);
  await page.getByTestId('timeline-native-tab-scenario').click();
  await wait(800);
  await page.getByTestId('timeline-normalized-tab-scenario').click();
  await wait(700);
  await scrollDown(page, 2, 420, 750);
};

const pagePlans = [
  {
    slug: '01-home',
    route: '/',
    run: async (page) => {
      await wait(1400);
      await scrollDown(page);
      await scrollToTop(page);
    },
  },
  {
    slug: '02-getting-started',
    route: '/getting-started',
    run: async (page) => {
      await wait(1200);
      await scrollDown(page, 5, 450, 750);
      await scrollToTop(page);
    },
  },
  {
    slug: '03-hello-world',
    route: '/tutorials/hello-world',
    run: async (page) => {
      await wait(1200);
      await scrollDown(page, 5, 450, 780);
      await scrollToTop(page);
    },
  },
  {
    slug: '04-runtime-semantics',
    route: '/runtime/semantics',
    run: async (page) => {
      await wait(1200);
      await scrollDown(page, 6, 440, 700);
      await scrollToTop(page);
    },
  },
  {
    slug: '05-recipe-scatter-gather-basic',
    route: '/recipes/scatter-gather-basic',
    run: async (page) =>
      runRecipeWalkthrough(page, {
        runtime: 'aws-durable',
      }),
  },
  {
    slug: '06-recipe-scatter-gather-ai-complete',
    route: '/recipes/scatter-gather-ai-complete',
    run: async (page) =>
      runRecipeWalkthrough(page, {
        runtime: 'aws-durable',
      }),
  },
  {
    slug: '07-recipe-scatter-gather-quorum-timeout',
    route: '/recipes/scatter-gather-quorum-timeout',
    run: async (page) =>
      runRecipeWalkthrough(page, {
        runtime: 'aws-durable',
        presetId: 'quorum-timeout',
      }),
  },
  {
    slug: '08-scenarios',
    route: '/scenarios',
    run: runScenarioWalkthrough,
  },
];

const clearPreviousVideos = async () => {
  await mkdir(outputDir, { recursive: true });
  await rm(tempVideoDir, { recursive: true, force: true });
  await mkdir(tempVideoDir, { recursive: true });

  const entries = await readdir(outputDir, { withFileTypes: true });
  await Promise.all(
    entries
      .filter(
        (entry) =>
          entry.isFile() &&
          entry.name.startsWith('course-') &&
          entry.name.endsWith('.webm'),
      )
      .map((entry) => rm(path.resolve(outputDir, entry.name), { force: true })),
  );
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

const moveVideo = async (sourcePath, targetPath) => {
  try {
    await rename(sourcePath, targetPath);
  } catch {
    await copyFile(sourcePath, targetPath);
    await rm(sourcePath, { force: true });
  }
};

const recordPage = async (browser, plan) => {
  const context = await browser.newContext({
    baseURL: baseUrl,
    viewport: { width: 1280, height: 720 },
    recordVideo: {
      dir: tempVideoDir,
      size: { width: 1280, height: 720 },
    },
  });

  const page = await context.newPage();
  const startedAt = Date.now();
  await page.goto(plan.route, { waitUntil: 'networkidle' });
  await wait(700);
  await plan.run(page);
  await wait(1200);

  const video = page.video();
  if (!video) {
    throw new Error(`video capture unavailable for ${plan.slug}`);
  }

  await context.close();
  const recordedPath = await video.path();
  const targetName = `course-${plan.slug}.webm`;
  const targetPath = path.resolve(outputDir, targetName);
  await moveVideo(recordedPath, targetPath);

  return {
    file: targetName,
    route: plan.route,
    durationSeconds: Number(((Date.now() - startedAt) / 1000).toFixed(1)),
  };
};

const main = async () => {
  await clearPreviousVideos();
  await runCommand(pnpmCommand, [...pnpmArgs, 'build'], appDir);

  const server = startServer();

  try {
    await waitForServer();
    const browser = await chromium.launch({ headless: true });
    const manifest = [];

    for (const plan of pagePlans) {
      console.log(`recording ${plan.slug} (${plan.route})`);
      const item = await recordPage(browser, plan);
      manifest.push(item);
    }

    await browser.close();

    await writeFile(
      path.resolve(outputDir, 'manifest.json'),
      JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          baseUrl,
          videos: manifest,
        },
        null,
        2,
      ),
      'utf8',
    );

    console.log(`recorded ${manifest.length} course videos into ${outputDir}`);
  } finally {
    if (server.pid) {
      try {
        process.kill(-server.pid, 'SIGTERM');
      } catch {
        try {
          process.kill(server.pid, 'SIGTERM');
        } catch {
          // ignore cleanup errors on shutdown
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
