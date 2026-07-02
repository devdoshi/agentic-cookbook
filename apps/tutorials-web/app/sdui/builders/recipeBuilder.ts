import type { Spec } from '@json-render/core';
import type { RecipePreset } from '../../lib/presets.js';
import type { WorkflowRunResponse } from '../../types.js';
import { buildSpec } from '../spec.js';
import { defaultNavLinks } from './common.js';

export const buildRecipePageSpec = (options: {
  title: string;
  markdownHtml: string;
  presetOptions: Array<{ label: string; value: string }>;
  activePreset: RecipePreset;
  result: WorkflowRunResponse | null;
}): Spec => {
  return buildSpec({
    type: 'PageShell',
    props: {
      title: options.title,
      subtitle:
        'Run this recipe against Temporal or AWS durable local harnesses.',
    },
    children: [
      {
        type: 'NavLinks',
        props: {
          links: defaultNavLinks,
        },
      },
      {
        type: 'Callout',
        props: {
          tone: 'info',
          title: 'Interactive playground',
          body: 'Pick runtime and preset, optionally edit JSON input, then run locally.',
        },
      },
      {
        type: 'RuntimeSelector',
        props: {
          scope: 'recipe',
          label: 'Runtime',
        },
      },
      {
        type: 'PresetSelector',
        props: {
          scope: 'recipe',
          label: 'Preset',
          options: options.presetOptions,
        },
      },
      {
        type: 'WorkflowJsonEditor',
        props: {
          label: `Workflow input JSON (${options.activePreset.id})`,
        },
      },
      {
        type: 'RunButton',
        props: {
          scope: 'recipe',
          label: 'Run workflow',
        },
      },
      {
        type: 'RunResultCard',
        props: {
          scope: 'recipe',
          title: 'Workflow outcome',
        },
      },
      {
        type: 'ErrorCard',
        props: {
          scope: 'recipe',
          title: 'Workflow error',
        },
      },
      {
        type: 'TimelinePanel',
        props: {
          scope: 'recipe',
          title: 'Replay timeline',
        },
      },
      {
        type: 'TimelineControls',
        props: {
          scope: 'recipe',
          title: 'Playback controls',
        },
      },
      {
        type: 'TimelineCanvas',
        props: {
          scope: 'recipe',
          title: 'Lane timeline',
        },
      },
      {
        type: 'TimelineLegend',
        props: {
          title: 'Lane legend',
        },
      },
      {
        type: 'TraceEventTable',
        props: {
          scope: 'recipe',
          title: 'Normalized events',
        },
      },
      {
        type: 'SpanWaterfall',
        props: {
          scope: 'recipe',
          title: 'In-memory OTel spans',
        },
      },
      {
        type: 'NativeHistoryPanel',
        props: {
          scope: 'recipe',
          title: 'Native history views',
        },
      },
      ...(options.result?.kind === 'success'
        ? [
            {
              type: 'StatusBadge',
              props: {
                status: `status: ${options.result.outcome.status}`,
              },
            },
          ]
        : []),
      {
        type: 'MarkdownBlock',
        props: {
          html: options.markdownHtml,
        },
      },
    ],
  });
};
