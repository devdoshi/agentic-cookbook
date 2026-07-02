import type {
  WorkflowInput,
  WorkflowOutcome,
  WorkflowTraceBundle,
} from '@agentic-cookbook/workflow-spec';

export type RuntimeId = 'temporal' | 'aws-durable';

export type WorkflowRunRequest = {
  runtime: RuntimeId;
  input: WorkflowInput;
  presetId?: string;
};

export type WorkflowRunResponse =
  | {
      kind: 'success';
      durationMs: number;
      outcome: WorkflowOutcome;
      trace: WorkflowTraceBundle;
    }
  | {
      kind: 'failure';
      durationMs: number;
      error: string;
      trace: WorkflowTraceBundle;
    };

export type ScenarioGroupId =
  | 'recipe-vectors'
  | 'durable-determinism'
  | 'durable-errors';

export type ScenarioRunRequest = {
  runtime: RuntimeId;
  scenarioGroup: ScenarioGroupId;
  scenarioName?: string;
};

export type ScenarioRunItem = {
  scenarioName: string;
  passed: boolean;
  details: string;
  trace?: WorkflowTraceBundle;
};

export type ScenarioRunResponse = {
  summary: {
    total: number;
    passed: number;
    failed: number;
    durationMs: number;
  };
  results: ScenarioRunItem[];
};
