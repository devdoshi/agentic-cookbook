import { defineCatalog } from '@json-render/core';
import { schema } from '@json-render/react';
import { z } from 'zod';

const optionSchema = z.object({
  label: z.string(),
  value: z.string(),
});

const linkSchema = z.object({
  label: z.string(),
  href: z.string(),
});

export const catalog = defineCatalog(schema, {
  components: {
    PageShell: {
      description: 'Page frame wrapper with typography and spacing.',
      props: z.object({
        title: z.string(),
        subtitle: z.string().optional(),
      }),
    },
    NavLinks: {
      description: 'Top navigation links for tutorials pages.',
      props: z.object({
        links: z.array(linkSchema),
      }),
    },
    MarkdownBlock: {
      description: 'Rendered markdown HTML block from docs.',
      props: z.object({
        html: z.string(),
      }),
    },
    Callout: {
      description: 'Short highlighted message block.',
      props: z.object({
        tone: z.enum(['info', 'warning', 'success']),
        title: z.string(),
        body: z.string(),
      }),
    },
    CodeBlock: {
      description: 'Read-only code snippet block.',
      props: z.object({
        code: z.string(),
        language: z.string().optional(),
      }),
    },
    RuntimeSelector: {
      description: 'Runtime picker for recipe/scenario execution.',
      props: z.object({
        scope: z.enum(['recipe', 'scenario']),
        label: z.string(),
      }),
    },
    PresetSelector: {
      description: 'Preset selector for workflows or scenario groups.',
      props: z.object({
        scope: z.enum(['recipe', 'scenario']),
        label: z.string(),
        options: z.array(optionSchema),
      }),
    },
    WorkflowJsonEditor: {
      description: 'Editable JSON payload textarea for workflow input.',
      props: z.object({
        label: z.string(),
      }),
    },
    RunButton: {
      description: 'Action button to trigger recipe/scenario execution.',
      props: z.object({
        scope: z.enum(['recipe', 'scenario']),
        label: z.string(),
      }),
    },
    RunResultCard: {
      description: 'Result card for workflow or scenario execution outcomes.',
      props: z.object({
        scope: z.enum(['recipe', 'scenario']),
        title: z.string(),
      }),
    },
    ErrorCard: {
      description: 'Error card shown when execution fails.',
      props: z.object({
        scope: z.enum(['recipe', 'scenario']),
        title: z.string(),
      }),
    },
    ScenarioTable: {
      description: 'Table of scenario execution results.',
      props: z.object({
        title: z.string(),
      }),
    },
    TimelinePanel: {
      description:
        'Container panel that renders normalized timeline and runtime history views.',
      props: z.object({
        scope: z.enum(['recipe', 'scenario']),
        title: z.string(),
      }),
    },
    TimelineControls: {
      description: 'Controls for timeline playback and scrubber.',
      props: z.object({
        scope: z.enum(['recipe', 'scenario']),
        title: z.string(),
      }),
    },
    TimelineCanvas: {
      description: 'Lane-based visual timeline canvas.',
      props: z.object({
        scope: z.enum(['recipe', 'scenario']),
        title: z.string(),
      }),
    },
    TimelineLegend: {
      description: 'Timeline lane legend.',
      props: z.object({
        title: z.string(),
      }),
    },
    TraceEventTable: {
      description: 'Table view of normalized trace events.',
      props: z.object({
        scope: z.enum(['recipe', 'scenario']),
        title: z.string(),
      }),
    },
    SpanWaterfall: {
      description: 'OTel span waterfall visualization.',
      props: z.object({
        scope: z.enum(['recipe', 'scenario']),
        title: z.string(),
      }),
    },
    NativeHistoryPanel: {
      description: 'Runtime-native history tab panel.',
      props: z.object({
        scope: z.enum(['recipe', 'scenario']),
        title: z.string(),
      }),
    },
    ScenarioTraceInspector: {
      description:
        'Scenario trace selector and inspector for per-scenario timeline replay.',
      props: z.object({
        title: z.string(),
      }),
    },
    StatusBadge: {
      description: 'Small status badge for completion state.',
      props: z.object({
        status: z.string(),
      }),
    },
  },
  actions: {
    noop: {
      description: 'No-op action placeholder for catalog completeness.',
    },
  },
});
