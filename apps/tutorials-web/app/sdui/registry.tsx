import type {
  WorkflowTraceBundle,
  WorkflowTraceEvent,
  WorkflowTraceLane,
  WorkflowTraceSpan,
} from '@agentic-cookbook/workflow-spec';
import { defineRegistry } from '@json-render/react';
import { useEffect } from 'react';
import { catalog } from './catalog.js';
import {
  useRecipePlayground,
  useScenarioRunner,
} from './interactiveContext.js';

const toneColor: Record<'info' | 'warning' | 'success', string> = {
  info: '#0c4a6e',
  warning: '#854d0e',
  success: '#166534',
};

const toneBackground: Record<'info' | 'warning' | 'success', string> = {
  info: '#e0f2fe',
  warning: '#fef3c7',
  success: '#dcfce7',
};

const laneOrder: WorkflowTraceLane[] = [
  'workflow',
  'task',
  'judge',
  'runtime',
  'system',
];

const laneColor: Record<WorkflowTraceLane, string> = {
  workflow: '#0f766e',
  task: '#0284c7',
  judge: '#b45309',
  runtime: '#7c3aed',
  system: '#475569',
};

const formatJson = (value: unknown): string => JSON.stringify(value, null, 2);
const tokenFromHref = (href: string): string =>
  href
    .replace(/^\/+/, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '') || 'home';

const toTimelineEvents = (traceBundle: WorkflowTraceBundle) => {
  const ordered = [...traceBundle.events].sort(
    (left, right) => left.seq - right.seq,
  );
  const timestamped = ordered
    .map((event) => event.tsMs)
    .filter(
      (value): value is number =>
        typeof value === 'number' && Number.isFinite(value),
    );
  const minTs = timestamped.length > 0 ? Math.min(...timestamped) : undefined;

  return ordered.map((event) => {
    const relativeMs =
      typeof event.tsMs === 'number' &&
      Number.isFinite(event.tsMs) &&
      minTs !== undefined
        ? Math.max(0, event.tsMs - minTs)
        : event.seq * 8;

    return {
      ...event,
      relativeMs,
    };
  });
};

const traceWindowMs = (traceBundle: WorkflowTraceBundle): number => {
  const timelineEvents = toTimelineEvents(traceBundle);
  const maxEventMs = timelineEvents.reduce(
    (max, item) => Math.max(max, item.relativeMs),
    0,
  );

  return Math.max(traceBundle.durationMs, maxEventMs + 1, 1);
};

type ScopedContext = {
  trace: WorkflowTraceBundle | null;
  playback: {
    isPlaying: boolean;
    speed: number;
    scrubMs: number;
    selectedView: 'normalized' | 'native';
    selectedEventId: string | null;
    selectedSpanId: string | null;
    selectedHistoryEventId: string | null;
  };
  setPlayback: (next: {
    isPlaying: boolean;
    speed: number;
    scrubMs: number;
    selectedView: 'normalized' | 'native';
    selectedEventId: string | null;
    selectedSpanId: string | null;
    selectedHistoryEventId: string | null;
  }) => void;
};

const useScopedContext = (
  scope: 'recipe' | 'scenario',
): ScopedContext | null => {
  const recipe = useRecipePlayground();
  const scenario = useScenarioRunner();

  if (scope === 'recipe' && recipe) {
    return {
      trace: recipe.activeTrace,
      playback: recipe.playback,
      setPlayback: recipe.setPlayback,
    };
  }

  if (scope === 'scenario' && scenario) {
    return {
      trace: scenario.activeTrace,
      playback: scenario.playback,
      setPlayback: scenario.setPlayback,
    };
  }

  return null;
};

const selectedEventJson = (
  events: Array<WorkflowTraceEvent & { relativeMs: number }>,
  id: string | null,
): string => {
  if (!id) {
    return '';
  }

  const match = events.find((event) => event.id === id);
  return match ? formatJson(match) : '';
};

const selectedSpanJson = (
  spans: WorkflowTraceSpan[],
  id: string | null,
): string => {
  if (!id) {
    return '';
  }

  const match = spans.find((span) => span.id === id);
  return match ? formatJson(match) : '';
};

export const { registry } = defineRegistry(catalog, {
  components: {
    PageShell: ({ props, children }) => (
      <main
        data-testid="page-shell"
        style={{
          margin: '0 auto',
          maxWidth: '72rem',
          padding: '2rem 1.25rem 3rem',
          fontFamily: 'Iowan Old Style, Palatino Linotype, Palatino, serif',
          lineHeight: 1.6,
        }}
      >
        <h1
          style={{
            fontFamily: 'Avenir Next, Trebuchet MS, sans-serif',
            margin: 0,
          }}
        >
          {props.title}
        </h1>
        {props.subtitle ? (
          <p style={{ marginTop: '0.5rem', color: '#334155' }}>
            {props.subtitle}
          </p>
        ) : null}
        <section>{children}</section>
      </main>
    ),
    NavLinks: ({ props }) => (
      <nav
        style={{
          borderBottom: '1px solid #d4d4d8',
          padding: '0.875rem 1.25rem',
          background: '#fafaf9',
          display: 'flex',
          gap: '0.75rem',
          flexWrap: 'wrap',
          fontFamily: 'Avenir Next, Trebuchet MS, sans-serif',
        }}
      >
        {props.links.map((link) => (
          <a
            key={`${link.href}:${link.label}`}
            href={link.href}
            data-testid={`nav-link-${tokenFromHref(link.href)}`}
            style={{
              color: '#134e4a',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            {link.label}
          </a>
        ))}
      </nav>
    ),
    MarkdownBlock: ({ props }) => (
      <article
        style={{ marginTop: '1rem' }}
        // biome-ignore lint/security/noDangerouslySetInnerHtml: docs markdown is rendered from local repository content.
        dangerouslySetInnerHTML={{ __html: props.html }}
      />
    ),
    Callout: ({ props }) => (
      <section
        style={{
          marginTop: '1rem',
          border: `1px solid ${toneColor[props.tone]}`,
          background: toneBackground[props.tone],
          borderRadius: '0.5rem',
          padding: '0.75rem 1rem',
        }}
      >
        <h3
          style={{
            margin: 0,
            fontFamily: 'Avenir Next, Trebuchet MS, sans-serif',
            color: toneColor[props.tone],
          }}
        >
          {props.title}
        </h3>
        <p style={{ margin: '0.5rem 0 0', color: '#1f2937' }}>{props.body}</p>
      </section>
    ),
    CodeBlock: ({ props }) => (
      <pre
        style={{
          marginTop: '1rem',
          overflowX: 'auto',
          borderRadius: '0.5rem',
          background: '#111827',
          color: '#f9fafb',
          padding: '0.875rem',
        }}
      >
        <code>{props.code}</code>
      </pre>
    ),
    RuntimeSelector: ({ props }) => {
      const recipe = useRecipePlayground();
      const scenario = useScenarioRunner();
      const context = props.scope === 'recipe' ? recipe : scenario;
      if (!context) {
        return null;
      }

      return (
        <label
          style={{
            marginTop: '1rem',
            display: 'block',
            fontFamily: 'Avenir Next, Trebuchet MS, sans-serif',
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: '0.375rem' }}>
            {props.label}
          </div>
          <select
            data-testid={`${props.scope}-runtime-select`}
            value={context.runtime}
            onChange={(event) =>
              context.setRuntime(
                event.currentTarget.value as typeof context.runtime,
              )
            }
            style={{ minWidth: '16rem', padding: '0.4rem 0.5rem' }}
          >
            <option value="temporal">Temporal</option>
            <option value="aws-durable">AWS durable</option>
          </select>
        </label>
      );
    },
    PresetSelector: ({ props }) => {
      const recipe = useRecipePlayground();
      const scenario = useScenarioRunner();

      if (props.scope === 'recipe') {
        if (!recipe) {
          return null;
        }

        return (
          <label
            style={{
              marginTop: '1rem',
              display: 'block',
              fontFamily: 'Avenir Next, Trebuchet MS, sans-serif',
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: '0.375rem' }}>
              {props.label}
            </div>
            <select
              data-testid="recipe-preset-select"
              value={recipe.presetId}
              onChange={(event) =>
                recipe.setPresetId(event.currentTarget.value)
              }
              style={{ minWidth: '20rem', padding: '0.4rem 0.5rem' }}
            >
              {props.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        );
      }

      if (!scenario) {
        return null;
      }

      return (
        <label
          style={{
            marginTop: '1rem',
            display: 'block',
            fontFamily: 'Avenir Next, Trebuchet MS, sans-serif',
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: '0.375rem' }}>
            {props.label}
          </div>
          <select
            data-testid="scenario-group-select"
            value={scenario.group}
            onChange={(event) =>
              scenario.setGroup(
                event.currentTarget.value as typeof scenario.group,
              )
            }
            style={{ minWidth: '20rem', padding: '0.4rem 0.5rem' }}
          >
            {props.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      );
    },
    WorkflowJsonEditor: ({ props }) => {
      const recipe = useRecipePlayground();
      if (!recipe) {
        return null;
      }

      return (
        <label
          style={{
            marginTop: '1rem',
            display: 'block',
            fontFamily: 'Avenir Next, Trebuchet MS, sans-serif',
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: '0.375rem' }}>
            {props.label}
          </div>
          <textarea
            data-testid="recipe-input-json"
            value={recipe.inputJson}
            onChange={(event) => recipe.setInputJson(event.currentTarget.value)}
            rows={16}
            spellCheck={false}
            style={{
              width: '100%',
              borderRadius: '0.5rem',
              border: '1px solid #cbd5e1',
              padding: '0.75rem',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              fontSize: '0.85rem',
            }}
          />
        </label>
      );
    },
    RunButton: ({ props }) => {
      const recipe = useRecipePlayground();
      const scenario = useScenarioRunner();
      const context = props.scope === 'recipe' ? recipe : scenario;
      if (!context) {
        return null;
      }

      return (
        <button
          data-testid={`${props.scope}-run-button`}
          type="button"
          onClick={() => void context.run()}
          disabled={context.isRunning}
          style={{
            marginTop: '1rem',
            borderRadius: '0.5rem',
            background: context.isRunning ? '#9ca3af' : '#0f766e',
            border: 0,
            color: '#ffffff',
            fontWeight: 600,
            cursor: context.isRunning ? 'not-allowed' : 'pointer',
            padding: '0.5rem 0.8rem',
          }}
        >
          {context.isRunning ? 'Running...' : props.label}
        </button>
      );
    },
    RunResultCard: ({ props }) => {
      const recipe = useRecipePlayground();
      const scenario = useScenarioRunner();
      if (props.scope === 'recipe') {
        const response = recipe?.result;
        if (!response || response.kind === 'failure') {
          return null;
        }

        return (
          <section
            data-testid="recipe-run-result"
            style={{
              marginTop: '1rem',
              borderRadius: '0.5rem',
              border: '1px solid #10b981',
              background: '#ecfdf5',
              padding: '0.75rem 1rem',
            }}
          >
            <h3
              style={{
                margin: 0,
                fontFamily: 'Avenir Next, Trebuchet MS, sans-serif',
                color: '#065f46',
              }}
            >
              {props.title}
            </h3>
            <p style={{ margin: '0.5rem 0 0' }}>
              status: {response.outcome.status}, duration: {response.durationMs}
              ms
            </p>
          </section>
        );
      }

      const response = scenario?.result;
      if (!response) {
        return null;
      }

      return (
        <section
          data-testid="scenario-run-result"
          style={{
            marginTop: '1rem',
            borderRadius: '0.5rem',
            border: '1px solid #10b981',
            background: '#ecfdf5',
            padding: '0.75rem 1rem',
          }}
        >
          <h3
            style={{
              margin: 0,
              fontFamily: 'Avenir Next, Trebuchet MS, sans-serif',
              color: '#065f46',
            }}
          >
            {props.title}
          </h3>
          <p style={{ margin: '0.5rem 0 0' }}>
            total: {response.summary.total}, passed: {response.summary.passed},
            failed: {response.summary.failed}
          </p>
        </section>
      );
    },
    ErrorCard: ({ props }) => {
      const recipe = useRecipePlayground();
      const scenario = useScenarioRunner();

      let message: string | null = null;
      if (props.scope === 'recipe' && recipe?.result?.kind === 'failure') {
        message = recipe.result.error;
      }

      if (
        props.scope === 'scenario' &&
        scenario?.result &&
        scenario.result.summary.failed > 0
      ) {
        message = `${scenario.result.summary.failed} scenario(s) failed`;
      }

      if (!message) {
        return null;
      }

      return (
        <section
          data-testid={`${props.scope}-error-card`}
          style={{
            marginTop: '1rem',
            borderRadius: '0.5rem',
            border: '1px solid #dc2626',
            background: '#fef2f2',
            padding: '0.75rem 1rem',
          }}
        >
          <h3
            style={{
              margin: 0,
              fontFamily: 'Avenir Next, Trebuchet MS, sans-serif',
              color: '#991b1b',
            }}
          >
            {props.title}
          </h3>
          <p style={{ margin: '0.5rem 0 0', color: '#7f1d1d' }}>{message}</p>
        </section>
      );
    },
    ScenarioTable: ({ props }) => {
      const scenario = useScenarioRunner();
      if (!scenario?.result) {
        return null;
      }

      return (
        <section data-testid="scenario-table" style={{ marginTop: '1rem' }}>
          <h3 style={{ fontFamily: 'Avenir Next, Trebuchet MS, sans-serif' }}>
            {props.title}
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th
                  style={{
                    border: '1px solid #d4d4d8',
                    textAlign: 'left',
                    padding: '0.5rem',
                  }}
                >
                  Scenario
                </th>
                <th
                  style={{
                    border: '1px solid #d4d4d8',
                    textAlign: 'left',
                    padding: '0.5rem',
                  }}
                >
                  Passed
                </th>
                <th
                  style={{
                    border: '1px solid #d4d4d8',
                    textAlign: 'left',
                    padding: '0.5rem',
                  }}
                >
                  Details
                </th>
              </tr>
            </thead>
            <tbody>
              {scenario.result.results.map((row) => (
                <tr
                  key={row.scenarioName}
                  data-testid={`scenario-row-${row.scenarioName}`}
                  onClick={() =>
                    scenario.setSelectedScenarioName(row.scenarioName)
                  }
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      scenario.setSelectedScenarioName(row.scenarioName);
                    }
                  }}
                  tabIndex={0}
                  style={{ cursor: 'pointer' }}
                >
                  <td
                    style={{ border: '1px solid #d4d4d8', padding: '0.5rem' }}
                  >
                    {row.scenarioName}
                  </td>
                  <td
                    style={{ border: '1px solid #d4d4d8', padding: '0.5rem' }}
                  >
                    <span
                      style={{
                        borderRadius: '9999px',
                        padding: '0.1rem 0.5rem',
                        fontFamily: 'Avenir Next, Trebuchet MS, sans-serif',
                        background: row.passed ? '#dcfce7' : '#fef2f2',
                        color: row.passed ? '#166534' : '#991b1b',
                      }}
                    >
                      {row.passed ? 'yes' : 'no'}
                    </span>
                  </td>
                  <td
                    style={{ border: '1px solid #d4d4d8', padding: '0.5rem' }}
                  >
                    {row.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      );
    },
    TimelinePanel: ({ props }) => {
      const scoped = useScopedContext(props.scope);
      const traceBundle = scoped?.trace;

      useEffect(() => {
        if (!scoped || !traceBundle || !scoped.playback.isPlaying) {
          return;
        }

        const windowMs = traceWindowMs(traceBundle);
        let current = Math.min(scoped.playback.scrubMs, windowMs);
        let last = performance.now();
        let raf = 0;

        const frame = (now: number) => {
          const deltaMs = now - last;
          last = now;
          current = Math.min(
            windowMs,
            current + deltaMs * Math.max(scoped.playback.speed, 0.1),
          );

          const isPlaying = current < windowMs;
          scoped.setPlayback({
            ...scoped.playback,
            isPlaying,
            scrubMs: current,
          });

          if (isPlaying) {
            raf = requestAnimationFrame(frame);
          }
        };

        raf = requestAnimationFrame(frame);
        return () => cancelAnimationFrame(raf);
      }, [scoped, traceBundle]);

      if (!traceBundle || !scoped) {
        return null;
      }

      return (
        <section
          data-testid={`${props.scope}-timeline-panel`}
          style={{
            marginTop: '1rem',
            borderRadius: '0.5rem',
            border: '1px solid #cbd5e1',
            background: '#f8fafc',
            padding: '0.75rem 1rem',
          }}
        >
          <h3
            style={{
              margin: 0,
              fontFamily: 'Avenir Next, Trebuchet MS, sans-serif',
            }}
          >
            {props.title}
          </h3>
          <p style={{ margin: '0.35rem 0 0', color: '#475569' }}>
            {traceBundle.events.length} events, {traceBundle.spans.length} spans
          </p>
        </section>
      );
    },
    TimelineControls: ({ props }) => {
      const scoped = useScopedContext(props.scope);
      const traceBundle = scoped?.trace;

      if (!traceBundle || !scoped) {
        return null;
      }

      const windowMs = traceWindowMs(traceBundle);
      const scrubValue = Math.min(scoped.playback.scrubMs, windowMs);

      return (
        <section
          style={{ marginTop: '0.75rem' }}
          data-testid={`${props.scope}-timeline-controls`}
        >
          <h4
            style={{
              margin: 0,
              fontFamily: 'Avenir Next, Trebuchet MS, sans-serif',
            }}
          >
            {props.title}
          </h4>
          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              alignItems: 'center',
              flexWrap: 'wrap',
              marginTop: '0.5rem',
            }}
          >
            <button
              data-testid={`timeline-play-toggle-${props.scope}`}
              type="button"
              onClick={() => {
                const resetMs = scrubValue >= windowMs ? 0 : scrubValue;
                scoped.setPlayback({
                  ...scoped.playback,
                  isPlaying: !scoped.playback.isPlaying,
                  scrubMs: resetMs,
                });
              }}
              style={{
                borderRadius: '0.35rem',
                border: '1px solid #64748b',
                padding: '0.25rem 0.55rem',
                background: '#ffffff',
              }}
            >
              {scoped.playback.isPlaying ? 'Pause' : 'Play'}
            </button>
            <label
              style={{ fontFamily: 'Avenir Next, Trebuchet MS, sans-serif' }}
            >
              Speed
              <select
                data-testid={`timeline-speed-select-${props.scope}`}
                value={String(scoped.playback.speed)}
                onChange={(event) =>
                  scoped.setPlayback({
                    ...scoped.playback,
                    speed: Number(event.currentTarget.value),
                  })
                }
                style={{ marginLeft: '0.35rem' }}
              >
                <option value="0.5">0.5x</option>
                <option value="1">1x</option>
                <option value="1.5">1.5x</option>
                <option value="2">2x</option>
              </select>
            </label>
            <label
              style={{
                fontFamily: 'Avenir Next, Trebuchet MS, sans-serif',
                flex: 1,
                minWidth: '12rem',
              }}
            >
              Scrub
              <input
                data-testid={`timeline-scrubber-${props.scope}`}
                type="range"
                min={0}
                max={windowMs}
                step={1}
                value={scrubValue}
                onChange={(event) =>
                  scoped.setPlayback({
                    ...scoped.playback,
                    isPlaying: false,
                    scrubMs: Number(event.currentTarget.value),
                  })
                }
                style={{ width: '100%' }}
              />
            </label>
            <span
              style={{ fontFamily: 'Avenir Next, Trebuchet MS, sans-serif' }}
            >
              {Math.round(scrubValue)}ms / {Math.round(windowMs)}ms
            </span>
          </div>
        </section>
      );
    },
    TimelineCanvas: ({ props }) => {
      const scoped = useScopedContext(props.scope);
      const traceBundle = scoped?.trace;
      if (!traceBundle || !scoped) {
        return null;
      }

      const timelineEvents = toTimelineEvents(traceBundle);
      const windowMs = traceWindowMs(traceBundle);

      return (
        <section
          data-testid={`timeline-canvas-${props.scope}`}
          style={{ marginTop: '0.75rem' }}
        >
          <h4
            style={{
              margin: 0,
              fontFamily: 'Avenir Next, Trebuchet MS, sans-serif',
            }}
          >
            {props.title}
          </h4>
          <div style={{ marginTop: '0.5rem' }}>
            {laneOrder.map((lane) => (
              <div
                key={lane}
                style={{
                  position: 'relative',
                  borderBottom: '1px dashed #cbd5e1',
                  minHeight: '2.4rem',
                  padding: '0.2rem 0',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 2,
                    fontSize: '0.72rem',
                    color: '#334155',
                    width: '5.5rem',
                    fontFamily: 'Avenir Next, Trebuchet MS, sans-serif',
                  }}
                >
                  {lane}
                </span>
                <div
                  style={{
                    marginLeft: '5.75rem',
                    position: 'relative',
                    height: '2rem',
                  }}
                >
                  {timelineEvents
                    .filter((event) => event.lane === lane)
                    .map((event) => {
                      const left = (event.relativeMs / windowMs) * 100;
                      const viewed =
                        event.relativeMs <= scoped.playback.scrubMs;
                      const size = event.phase === 'point' ? 12 : 14;
                      return (
                        <button
                          key={event.id}
                          data-testid={`timeline-event-${event.id}`}
                          type="button"
                          title={`${event.name} @ ${Math.round(event.relativeMs)}ms`}
                          onClick={() =>
                            scoped.setPlayback({
                              ...scoped.playback,
                              selectedEventId: event.id,
                            })
                          }
                          style={{
                            position: 'absolute',
                            left: `calc(${left}% - ${Math.floor(size / 2)}px)`,
                            top: 8,
                            width: `${size}px`,
                            height: `${size}px`,
                            borderRadius:
                              event.phase === 'point' ? '9999px' : '0.2rem',
                            border: `1px solid ${laneColor[lane]}`,
                            background: viewed ? laneColor[lane] : '#ffffff',
                            opacity: viewed ? 0.95 : 0.45,
                            cursor: 'pointer',
                            padding: 0,
                          }}
                        />
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        </section>
      );
    },
    TimelineLegend: ({ props }) => (
      <section style={{ marginTop: '0.75rem' }}>
        <h4
          style={{
            margin: 0,
            fontFamily: 'Avenir Next, Trebuchet MS, sans-serif',
          }}
        >
          {props.title}
        </h4>
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            flexWrap: 'wrap',
            marginTop: '0.4rem',
          }}
        >
          {laneOrder.map((lane) => (
            <span
              key={lane}
              style={{
                borderRadius: '9999px',
                border: `1px solid ${laneColor[lane]}`,
                background: '#ffffff',
                padding: '0.1rem 0.5rem',
                fontSize: '0.75rem',
                fontFamily: 'Avenir Next, Trebuchet MS, sans-serif',
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: '0.5rem',
                  height: '0.5rem',
                  borderRadius: '9999px',
                  background: laneColor[lane],
                  marginRight: '0.3rem',
                }}
              />
              {lane}
            </span>
          ))}
        </div>
      </section>
    ),
    TraceEventTable: ({ props }) => {
      const scoped = useScopedContext(props.scope);
      const traceBundle = scoped?.trace;
      if (!traceBundle || !scoped) {
        return null;
      }

      const timelineEvents = toTimelineEvents(traceBundle);

      return (
        <section style={{ marginTop: '0.75rem' }}>
          <h4
            style={{
              margin: 0,
              fontFamily: 'Avenir Next, Trebuchet MS, sans-serif',
            }}
          >
            {props.title}
          </h4>
          <div style={{ marginTop: '0.4rem', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Seq', 'Lane', 'Phase', 'Event', 'Time(ms)'].map(
                    (header) => (
                      <th
                        key={header}
                        style={{
                          border: '1px solid #d4d4d8',
                          textAlign: 'left',
                          padding: '0.35rem 0.45rem',
                          fontSize: '0.82rem',
                        }}
                      >
                        {header}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {timelineEvents.map((event) => (
                  <tr
                    key={event.id}
                    style={{
                      background:
                        scoped.playback.selectedEventId === event.id
                          ? '#ecfeff'
                          : '#ffffff',
                      cursor: 'pointer',
                    }}
                    onClick={() =>
                      scoped.setPlayback({
                        ...scoped.playback,
                        selectedEventId: event.id,
                      })
                    }
                    onKeyDown={(keyboardEvent) => {
                      if (
                        keyboardEvent.key === 'Enter' ||
                        keyboardEvent.key === ' '
                      ) {
                        keyboardEvent.preventDefault();
                        scoped.setPlayback({
                          ...scoped.playback,
                          selectedEventId: event.id,
                        });
                      }
                    }}
                    tabIndex={0}
                  >
                    <td
                      style={{
                        border: '1px solid #d4d4d8',
                        padding: '0.3rem 0.45rem',
                      }}
                    >
                      {event.seq}
                    </td>
                    <td
                      style={{
                        border: '1px solid #d4d4d8',
                        padding: '0.3rem 0.45rem',
                      }}
                    >
                      {event.lane}
                    </td>
                    <td
                      style={{
                        border: '1px solid #d4d4d8',
                        padding: '0.3rem 0.45rem',
                      }}
                    >
                      {event.phase}
                    </td>
                    <td
                      style={{
                        border: '1px solid #d4d4d8',
                        padding: '0.3rem 0.45rem',
                      }}
                    >
                      {event.name}
                    </td>
                    <td
                      style={{
                        border: '1px solid #d4d4d8',
                        padding: '0.3rem 0.45rem',
                      }}
                    >
                      {Math.round(event.relativeMs)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {scoped.playback.selectedEventId ? (
            <pre
              style={{
                marginTop: '0.6rem',
                background: '#0f172a',
                color: '#f8fafc',
                borderRadius: '0.4rem',
                padding: '0.6rem',
                whiteSpace: 'pre-wrap',
              }}
            >
              <code>
                {selectedEventJson(
                  timelineEvents,
                  scoped.playback.selectedEventId,
                )}
              </code>
            </pre>
          ) : null}
        </section>
      );
    },
    SpanWaterfall: ({ props }) => {
      const scoped = useScopedContext(props.scope);
      const traceBundle = scoped?.trace;
      if (!traceBundle || !scoped || traceBundle.spans.length === 0) {
        return null;
      }

      const sortedSpans = [...traceBundle.spans].sort(
        (left, right) => left.startTimeMs - right.startTimeMs,
      );

      const minStart = sortedSpans[0]?.startTimeMs ?? 0;
      const maxEnd = sortedSpans.reduce(
        (max, span) => Math.max(max, span.endTimeMs),
        minStart + 1,
      );
      const range = Math.max(maxEnd - minStart, 1);

      return (
        <section style={{ marginTop: '0.75rem' }}>
          <h4
            style={{
              margin: 0,
              fontFamily: 'Avenir Next, Trebuchet MS, sans-serif',
            }}
          >
            {props.title}
          </h4>
          <div style={{ marginTop: '0.45rem' }}>
            {sortedSpans.map((span) => {
              const left = ((span.startTimeMs - minStart) / range) * 100;
              const width =
                (Math.max(span.endTimeMs - span.startTimeMs, 1) / range) * 100;
              return (
                <div
                  key={span.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '12rem 1fr',
                    gap: '0.45rem',
                    alignItems: 'center',
                    marginTop: '0.25rem',
                  }}
                >
                  <button
                    type="button"
                    data-testid={`trace-span-${span.id}`}
                    onClick={() =>
                      scoped.setPlayback({
                        ...scoped.playback,
                        selectedSpanId: span.id,
                      })
                    }
                    style={{
                      border: 0,
                      background: 'transparent',
                      textAlign: 'left',
                      cursor: 'pointer',
                      color: span.status === 'error' ? '#991b1b' : '#0f172a',
                    }}
                  >
                    {span.name}
                  </button>
                  <div
                    style={{
                      position: 'relative',
                      height: '0.9rem',
                      borderRadius: '0.3rem',
                      background: '#e2e8f0',
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        left: `${left}%`,
                        width: `${Math.max(width, 0.4)}%`,
                        top: 0,
                        bottom: 0,
                        borderRadius: '0.3rem',
                        background:
                          span.status === 'error' ? '#ef4444' : '#0ea5e9',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          {scoped.playback.selectedSpanId ? (
            <pre
              style={{
                marginTop: '0.6rem',
                background: '#0f172a',
                color: '#f8fafc',
                borderRadius: '0.4rem',
                padding: '0.6rem',
                whiteSpace: 'pre-wrap',
              }}
            >
              <code>
                {selectedSpanJson(
                  traceBundle.spans,
                  scoped.playback.selectedSpanId,
                )}
              </code>
            </pre>
          ) : null}
        </section>
      );
    },
    NativeHistoryPanel: ({ props }) => {
      const scoped = useScopedContext(props.scope);
      const traceBundle = scoped?.trace;
      if (!traceBundle || !scoped) {
        return null;
      }

      const events = traceBundle.nativeHistory?.events ?? [];

      return (
        <section style={{ marginTop: '0.75rem' }}>
          <h4
            style={{
              margin: 0,
              fontFamily: 'Avenir Next, Trebuchet MS, sans-serif',
            }}
          >
            {props.title}
          </h4>
          <div
            style={{ marginTop: '0.45rem', display: 'flex', gap: '0.45rem' }}
          >
            <button
              type="button"
              data-testid={`timeline-normalized-tab-${props.scope}`}
              onClick={() =>
                scoped.setPlayback({
                  ...scoped.playback,
                  selectedView: 'normalized',
                })
              }
              style={{
                borderRadius: '0.35rem',
                border: '1px solid #64748b',
                background:
                  scoped.playback.selectedView === 'normalized'
                    ? '#e2e8f0'
                    : '#ffffff',
                padding: '0.2rem 0.55rem',
              }}
            >
              Normalized timeline
            </button>
            <button
              type="button"
              data-testid={`timeline-native-tab-${props.scope}`}
              onClick={() =>
                scoped.setPlayback({
                  ...scoped.playback,
                  selectedView: 'native',
                })
              }
              style={{
                borderRadius: '0.35rem',
                border: '1px solid #64748b',
                background:
                  scoped.playback.selectedView === 'native'
                    ? '#e2e8f0'
                    : '#ffffff',
                padding: '0.2rem 0.55rem',
              }}
            >
              Runtime-native history
            </button>
          </div>
          {scoped.playback.selectedView === 'native' ? (
            <div style={{ marginTop: '0.45rem' }}>
              <p style={{ margin: 0, color: '#334155' }}>
                runtime: {traceBundle.nativeHistory?.runtime ?? 'n/a'}, events:{' '}
                {events.length}
              </p>
              <div style={{ overflowX: 'auto', marginTop: '0.35rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['Seq', 'Type', 'Time'].map((header) => (
                        <th
                          key={header}
                          style={{
                            border: '1px solid #d4d4d8',
                            textAlign: 'left',
                            padding: '0.3rem 0.45rem',
                          }}
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((event) => (
                      <tr
                        key={event.id}
                        onClick={() =>
                          scoped.setPlayback({
                            ...scoped.playback,
                            selectedHistoryEventId: event.id,
                          })
                        }
                        onKeyDown={(keyboardEvent) => {
                          if (
                            keyboardEvent.key === 'Enter' ||
                            keyboardEvent.key === ' '
                          ) {
                            keyboardEvent.preventDefault();
                            scoped.setPlayback({
                              ...scoped.playback,
                              selectedHistoryEventId: event.id,
                            });
                          }
                        }}
                        tabIndex={0}
                        style={{
                          cursor: 'pointer',
                          background:
                            scoped.playback.selectedHistoryEventId === event.id
                              ? '#ecfeff'
                              : '#ffffff',
                        }}
                      >
                        <td
                          style={{
                            border: '1px solid #d4d4d8',
                            padding: '0.3rem 0.45rem',
                          }}
                        >
                          {event.seq}
                        </td>
                        <td
                          style={{
                            border: '1px solid #d4d4d8',
                            padding: '0.3rem 0.45rem',
                          }}
                        >
                          {event.type}
                        </td>
                        <td
                          style={{
                            border: '1px solid #d4d4d8',
                            padding: '0.3rem 0.45rem',
                          }}
                        >
                          {event.tsMs ? Math.round(event.tsMs) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p style={{ marginTop: '0.45rem', color: '#334155' }}>
              Inspect normalized event and span tables above for semantic replay
              details.
            </p>
          )}
        </section>
      );
    },
    ScenarioTraceInspector: ({ props }) => {
      const scenario = useScenarioRunner();
      if (!scenario?.result) {
        return null;
      }

      const withTrace = scenario.result.results.filter((item) => item.trace);
      if (withTrace.length === 0) {
        return null;
      }

      const selected =
        scenario.selectedScenarioName ?? withTrace[0]?.scenarioName;

      return (
        <section style={{ marginTop: '0.75rem' }}>
          <h4
            style={{
              margin: 0,
              fontFamily: 'Avenir Next, Trebuchet MS, sans-serif',
            }}
          >
            {props.title}
          </h4>
          <label
            style={{
              display: 'block',
              marginTop: '0.45rem',
              fontFamily: 'Avenir Next, Trebuchet MS, sans-serif',
            }}
          >
            Scenario trace
            <select
              data-testid="scenario-trace-select"
              value={selected ?? ''}
              onChange={(event) =>
                scenario.setSelectedScenarioName(event.currentTarget.value)
              }
              style={{ marginLeft: '0.45rem' }}
            >
              {withTrace.map((item) => (
                <option key={item.scenarioName} value={item.scenarioName}>
                  {item.scenarioName}
                </option>
              ))}
            </select>
          </label>
        </section>
      );
    },
    StatusBadge: ({ props }) => (
      <span
        style={{
          borderRadius: '9999px',
          border: '1px solid #94a3b8',
          background: '#f8fafc',
          color: '#0f172a',
          padding: '0.1rem 0.5rem',
          fontFamily: 'Avenir Next, Trebuchet MS, sans-serif',
          fontSize: '0.75rem',
          display: 'inline-block',
          marginTop: '0.75rem',
        }}
      >
        {props.status}
      </span>
    ),
  },
});
