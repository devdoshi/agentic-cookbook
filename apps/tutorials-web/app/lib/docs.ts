import { readFile } from 'node:fs/promises';
import path from 'node:path';

const docsRoot = path.resolve(process.cwd(), '../../docs');

export const readDocFile = async (relativePath: string): Promise<string> => {
  const absolutePath = path.resolve(docsRoot, relativePath);
  return readFile(absolutePath, 'utf8');
};
