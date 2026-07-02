import type { Spec } from '@json-render/core';
import type { ScenarioRunResponse } from '../../types.js';
import { buildSpec } from '../spec.js';
import { defaultNavLinks } from './common.js';

export const buildScenarioPageSpec = (options: {
  markdownHtml: string;
  groupOptions: Array<{ label: string; value: string }>;
  result: ScenarioRunResponse | null;
}): Spec => {
  return buildSpec({
    type: 'PageShell',
    props: {
      title: 'Scenario Runner',
      subtitle:
        'Execute shared durable scenario groups against both runtime adapters.',
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
          title: 'Shared BDD scenarios',
          body: 'These runs use the same vectors and durable scenario definitions as harness tests.',
        },
      },
      {
        type: 'RuntimeSelector',
        props: {
          scope: 'scenario',
          label: 'Runtime',
        },
      },
      {
        type: 'PresetSelector',
        props: {
          scope: 'scenario',
          label: 'Scenario group',
          options: options.groupOptions,
        },
      },
      {
        type: 'RunButton',
        props: {
          scope: 'scenario',
          label: 'Run scenarios',
        },
      },
      {
        type: 'RunResultCard',
        props: {
          scope: 'scenario',
          title: 'Scenario run summary',
        },
      },
      {
        type: 'ErrorCard',
        props: {
          scope: 'scenario',
          title: 'Scenario failures detected',
        },
      },
      {
        type: 'ScenarioTraceInspector',
        props: {
          title: 'Scenario trace selection',
        },
      },
      {
        type: 'TimelinePanel',
        props: {
          scope: 'scenario',
          title: 'Scenario replay timeline',
        },
      },
      {
        type: 'TimelineControls',
        props: {
          scope: 'scenario',
          title: 'Playback controls',
        },
      },
      {
        type: 'TimelineCanvas',
        props: {
          scope: 'scenario',
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
          scope: 'scenario',
          title: 'Normalized events',
        },
      },
      {
        type: 'SpanWaterfall',
        props: {
          scope: 'scenario',
          title: 'In-memory OTel spans',
        },
      },
      {
        type: 'NativeHistoryPanel',
        props: {
          scope: 'scenario',
          title: 'Native history views',
        },
      },
      ...(options.result
        ? [
            {
              type: 'StatusBadge',
              props: {
                status: `passed ${options.result.summary.passed}/${options.result.summary.total}`,
              },
            },
          ]
        : []),
      {
        type: 'ScenarioTable',
        props: {
          title: 'Scenario details',
        },
      },
      {
        type: 'MarkdownBlock',
        props: {
          html: options.markdownHtml,
        },
      },
    ],
  });
};
