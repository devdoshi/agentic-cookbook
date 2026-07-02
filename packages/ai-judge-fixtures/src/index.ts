import type {
  CompletenessDecision,
  CompletenessJudgePort,
  CompletenessState,
} from '@agentic-cookbook/workflow-spec';
import fixture from '../fixtures/default.json' with { type: 'json' };

type ReplayFixture = {
  threshold: number;
  scoresByCompletedCount: Record<string, number>;
};

export class FixtureReplayJudge implements CompletenessJudgePort {
  constructor(
    private readonly replay: ReplayFixture = fixture as ReplayFixture,
  ) {}

  async evaluate(state: CompletenessState): Promise<CompletenessDecision> {
    const key = String(state.completed.length);
    const score =
      this.replay.scoresByCompletedCount[key] ??
      this.replay.scoresByCompletedCount[
        String(
          Math.max(
            0,
            Object.keys(this.replay.scoresByCompletedCount).length - 1,
          ),
        )
      ] ??
      0;

    const complete = score >= this.replay.threshold;
    return {
      complete,
      score,
      reason: complete
        ? 'fixture replay threshold reached'
        : 'fixture replay below threshold',
    };
  }
}
