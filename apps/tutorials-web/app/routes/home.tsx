import { RenderSpec } from '../sdui/RenderSpec.js';
import { buildHomePageSpec } from '../sdui/builders/pageBuilders.js';

export default function HomeRoute() {
  return <RenderSpec spec={buildHomePageSpec()} />;
}
