import { AsyncLocalStorage } from "node:async_hooks";

type RequestContext = {
  requestId: string;
  actorUserId?: string;
  actorType?: "USER" | "GUEST" | "SYSTEM";
};

const storage = new AsyncLocalStorage<RequestContext>();

export function runWithContext<T>(context: RequestContext, fn: () => T): T {
  return storage.run(context, fn);
}

export function getRequestContext(): RequestContext | undefined {
  return storage.getStore();
}

export function getRequestId(): string | undefined {
  return storage.getStore()?.requestId;
}

export function setContextActor(actorUserId: string | undefined, actorType: "USER" | "GUEST" | "SYSTEM") {
  const context = storage.getStore();
  if (context) {
    context.actorUserId = actorUserId;
    context.actorType = actorType;
  }
}
