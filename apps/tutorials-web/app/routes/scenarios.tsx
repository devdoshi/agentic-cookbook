import { useEffect, useMemo, useState } from 'react';
import { useFetcher, useLoaderData } from 'react-router';
import { readDocFile } from '../lib/docs.js';
import { renderMarkdown } from '../lib/markdown.js';
import { scenarioGroups } from '../lib/presets.js';
import { RenderSpec } from '../sdui/RenderSpec.js';
import { buildScenarioPageSpec } from '../sdui/builders/scenarioBuilder.js';
import {
  type ScenarioRunnerContextValue,
  ScenarioRunnerProvider,
  type TracePlaybackState,
} from '../sdui/interactiveContext.js';
import type {
  RuntimeId,
  ScenarioGroupId,
  ScenarioRunRequest,
  ScenarioRunResponse,
} from '../types.js';

export const loader = async () => {
  const docPath = 'scenarios/durable-execution.md';
  const markdown = await readDocFile(docPath);

  return {
    markdownHtml: renderMarkdown(markdown, docPath),
  };
};

export default function ScenariosRoute() {
  const data = useLoaderData<typeof loader>();
  const fetcher = useFetcher<ScenarioRunResponse>();
  const [runtime, setRuntime] = useState<RuntimeId>('temporal');
  const [group, setGroup] = useState<ScenarioGroupId>('recipe-vectors');
  const [result, setResult] = useState<ScenarioRunResponse | null>(null);
  const [selectedScenarioName, setSelectedScenarioName] = useState<
    string | null
  >(null);
  const [playback, setPlayback] = useState<TracePlaybackState>({
    isPlaying: false,
    speed: 1,
    scrubMs: 0,
    selectedView: 'normalized',
    selectedEventId: null,
    selectedSpanId: null,
    selectedHistoryEventId: null,
  });

  const groupOptions = useMemo(
    () =>
      Object.entries(scenarioGroups).map(([value, meta]) => ({
        value,
        label: meta.label,
      })),
    [],
  );

  useEffect(() => {
    if (fetcher.data) {
      setResult(fetcher.data);
      const nextTraceCandidate = fetcher.data.results.find(
        (item) => item.trace,
      );
      setSelectedScenarioName(nextTraceCandidate?.scenarioName ?? null);
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

  const activeTrace =
    result?.results.find((item) => item.scenarioName === selectedScenarioName)
      ?.trace ??
    result?.results.find((item) => item.trace)?.trace ??
    null;

  const run = async () => {
    const payload: ScenarioRunRequest = {
      runtime,
      scenarioGroup: group,
    };

    fetcher.submit(JSON.stringify(payload), {
      method: 'post',
      action: '/api/scenario/run',
      encType: 'application/json',
    });
  };

  const contextValue: ScenarioRunnerContextValue = {
    runtime,
    setRuntime,
    group,
    setGroup,
    groupOptions,
    isRunning: fetcher.state !== 'idle',
    run,
    result,
    selectedScenarioName,
    setSelectedScenarioName,
    activeTrace,
    playback,
    setPlayback,
  };

  return (
    <ScenarioRunnerProvider value={contextValue}>
      <RenderSpec
        spec={buildScenarioPageSpec({
          markdownHtml: data.markdownHtml,
          groupOptions,
          result,
        })}
      />
    </ScenarioRunnerProvider>
  );
}
