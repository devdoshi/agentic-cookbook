import type { WorkflowTraceBundle } from '@agentic-cookbook/workflow-spec';
import { createContext, useContext } from 'react';
import type {
  RuntimeId,
  ScenarioGroupId,
  ScenarioRunResponse,
  WorkflowRunResponse,
} from '../types.js';

type SelectOption = { value: string; label: string };

export type TracePlaybackState = {
  isPlaying: boolean;
  speed: number;
  scrubMs: number;
  selectedView: 'normalized' | 'native';
  selectedEventId: string | null;
  selectedSpanId: string | null;
  selectedHistoryEventId: string | null;
};

export type RecipePlaygroundContextValue = {
  runtime: RuntimeId;
  setRuntime: (runtime: RuntimeId) => void;
  presetId: string;
  setPresetId: (presetId: string) => void;
  presetOptions: SelectOption[];
  inputJson: string;
  setInputJson: (value: string) => void;
  isRunning: boolean;
  run: () => Promise<void>;
  result: WorkflowRunResponse | null;
  activeTrace: WorkflowTraceBundle | null;
  playback: TracePlaybackState;
  setPlayback: (next: TracePlaybackState) => void;
};

export type ScenarioRunnerContextValue = {
  runtime: RuntimeId;
  setRuntime: (runtime: RuntimeId) => void;
  group: ScenarioGroupId;
  setGroup: (group: ScenarioGroupId) => void;
  groupOptions: SelectOption[];
  isRunning: boolean;
  run: () => Promise<void>;
  result: ScenarioRunResponse | null;
  selectedScenarioName: string | null;
  setSelectedScenarioName: (scenarioName: string | null) => void;
  activeTrace: WorkflowTraceBundle | null;
  playback: TracePlaybackState;
  setPlayback: (next: TracePlaybackState) => void;
};

const recipeContext = createContext<RecipePlaygroundContextValue | null>(null);
const scenarioContext = createContext<ScenarioRunnerContextValue | null>(null);

export const RecipePlaygroundProvider = recipeContext.Provider;
export const ScenarioRunnerProvider = scenarioContext.Provider;

export const useRecipePlayground = (): RecipePlaygroundContextValue | null =>
  useContext(recipeContext);

export const useScenarioRunner = (): ScenarioRunnerContextValue | null =>
  useContext(scenarioContext);
