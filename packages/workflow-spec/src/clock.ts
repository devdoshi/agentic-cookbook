import type { ClockPort } from './ports.js';

export const createDeterministicClock = (
  startMs = 0,
  tickMs = 5,
): ClockPort => {
  let currentMs = startMs;
  return {
    now() {
      currentMs += tickMs;
      return currentMs;
    },
  };
};
