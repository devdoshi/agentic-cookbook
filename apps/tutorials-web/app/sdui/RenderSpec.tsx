import type { Spec } from '@json-render/core';
import { JSONUIProvider, Renderer } from '@json-render/react';
import { registry } from './registry.js';

export const RenderSpec = ({ spec }: { spec: Spec }) => {
  return (
    <JSONUIProvider registry={registry}>
      <Renderer spec={spec} registry={registry} />
    </JSONUIProvider>
  );
};
