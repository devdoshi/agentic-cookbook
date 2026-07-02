import {
  canonicalizeOutcome,
  durableDeterminismScenarios,
  durableErrorScenarios,
  sharedVectors,
} from '@agentic-cookbook/test-kit';
import type {
  ScenarioRunItem,
  ScenarioRunRequest,
  ScenarioRunResponse,
} from '../types.js';
import { runWorkflowInRuntime } from './runtimeClients.server.js';

export const runScenarioRequest = async (
  request: ScenarioRunRequest,
): Promise<ScenarioRunResponse> => {
  const startedAt = Date.now();

  const vectorStatusByName = Object.fromEntries(
    sharedVectors.map((vector) => [vector.name, vector.expectedStatus]),
  );
  const errorSubstringByName = Object.fromEntries(
    durableErrorScenarios.map((scenario) => [
      scenario.name,
      scenario.expectedErrorSubstring,
    ]),
  );

  const scenarioCatalog = {
    'recipe-vectors': sharedVectors.map((vector) => ({
      name: vector.name,
      input: vector.input,
      evaluate: (outcomeOrError: string) =>
        outcomeOrError === vector.expectedStatus,
      detailLabel: `expected status ${vector.expectedStatus}`,
    })),
    'durable-determinism': durableDeterminismScenarios.map((scenario) => ({
      name: scenario.name,
      input: scenario.input,
      evaluate: (outcomeOrError: string) => outcomeOrError === 'match',
      detailLabel: 'expected deterministic replay match',
    })),
    'durable-errors': durableErrorScenarios.map((scenario) => ({
      name: scenario.name,
      input: scenario.input,
      evaluate: (outcomeOrError: string) =>
        outcomeOrError.includes(scenario.expectedErrorSubstring),
      detailLabel: `expected error to include ${scenario.expectedErrorSubstring}`,
    })),
  } as const;

  const selected = scenarioCatalog[request.scenarioGroup].filter((scenario) =>
    request.scenarioName ? scenario.name === request.scenarioName : true,
  );

  const results: ScenarioRunItem[] = [];

  for (const scenario of selected) {
    if (request.scenarioGroup === 'durable-determinism') {
      const first = await runWorkflowInRuntime(request.runtime, scenario.input);
      const second = await runWorkflowInRuntime(
        request.runtime,
        scenario.input,
      );

      let passed = false;
      let details = scenario.detailLabel;
      if (first.kind === 'success' && second.kind === 'success') {
        const firstCanonical = canonicalizeOutcome(first.outcome);
        const secondCanonical = canonicalizeOutcome(second.outcome);
        passed =
          JSON.stringify(firstCanonical) === JSON.stringify(secondCanonical);
        details = passed
          ? 'deterministic canonical outcomes matched'
          : 'deterministic canonical outcomes differed';
      } else {
        const failureMessage =
          first.kind === 'failure'
            ? first.error
            : second.kind === 'failure'
              ? second.error
              : 'unknown determinism failure';
        details = `determinism run failed: ${failureMessage}`;
      }

      results.push({
        scenarioName: scenario.name,
        passed,
        details,
        trace: first.trace,
      });
      continue;
    }

    const response = await runWorkflowInRuntime(
      request.runtime,
      scenario.input,
    );

    if (request.scenarioGroup === 'recipe-vectors') {
      const expectedStatus = vectorStatusByName[scenario.name];
      const actualStatus =
        response.kind === 'success' ? response.outcome.status : 'failure';
      const passed = actualStatus === expectedStatus;
      results.push({
        scenarioName: scenario.name,
        passed,
        details: passed
          ? `status matched: ${actualStatus}`
          : `expected ${expectedStatus}, got ${actualStatus}`,
        trace: response.trace,
      });
      continue;
    }

    const expectedSubstring = errorSubstringByName[scenario.name];
    const errorText = response.kind === 'failure' ? response.error : 'success';
    const passed = errorText.includes(expectedSubstring);
    results.push({
      scenarioName: scenario.name,
      passed,
      details: passed
        ? `error matched substring: ${expectedSubstring}`
        : `expected error containing ${expectedSubstring}, got ${errorText}`,
      trace: response.trace,
    });
  }

  const passed = results.filter((item) => item.passed).length;
  return {
    summary: {
      total: results.length,
      passed,
      failed: results.length - passed,
      durationMs: Date.now() - startedAt,
    },
    results,
  };
};
