import { createTrpcContext } from './context.js';
import { appRouter } from './root.js';

export const createServerTrpcCaller = async () => {
  const context = await createTrpcContext();
  return appRouter.createCaller(context);
};
