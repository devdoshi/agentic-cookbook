import { validateSpec } from '@json-render/core';
import { describe, expect, it } from 'vitest';
import { buildDocPageSpec, buildHomePageSpec } from '../pageBuilders.js';
import { buildRecipePageSpec } from '../recipeBuilder.js';
import { buildScenarioPageSpec } from '../scenarioBuilder.js';

const assertValidSpec = (spec: Parameters<typeof validateSpec>[0]) => {
  const issues = validateSpec(spec);
  expect(issues.valid).toBe(true);
};

describe('sdui builders', () => {
  it('builds a valid home page spec', () => {
    assertValidSpec(buildHomePageSpec());
  });

  it('builds a valid docs page spec', () => {
    assertValidSpec(
      buildDocPageSpec({
        title: 'Doc page',
        subtitle: 'Doc subtitle',
        html: '<h1>Doc</h1>',
      }),
    );
  });

  it('builds a recipe page spec with controls', () => {
    const spec = buildRecipePageSpec({
      title: 'Recipe',
      markdownHtml: '<h1>Recipe</h1>',
      presetOptions: [{ label: 'Default', value: 'default' }],
      activePreset: {
        id: 'default',
        label: 'Default',
        slug: 'scatter-gather-basic',
        input: {
          workflowId: 'wf',
          mode: 'basic',
          tasks: [{ id: 'a', payload: 'alpha' }],
        },
      },
      result: null,
    });

    assertValidSpec(spec);
    const elementTypes = Object.values(spec.elements).map((node) => node.type);
    expect(elementTypes).toContain('RuntimeSelector');
    expect(elementTypes).toContain('WorkflowJsonEditor');
    expect(elementTypes).toContain('RunButton');
    expect(elementTypes).toContain('TimelinePanel');
    expect(elementTypes).toContain('SpanWaterfall');
  });

  it('builds a scenario page spec with scenario table', () => {
    const spec = buildScenarioPageSpec({
      markdownHtml: '<h1>Scenario</h1>',
      groupOptions: [{ label: 'Recipe vectors', value: 'recipe-vectors' }],
      result: null,
    });

    assertValidSpec(spec);
    const elementTypes = Object.values(spec.elements).map((node) => node.type);
    expect(elementTypes).toContain('ScenarioTable');
    expect(elementTypes).toContain('ScenarioTraceInspector');
    expect(elementTypes).toContain('NativeHistoryPanel');
  });
});
