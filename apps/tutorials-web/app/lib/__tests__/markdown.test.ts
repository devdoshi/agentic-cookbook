import { describe, expect, it } from 'vitest';
import { renderMarkdown } from '../markdown.js';

describe('renderMarkdown', () => {
  it('normalizes internal docs links to app routes', () => {
    const html = renderMarkdown(
      '[runtime](../runtime/semantics-matrix.md) [hello](./hello-world.md)',
      'tutorials/hello-world.md',
    );

    expect(html).toContain('href="/runtime/semantics"');
    expect(html).toContain('href="/tutorials/hello-world"');
  });

  it('keeps external links as-is', () => {
    const html = renderMarkdown(
      '[docs](https://example.com/docs)',
      'getting-started.md',
    );

    expect(html).toContain('href="https://example.com/docs"');
  });
});
