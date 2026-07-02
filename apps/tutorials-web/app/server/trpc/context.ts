import { randomUUID } from 'node:crypto';

export type TrpcContext = {
  requestId: string;
};

export const createTrpcContext = async (): Promise<TrpcContext> => ({
  requestId: randomUUID(),
});
