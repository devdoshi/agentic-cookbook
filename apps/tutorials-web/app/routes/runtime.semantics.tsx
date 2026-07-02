import { useLoaderData } from 'react-router';
import { readDocFile } from '../lib/docs.js';
import { renderMarkdown } from '../lib/markdown.js';
import { RenderSpec } from '../sdui/RenderSpec.js';
import { buildDocPageSpec } from '../sdui/builders/pageBuilders.js';

export const loader = async () => {
  const docPath = 'runtime/semantics-matrix.md';
  const markdown = await readDocFile(docPath);

  return {
    html: renderMarkdown(markdown, docPath),
  };
};

export default function RuntimeSemanticsRoute() {
  const data = useLoaderData<typeof loader>();
  return (
    <RenderSpec
      spec={buildDocPageSpec({
        title: 'Runtime Semantics Matrix',
        subtitle:
          'Cross-runtime caveats and comparison points for durable orchestration.',
        html: data.html,
      })}
    />
  );
}
