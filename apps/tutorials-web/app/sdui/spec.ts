import type { Spec } from '@json-render/core';

type SpecNode = {
  type: string;
  props?: Record<string, unknown>;
  children?: SpecNode[];
};

export const buildSpec = (node: SpecNode): Spec => {
  const elements: Spec['elements'] = {};
  let nextId = 0;

  const addNode = (current: SpecNode): string => {
    const id = `node-${nextId++}`;
    const childIds = (current.children ?? []).map((child) => addNode(child));

    elements[id] = {
      type: current.type,
      props: current.props ?? {},
      children: childIds,
    };

    return id;
  };

  const root = addNode(node);
  return { root, elements };
};
