import path from 'node:path';

const escapeHtml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const docPathToRoute: Record<string, string> = {
  'getting-started.md': '/getting-started',
  'tutorials/hello-world.md': '/tutorials/hello-world',
  'runtime/semantics-matrix.md': '/runtime/semantics',
  'recipes/scatter-gather-basic.md': '/recipes/scatter-gather-basic',
  'recipes/scatter-gather-ai-complete.md':
    '/recipes/scatter-gather-ai-complete',
  'recipes/scatter-gather-quorum-timeout.md':
    '/recipes/scatter-gather-quorum-timeout',
  'scenarios/durable-execution.md': '/scenarios',
  'scenarios/scenario-authoring.md': '/scenarios',
};

const normalizeDocLink = (href: string, sourceDocPath: string): string => {
  if (
    href.startsWith('http://') ||
    href.startsWith('https://') ||
    href.startsWith('#') ||
    href.startsWith('mailto:') ||
    href.startsWith('/')
  ) {
    return href;
  }

  const [rawPath, hashFragment] = href.split('#', 2);
  const resolved = path.posix.normalize(
    path.posix.join(path.posix.dirname(sourceDocPath), rawPath),
  );

  const route = docPathToRoute[resolved];
  if (!route) {
    return href;
  }

  return hashFragment ? `${route}#${hashFragment}` : route;
};

const renderInline = (value: string, sourceDocPath: string): string => {
  const linked = value.replaceAll(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (_, label: string, href: string) => {
      const normalizedHref = normalizeDocLink(href, sourceDocPath);
      const safeHref = escapeHtml(normalizedHref);
      const safeLabel = escapeHtml(label);
      return `<a href="${safeHref}">${safeLabel}</a>`;
    },
  );

  return linked.replaceAll(
    /`([^`]+)`/g,
    (_, code: string) => `<code>${escapeHtml(code)}</code>`,
  );
};

export const renderMarkdown = (
  markdown: string,
  sourceDocPath: string,
): string => {
  const lines = markdown.replaceAll('\r\n', '\n').split('\n');
  const html: string[] = [];
  let inCodeFence = false;
  let listTag: 'ul' | 'ol' | undefined;
  let paragraph: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length === 0) {
      return;
    }

    html.push(`<p>${renderInline(paragraph.join(' '), sourceDocPath)}</p>`);
    paragraph = [];
  };

  const closeList = () => {
    if (!listTag) {
      return;
    }

    html.push(`</${listTag}>`);
    listTag = undefined;
  };

  const renderTable = (block: string[]) => {
    const parseCells = (line: string) =>
      line
        .split('|')
        .slice(1, -1)
        .map((cell) => cell.trim());

    const headerCells = parseCells(block[0]);
    const candidateSeparator = block[1];
    const hasSeparator =
      candidateSeparator !== undefined &&
      parseCells(candidateSeparator).every((cell) => /^:?-{3,}:?$/.test(cell));

    const rowStart = hasSeparator ? 2 : 1;
    const bodyRows = block.slice(rowStart).map(parseCells);

    html.push('<table>');
    html.push('<thead><tr>');
    for (const cell of headerCells) {
      html.push(`<th>${renderInline(cell, sourceDocPath)}</th>`);
    }
    html.push('</tr></thead>');
    html.push('<tbody>');
    for (const row of bodyRows) {
      html.push('<tr>');
      for (const cell of row) {
        html.push(`<td>${renderInline(cell, sourceDocPath)}</td>`);
      }
      html.push('</tr>');
    }
    html.push('</tbody>');
    html.push('</table>');
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmed = line.trim();

    if (trimmed.startsWith('```')) {
      flushParagraph();
      closeList();
      if (inCodeFence) {
        html.push('</code></pre>');
        inCodeFence = false;
      } else {
        html.push('<pre><code>');
        inCodeFence = true;
      }
      continue;
    }

    if (inCodeFence) {
      html.push(`${escapeHtml(line)}\n`);
      continue;
    }

    if (trimmed.length === 0) {
      flushParagraph();
      closeList();
      continue;
    }

    if (
      trimmed.startsWith('|') &&
      trimmed.endsWith('|') &&
      trimmed.includes(' | ')
    ) {
      flushParagraph();
      closeList();
      const tableBlock: string[] = [trimmed];

      while (index + 1 < lines.length) {
        const next = lines[index + 1].trim();
        if (!(next.startsWith('|') && next.endsWith('|'))) {
          break;
        }

        tableBlock.push(next);
        index += 1;
      }

      renderTable(tableBlock);
      continue;
    }

    const heading = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      flushParagraph();
      closeList();
      const level = heading[1].length;
      html.push(
        `<h${level}>${renderInline(heading[2], sourceDocPath)}</h${level}>`,
      );
      continue;
    }

    const unordered = trimmed.match(/^-\s+(.*)$/);
    if (unordered) {
      flushParagraph();
      if (listTag !== 'ul') {
        closeList();
        html.push('<ul>');
        listTag = 'ul';
      }
      html.push(`<li>${renderInline(unordered[1], sourceDocPath)}</li>`);
      continue;
    }

    const ordered = trimmed.match(/^\d+\.\s+(.*)$/);
    if (ordered) {
      flushParagraph();
      if (listTag !== 'ol') {
        closeList();
        html.push('<ol>');
        listTag = 'ol';
      }
      html.push(`<li>${renderInline(ordered[1], sourceDocPath)}</li>`);
      continue;
    }

    paragraph.push(trimmed);
  }

  flushParagraph();
  closeList();

  if (inCodeFence) {
    html.push('</code></pre>');
  }

  return html.join('\n');
};
