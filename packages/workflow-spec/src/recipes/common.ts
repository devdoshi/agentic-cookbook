import type { TaskResult } from '../types.js';

export const aggregateResults = (results: TaskResult[]) => {
  const totalScore = results.reduce((sum, item) => sum + item.score, 0);
  return {
    values: results.map((item) => item.value),
    totalScore,
    averageScore: results.length === 0 ? 0 : totalScore / results.length,
  };
};

export const assertUniqueTaskIds = (ids: string[]): void => {
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) {
      throw new Error(`duplicate task id: ${id}`);
    }
    seen.add(id);
  }
};
