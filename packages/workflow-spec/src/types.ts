export type WorkflowMode = 'basic' | 'ai-complete' | 'quorum-timeout';

export type WorkflowTraceLane =
  | 'workflow'
  | 'task'
  | 'judge'
  | 'runtime'
  | 'system';

export type WorkflowTracePhase = 'start' | 'end' | 'point';

export type WorkflowTraceAttrs = Record<
  string,
  string | number | boolean | null
>;

export type WorkflowTraceEvent = {
  id: string;
  seq: number;
  lane: WorkflowTraceLane;
  phase: WorkflowTracePhase;
  name: string;
  tsMs?: number;
  taskId?: string;
  attrs: WorkflowTraceAttrs;
};

export type WorkflowTraceNativeEvent = {
  id: string;
  seq: number;
  type: string;
  tsMs?: number;
  attrs: Record<string, unknown>;
};

export type WorkflowTraceNativeHistory = {
  runtime: 'temporal' | 'aws-durable' | 'unknown';
  events: WorkflowTraceNativeEvent[];
};

export type WorkflowTraceSpan = {
  id: string;
  parentId?: string;
  name: string;
  lane: WorkflowTraceLane;
  startTimeMs: number;
  endTimeMs: number;
  status: 'ok' | 'error';
  attrs: Record<string, unknown>;
};

export type WorkflowTraceBundle = {
  version: 1;
  events: WorkflowTraceEvent[];
  spans: WorkflowTraceSpan[];
  nativeHistory: WorkflowTraceNativeHistory | null;
  durationMs: number;
  warnings: string[];
};

export type TaskRequest = {
  id: string;
  payload: string;
  metadata?: Record<string, string>;
};

export type TaskResult = {
  id: string;
  value: string;
  score: number;
};

export type AggregateResult = {
  values: string[];
  totalScore: number;
  averageScore: number;
};

export type WorkflowInput = {
  workflowId: string;
  mode: WorkflowMode;
  tasks: TaskRequest[];
  quorum?: number;
  timeoutMs?: number;
  minimumJudgeScore?: number;
};

export type WorkflowStatus = 'complete' | 'partial' | 'timeout';

export type WorkflowOutcome = {
  workflowId: string;
  mode: WorkflowMode;
  status: WorkflowStatus;
  aggregate: AggregateResult;
  completedTaskIds: string[];
  pendingTaskIds: string[];
  reason: string;
  judgeScore?: number;
};

export type CompletenessDecision = {
  complete: boolean;
  score: number;
  reason: string;
};

export type CompletenessState = {
  input: WorkflowInput;
  completed: TaskResult[];
  pending: TaskRequest[];
};
