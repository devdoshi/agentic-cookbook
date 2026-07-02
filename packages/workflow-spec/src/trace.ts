import type {
  WorkflowTraceEvent,
  WorkflowTraceLane,
  WorkflowTracePhase,
} from './types.js';

type TraceEventInput = {
  lane: WorkflowTraceLane;
  phase: WorkflowTracePhase;
  name: string;
  taskId?: string;
  tsMs?: number;
  attrs?: WorkflowTraceEvent['attrs'];
};

export type WorkflowTraceRecorder = {
  emit: (event: TraceEventInput) => void;
  snapshot: () => WorkflowTraceEvent[];
};

export const createWorkflowTraceRecorder = (): WorkflowTraceRecorder => {
  const events: WorkflowTraceEvent[] = [];
  let seq = 0;

  return {
    emit: (event) => {
      seq += 1;
      events.push({
        id: `evt-${seq}`,
        seq,
        lane: event.lane,
        phase: event.phase,
        name: event.name,
        tsMs: event.tsMs,
        taskId: event.taskId,
        attrs: event.attrs ?? {},
      });
    },
    snapshot: () =>
      events.map((event) => ({ ...event, attrs: { ...event.attrs } })),
  };
};
