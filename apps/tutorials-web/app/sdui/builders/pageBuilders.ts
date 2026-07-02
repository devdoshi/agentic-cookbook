import type { Spec } from '@json-render/core';
import { buildSpec } from '../spec.js';
import { defaultNavLinks } from './common.js';

export const buildHomePageSpec = (): Spec =>
  buildSpec({
    type: 'PageShell',
    props: {
      title: 'Agentic Workflow Cookbook Tutorials',
      subtitle:
        'Compare durable execution semantics by running the same agentic workflow recipes and scenario suites across runtimes.',
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
          title: 'Recipes and scenarios are the point',
          body: 'Open a recipe, run it with Temporal, switch to AWS durable, then run the shared scenario vectors to compare outcomes, traces, spans, and runtime-native history.',
        },
      },
      {
        type: 'CodeBlock',
        props: {
          language: 'bash',
          code: [
            'pnpm demo',
            'pnpm --filter @agentic-cookbook/temporal-harness test',
            'pnpm --filter @agentic-cookbook/aws-durable-harness test',
          ].join('\n'),
        },
      },
    ],
  });

export const buildDocPageSpec = (options: {
  title: string;
  subtitle: string;
  html: string;
}): Spec =>
  buildSpec({
    type: 'PageShell',
    props: {
      title: options.title,
      subtitle: options.subtitle,
    },
    children: [
      {
        type: 'NavLinks',
        props: {
          links: defaultNavLinks,
        },
      },
      {
        type: 'MarkdownBlock',
        props: {
          html: options.html,
        },
      },
    ],
  });
