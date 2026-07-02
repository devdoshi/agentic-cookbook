import { useLoaderData } from 'react-router';
import { readDocFile } from '../lib/docs.js';
import { renderMarkdown } from '../lib/markdown.js';
import { RenderSpec } from '../sdui/RenderSpec.js';
import { buildDocPageSpec } from '../sdui/builders/pageBuilders.js';

export const loader = async () => {
  const docPath = 'getting-started.md';
  const markdown = await readDocFile(docPath);

  return {
    html: renderMarkdown(markdown, docPath),
  };
};

export default function GettingStartedRoute() {
  const data = useLoaderData<typeof loader>();
  return (
    <RenderSpec
      spec={buildDocPageSpec({
        title: 'Getting Started',
        subtitle: 'Install, verify, and run local cookbook harnesses.',
        html: data.html,
      })}
    />
  );
}
