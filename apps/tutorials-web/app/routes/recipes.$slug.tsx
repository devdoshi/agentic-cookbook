import { useEffect, useMemo, useState } from 'react';
import { useFetcher, useLoaderData } from 'react-router';
import { readDocFile } from '../lib/docs.js';
import { renderMarkdown } from '../lib/markdown.js';
import {
  type RecipeSlug,
  findDefaultPresetForSlug,
  recipePresets,
  recipesBySlug,
} from '../lib/presets.js';
import { RenderSpec } from '../sdui/RenderSpec.js';
import { buildRecipePageSpec } from '../sdui/builders/recipeBuilder.js';
import {
  type RecipePlaygroundContextValue,
  RecipePlaygroundProvider,
  type TracePlaybackState,
} from '../sdui/interactiveContext.js';
import type {
  RuntimeId,
  WorkflowRunRequest,
  WorkflowRunResponse,
} from '../types.js';

const isRecipeSlug = (slug: string): slug is RecipeSlug =>
  slug === 'scatter-gather-basic' ||
  slug === 'scatter-gather-ai-complete' ||
  slug === 'scatter-gather-quorum-timeout';

export const loader = async ({
  params,
}: {
  params: { slug?: string };
}) => {
  const slug = params.slug;
  if (!slug || !isRecipeSlug(slug)) {
    throw new Response('Not Found', { status: 404 });
  }

  const recipeMeta = recipesBySlug[slug];
  const markdown = await readDocFile(recipeMeta.docPath);
  const defaultPreset = findDefaultPresetForSlug(slug);
  const presets = recipePresets.filter((preset) => preset.slug === slug);

  return {
    slug,
    title: recipeMeta.title,
    markdownHtml: renderMarkdown(markdown, recipeMeta.docPath),
    defaultPresetId: defaultPreset.id,
    presets,
  };
};

export default function RecipeRoute() {
  const data = useLoaderData<typeof loader>();
  const fetcher = useFetcher<WorkflowRunResponse>();

  const [runtime, setRuntime] = useState<RuntimeId>('temporal');
  const [presetId, setPresetId] = useState<string>(data.defaultPresetId);
  const [inputJson, setInputJson] = useState(
    JSON.stringify(data.presets[0]?.input ?? {}, null, 2),
  );
  const [result, setResult] = useState<WorkflowRunResponse | null>(null);
  const [playback, setPlayback] = useState<TracePlaybackState>({
    isPlaying: false,
    speed: 1,
    scrubMs: 0,
    selectedView: 'normalized',
    selectedEventId: null,
    selectedSpanId: null,
    selectedHistoryEventId: null,
  });

  const presetOptions = useMemo(
    () =>
      data.presets.map((preset) => ({ label: preset.label, value: preset.id })),
    [data.presets],
  );

  useEffect(() => {
    const activePreset =
      data.presets.find((preset) => preset.id === presetId) ?? data.presets[0];
    if (!activePreset) {
      return;
    }

    setInputJson(JSON.stringify(activePreset.input, null, 2));
  }, [data.presets, presetId]);

  useEffect(() => {
    if (fetcher.data) {
      setResult(fetcher.data);
      setPlayback((existing) => ({
        ...existing,
        isPlaying: false,
        scrubMs: 0,
        selectedEventId: null,
        selectedSpanId: null,
        selectedHistoryEventId: null,
        selectedView: 'normalized',
      }));
    }
  }, [fetcher.data]);

  const activePreset =
    data.presets.find((preset) => preset.id === presetId) ?? data.presets[0];

  const run = async () => {
    let parsedInput: unknown;
    try {
      parsedInput = JSON.parse(inputJson);
    } catch {
      setResult({
        kind: 'failure',
        durationMs: 0,
        error: 'invalid JSON input for workflow run',
        trace: {
          version: 1,
          events: [],
          spans: [],
          nativeHistory: null,
          durationMs: 0,
          warnings: ['invalid workflow JSON'],
        },
      });
      return;
    }

    const payload: WorkflowRunRequest = {
      runtime,
      presetId,
      input: parsedInput as WorkflowRunRequest['input'],
    };

    fetcher.submit(JSON.stringify(payload), {
      method: 'post',
      action: '/api/workflow/run',
      encType: 'application/json',
    });
  };

  const contextValue: RecipePlaygroundContextValue = {
    runtime,
    setRuntime,
    presetId,
    setPresetId,
    presetOptions,
    inputJson,
    setInputJson,
    isRunning: fetcher.state !== 'idle',
    run,
    result,
    activeTrace: result?.trace ?? null,
    playback,
    setPlayback,
  };

  return (
    <RecipePlaygroundProvider value={contextValue}>
      <RenderSpec
        spec={buildRecipePageSpec({
          title: data.title,
          markdownHtml: data.markdownHtml,
          presetOptions,
          activePreset,
          result,
        })}
      />
    </RecipePlaygroundProvider>
  );
}
