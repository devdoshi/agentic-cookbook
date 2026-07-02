import type {
  WorkflowInput,
  WorkflowOutcome,
} from '@agentic-cookbook/workflow-spec';

type MaybePromise<T> = T | Promise<T>;

export type WorkflowRunResult =
  | {
      kind: 'success';
      outcome: WorkflowOutcome;
    }
  | {
      kind: 'failure';
      error: string;
    };

export type WorkflowRunner = (
  input: WorkflowInput,
) => Promise<WorkflowRunResult>;

export type WorkflowRuntimeId = 'temporal' | 'aws-durable' | string;

type WorkflowGivenStep = {
  name: string;
  apply: (input: WorkflowInput) => MaybePromise<WorkflowInput>;
};

type WorkflowWhenContext = {
  input: WorkflowInput;
  run: WorkflowRunner;
};

type WorkflowWhenStep = {
  name: string;
  run: (context: WorkflowWhenContext) => MaybePromise<WorkflowRunResult>;
};

type WorkflowThenContext = {
  input: WorkflowInput;
  run: WorkflowRunner;
  result: WorkflowRunResult;
};

type WorkflowThenStep = {
  name: string;
  assert: (context: WorkflowThenContext) => MaybePromise<void>;
};

type WorkflowScenarioData = {
  name: string;
  seedInput: WorkflowInput;
  givens: WorkflowGivenStep[];
  when: WorkflowWhenStep;
  thens: WorkflowThenStep[];
  supportedRuntimes?: Set<WorkflowRuntimeId>;
};

const defaultWhen: WorkflowWhenStep = {
  name: 'run workflow',
  run: async ({ input, run }) => run(input),
};

export class WorkflowScenario {
  private readonly data: WorkflowScenarioData;

  constructor(data: WorkflowScenarioData) {
    this.data = data;
  }

  get name(): string {
    return this.data.name;
  }

  branch(branchName: string): WorkflowScenario {
    return new WorkflowScenario({
      ...this.data,
      name: `${this.data.name} / ${branchName}`,
      givens: [...this.data.givens],
      thens: [...this.data.thens],
      supportedRuntimes: this.data.supportedRuntimes
        ? new Set(this.data.supportedRuntimes)
        : undefined,
    });
  }

  given(
    name: string,
    apply: (input: WorkflowInput) => MaybePromise<WorkflowInput>,
  ): WorkflowScenario {
    return new WorkflowScenario({
      ...this.data,
      givens: [...this.data.givens, { name, apply }],
    });
  }

  when(
    name: string,
    run: (context: WorkflowWhenContext) => MaybePromise<WorkflowRunResult>,
  ): WorkflowScenario {
    return new WorkflowScenario({
      ...this.data,
      when: { name, run },
    });
  }

  // biome-ignore lint/suspicious/noThenProperty: Domain DSL intentionally mirrors Given/When/Then wording.
  then(
    name: string,
    assert: (context: WorkflowThenContext) => MaybePromise<void>,
  ): WorkflowScenario {
    return new WorkflowScenario({
      ...this.data,
      thens: [...this.data.thens, { name, assert }],
    });
  }

  supportsRuntimes(...runtimeIds: WorkflowRuntimeId[]): WorkflowScenario {
    return new WorkflowScenario({
      ...this.data,
      supportedRuntimes: new Set(runtimeIds),
    });
  }

  supportsRuntime(runtimeId: WorkflowRuntimeId): boolean {
    if (!this.data.supportedRuntimes) {
      return true;
    }

    return this.data.supportedRuntimes.has(runtimeId);
  }

  async execute(run: WorkflowRunner): Promise<void> {
    let input = structuredClone(this.data.seedInput);

    for (const givenStep of this.data.givens) {
      try {
        input = await givenStep.apply(input);
      } catch (error) {
        throw new Error(
          `[${this.data.name}] given step "${givenStep.name}" failed`,
          { cause: error },
        );
      }
    }

    let result: WorkflowRunResult;
    try {
      result = await this.data.when.run({ input, run });
    } catch (error) {
      throw new Error(
        `[${this.data.name}] when step "${this.data.when.name}" failed`,
        {
          cause: error,
        },
      );
    }

    for (const thenStep of this.data.thens) {
      try {
        await thenStep.assert({ input, run, result });
      } catch (error) {
        throw new Error(
          `[${this.data.name}] then step "${thenStep.name}" failed`,
          { cause: error },
        );
      }
    }
  }
}

export const workflowScenario = (
  name: string,
  seedInput: WorkflowInput,
): WorkflowScenario =>
  new WorkflowScenario({
    name,
    seedInput,
    givens: [],
    when: defaultWhen,
    thens: [],
  });

export const toWorkflowTestCases = (
  scenarios: WorkflowScenario[],
  runtimeId: WorkflowRuntimeId,
  run: WorkflowRunner,
): Array<{ name: string; execute: () => Promise<void> }> =>
  scenarios
    .filter((scenario) => scenario.supportsRuntime(runtimeId))
    .map((scenario) => scenario.branch(runtimeId))
    .map((scenario) => ({
      name: scenario.name,
      execute: () => scenario.execute(run),
    }));

export const expectWorkflowSuccess = (
  result: WorkflowRunResult,
): WorkflowOutcome => {
  if (result.kind === 'success') {
    return result.outcome;
  }

  throw new Error(
    `expected workflow success, received failure: ${result.error}`,
  );
};

export const expectWorkflowFailure = (result: WorkflowRunResult): string => {
  if (result.kind === 'failure') {
    return result.error;
  }

  throw new Error('expected workflow failure, received success');
};
