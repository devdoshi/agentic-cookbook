import type { WorkflowInput } from '@agentic-cookbook/workflow-spec';
import type { ScenarioGroupId } from '../types.js';

export type RecipeSlug =
  | 'scatter-gather-basic'
  | 'scatter-gather-ai-complete'
  | 'scatter-gather-quorum-timeout';

export type RecipePreset = {
  id: string;
  label: string;
  input: WorkflowInput;
  slug: RecipeSlug;
};

export const recipePresets: RecipePreset[] = [
  {
    id: 'basic-default',
    label: 'Basic / all tasks',
    slug: 'scatter-gather-basic',
    input: {
      workflowId: 'ui-basic-default',
      mode: 'basic',
      tasks: [
        { id: 'a', payload: 'alpha' },
        { id: 'b', payload: 'beta' },
        { id: 'c', payload: 'gamma' },
      ],
    },
  },
  {
    id: 'ai-default',
    label: 'AI complete / fixture threshold',
    slug: 'scatter-gather-ai-complete',
    input: {
      workflowId: 'ui-ai-default',
      mode: 'ai-complete',
      tasks: [
        { id: 'a', payload: 'alpha' },
        { id: 'b', payload: 'beta' },
        { id: 'c', payload: 'gamma' },
      ],
      minimumJudgeScore: 0.9,
    },
  },
  {
    id: 'quorum-default',
    label: 'Quorum timeout / quorum win',
    slug: 'scatter-gather-quorum-timeout',
    input: {
      workflowId: 'ui-quorum-default',
      mode: 'quorum-timeout',
      tasks: [
        { id: 'a', payload: 'alpha' },
        { id: 'b', payload: 'beta' },
        { id: 'c', payload: 'gamma' },
      ],
      quorum: 2,
      timeoutMs: 80,
    },
  },
  {
    id: 'quorum-timeout',
    label: 'Quorum timeout / timeout edge',
    slug: 'scatter-gather-quorum-timeout',
    input: {
      workflowId: 'ui-timeout-default',
      mode: 'quorum-timeout',
      tasks: [
        { id: 'a', payload: 'alpha' },
        { id: 'b', payload: 'beta' },
        { id: 'c', payload: 'gamma' },
      ],
      quorum: 3,
      timeoutMs: 8,
    },
  },
];

export const recipesBySlug: Record<
  RecipeSlug,
  { docPath: string; title: string }
> = {
  'scatter-gather-basic': {
    title: 'Scatter Gather (Basic)',
    docPath: 'recipes/scatter-gather-basic.md',
  },
  'scatter-gather-ai-complete': {
    title: 'Scatter Gather (AI Completeness)',
    docPath: 'recipes/scatter-gather-ai-complete.md',
  },
  'scatter-gather-quorum-timeout': {
    title: 'Scatter Gather (Quorum + Timeout)',
    docPath: 'recipes/scatter-gather-quorum-timeout.md',
  },
};

export const findPresetById = (presetId: string): RecipePreset | undefined =>
  recipePresets.find((preset) => preset.id === presetId);

export const findDefaultPresetForSlug = (slug: RecipeSlug): RecipePreset => {
  const preset = recipePresets.find((item) => item.slug === slug);
  if (!preset) {
    throw new Error(`missing default preset for recipe slug: ${slug}`);
  }

  return preset;
};

export const scenarioGroups: Record<
  ScenarioGroupId,
  {
    label: string;
    description: string;
  }
> = {
  'recipe-vectors': {
    label: 'Recipe vectors',
    description: 'Canonical status expectations for each recipe mode.',
  },
  'durable-determinism': {
    label: 'Durable determinism',
    description: 'Replay should produce canonical-equivalent outcomes.',
  },
  'durable-errors': {
    label: 'Durable errors',
    description:
      'Validation and task-failure pathways should fail predictably.',
  },
};
