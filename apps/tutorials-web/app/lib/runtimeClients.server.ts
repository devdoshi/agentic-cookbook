import {
  type AwsDurableRuntime,
  createAwsDurableRuntime,
} from '@agentic-cookbook/aws-durable-harness';
import {
  type TemporalRuntime,
  createTemporalRuntime,
} from '@agentic-cookbook/temporal-harness';
import type { WorkflowInput } from '@agentic-cookbook/workflow-spec';
import type { RuntimeId, WorkflowRunResponse } from '../types.js';

let temporalRuntime: TemporalRuntime | null = null;
let awsRuntime: AwsDurableRuntime | null = null;

const getTemporalRuntime = (): TemporalRuntime => {
  if (!temporalRuntime) {
    temporalRuntime = createTemporalRuntime();
  }

  return temporalRuntime;
};

const getAwsRuntime = (): AwsDurableRuntime => {
  if (!awsRuntime) {
    awsRuntime = createAwsDurableRuntime();
  }

  return awsRuntime;
};

export const runWorkflowInRuntime = async (
  runtime: RuntimeId,
  input: WorkflowInput,
): Promise<WorkflowRunResponse> => {
  switch (runtime) {
    case 'temporal':
      return getTemporalRuntime().run(input);
    case 'aws-durable':
      return getAwsRuntime().run(input);
    default:
      return {
        kind: 'failure',
        durationMs: 0,
        error: `unsupported runtime: ${String(runtime)}`,
        trace: {
          version: 1,
          events: [],
          spans: [],
          nativeHistory: null,
          durationMs: 0,
          warnings: ['unsupported runtime'],
        },
      };
  }
};

export const closeRuntimes = async () => {
  if (temporalRuntime) {
    await temporalRuntime.close();
    temporalRuntime = null;
  }

  if (awsRuntime) {
    await awsRuntime.close();
    awsRuntime = null;
  }
};
