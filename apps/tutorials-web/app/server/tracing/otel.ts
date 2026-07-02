import type {
  WorkflowTraceBundle,
  WorkflowTraceEvent,
  WorkflowTraceLane,
  WorkflowTraceSpan,
} from '@agentic-cookbook/workflow-spec';
import { SpanStatusCode, context, trace } from '@opentelemetry/api';
import {
  BasicTracerProvider,
  InMemorySpanExporter,
  type ReadableSpan,
  SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-base';

type SpanSpec = {
  lane: WorkflowTraceLane;
  name: string;
  startTimeMs: number;
  endTimeMs: number;
  status: 'ok' | 'error';
  attrs: Record<string, unknown>;
};

const toMs = (value: [number, number]): number =>
  value[0] * 1000 + Math.floor(value[1] / 1_000_000);

const eventTimeMs = (
  event: WorkflowTraceEvent,
  baseTimeMs: number,
  tickMs: number,
): number => {
  if (typeof event.tsMs === 'number' && Number.isFinite(event.tsMs)) {
    return event.tsMs;
  }

  return baseTimeMs + event.seq * tickMs;
};

const toStatus = (event: WorkflowTraceEvent): 'ok' | 'error' => {
  if (event.name.includes('fail')) {
    return 'error';
  }

  if (typeof event.attrs.error === 'string' && event.attrs.error.length > 0) {
    return 'error';
  }

  return 'ok';
};

const toOtelAttributes = (
  attrs: Record<string, unknown>,
): Record<string, string | number | boolean> => {
  const output: Record<string, string | number | boolean> = {};

  for (const [key, value] of Object.entries(attrs)) {
    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      output[key] = value;
      continue;
    }

    if (Array.isArray(value)) {
      output[key] = JSON.stringify(value);
      continue;
    }

    if (value === null || value === undefined) {
      continue;
    }

    output[key] = JSON.stringify(value);
  }

  return output;
};

const buildSpanSpecs = (
  events: WorkflowTraceEvent[],
  baseTimeMs: number,
): { spans: SpanSpec[]; warnings: string[] } => {
  const tickMs = 8;
  const spans: SpanSpec[] = [];
  const warnings: string[] = [];
  const openByKey = new Map<string, WorkflowTraceEvent[]>();

  const ordered = [...events].sort((left, right) => left.seq - right.seq);
  for (const event of ordered) {
    const key = `${event.lane}:${event.name}:${event.taskId ?? '-'}`;

    if (event.phase === 'start') {
      const stack = openByKey.get(key) ?? [];
      stack.push(event);
      openByKey.set(key, stack);
      continue;
    }

    if (event.phase === 'end') {
      const stack = openByKey.get(key);
      const startEvent = stack?.pop();
      if (!startEvent) {
        warnings.push(`unmatched end event: ${event.name}#${event.seq}`);
      }
      if (stack && stack.length === 0) {
        openByKey.delete(key);
      }

      const startMs = startEvent
        ? eventTimeMs(startEvent, baseTimeMs, tickMs)
        : eventTimeMs(event, baseTimeMs, tickMs);
      const endMs = Math.max(
        eventTimeMs(event, baseTimeMs, tickMs),
        startMs + 1,
      );
      spans.push({
        lane: event.lane,
        name: event.name,
        startTimeMs: startMs,
        endTimeMs: endMs,
        status: toStatus(event),
        attrs: {
          ...(startEvent?.attrs ?? {}),
          ...event.attrs,
          taskId: event.taskId ?? startEvent?.taskId ?? null,
          lane: event.lane,
        },
      });
      continue;
    }

    const pointMs = eventTimeMs(event, baseTimeMs, tickMs);
    spans.push({
      lane: event.lane,
      name: event.name,
      startTimeMs: pointMs,
      endTimeMs: pointMs + 1,
      status: toStatus(event),
      attrs: {
        ...event.attrs,
        taskId: event.taskId ?? null,
        lane: event.lane,
      },
    });
  }

  for (const stack of openByKey.values()) {
    for (const startEvent of stack) {
      warnings.push(
        `unterminated start event: ${startEvent.name}#${startEvent.seq}`,
      );
      const startMs = eventTimeMs(startEvent, baseTimeMs, tickMs);
      spans.push({
        lane: startEvent.lane,
        name: startEvent.name,
        startTimeMs: startMs,
        endTimeMs: startMs + 1,
        status: toStatus(startEvent),
        attrs: {
          ...startEvent.attrs,
          taskId: startEvent.taskId ?? null,
          lane: startEvent.lane,
        },
      });
    }
  }

  return { spans, warnings };
};

const toWorkflowSpan = (span: ReadableSpan): WorkflowTraceSpan => {
  const laneAttr = span.attributes['workflow.lane'];
  const lane: WorkflowTraceLane =
    laneAttr === 'workflow' ||
    laneAttr === 'task' ||
    laneAttr === 'judge' ||
    laneAttr === 'runtime' ||
    laneAttr === 'system'
      ? laneAttr
      : 'system';

  return {
    id: span.spanContext().spanId,
    parentId: span.parentSpanContext?.spanId,
    name: span.name,
    lane,
    startTimeMs: toMs(span.startTime),
    endTimeMs: toMs(span.endTime),
    status: span.status.code === SpanStatusCode.ERROR ? 'error' : 'ok',
    attrs: span.attributes,
  };
};

export const enrichTraceWithOtelSpans = async (
  traceBundle: WorkflowTraceBundle,
  runName: string,
): Promise<WorkflowTraceBundle> => {
  const exporter = new InMemorySpanExporter();
  const provider = new BasicTracerProvider({
    spanProcessors: [new SimpleSpanProcessor(exporter)],
  });
  const tracer = provider.getTracer('agentic-cookbook/tutorials-web');

  const firstEvent = [...traceBundle.events].sort((a, b) => a.seq - b.seq)[0];
  const baseTimeMs =
    typeof firstEvent?.tsMs === 'number' && Number.isFinite(firstEvent.tsMs)
      ? firstEvent.tsMs
      : Date.now();

  const { spans, warnings } = buildSpanSpecs(traceBundle.events, baseTimeMs);

  const rootStart = baseTimeMs;
  const rootEnd =
    rootStart + Math.max(traceBundle.durationMs, spans.length * 8 + 1);
  const rootSpan = tracer.startSpan(`run:${runName}`, {
    startTime: new Date(rootStart),
  });
  rootSpan.setAttributes({
    'workflow.event.count': traceBundle.events.length,
    'workflow.span.synthetic.count': spans.length,
    'workflow.lane': 'system',
  });

  const rootContext = trace.setSpan(context.active(), rootSpan);

  for (const spanSpec of spans) {
    const span = tracer.startSpan(
      spanSpec.name,
      {
        startTime: new Date(spanSpec.startTimeMs),
      },
      rootContext,
    );
    span.setAttributes({
      ...toOtelAttributes(spanSpec.attrs),
      'workflow.lane': spanSpec.lane,
    });
    if (spanSpec.status === 'error') {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message:
          typeof spanSpec.attrs.error === 'string'
            ? spanSpec.attrs.error
            : 'trace event marked as error',
      });
    }
    span.end(new Date(spanSpec.endTimeMs));
  }

  rootSpan.end(new Date(rootEnd));

  await provider.forceFlush();
  const exported = exporter
    .getFinishedSpans()
    .map(toWorkflowSpan)
    .sort((left, right) => {
      if (left.startTimeMs === right.startTimeMs) {
        return left.name.localeCompare(right.name);
      }
      return left.startTimeMs - right.startTimeMs;
    });

  exporter.reset();
  await provider.shutdown();

  return {
    ...traceBundle,
    spans: exported,
    warnings: [...traceBundle.warnings, ...warnings],
  };
};
