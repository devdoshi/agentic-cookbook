import { useLoaderData } from 'react-router';
import { readDocFile } from '../lib/docs.js';
import { renderMarkdown } from '../lib/markdown.js';
import { RenderSpec } from '../sdui/RenderSpec.js';
import { buildDocPageSpec } from '../sdui/builders/pageBuilders.js';

export const loader = async () => {
  const docPath = 'tutorials/hello-world.md';
  const markdown = await readDocFile(docPath);

  return {
    html: renderMarkdown(markdown, docPath),
  };
};

export default function HelloWorldRoute() {
  const data = useLoaderData<typeof loader>();
  return (
    <RenderSpec
      spec={buildDocPageSpec({
        title: 'Hello World',
        subtitle:
          'First cross-runtime workflow walkthrough for Temporal and AWS durable.',
        html: data.html,
      })}
    />
  );
}
