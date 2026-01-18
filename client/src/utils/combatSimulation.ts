import type { Adventurer, Beast } from '@/types/game';
import {
  type CombatSimulationOptions,
  CombatSimulationResult,
  defaultSimulationResult,
  calculateCombatResult,
} from './combatSimulationCore';

export type { CombatSimulationResult } from './combatSimulationCore';
export { defaultSimulationResult } from './combatSimulationCore';

const supportsWorkers = () => typeof window !== 'undefined' && typeof Worker !== 'undefined';

interface WorkerParams {
  adventurer: Adventurer;
  beast: Beast;
  options?: CombatSimulationOptions;
}

interface WorkerRequest {
  id: number;
  payload: WorkerParams;
}

interface WorkerSuccessResponse {
  id: number;
  result: CombatSimulationResult;
}

interface WorkerErrorResponse {
  id: number;
  error: string;
}

type WorkerResponse = WorkerSuccessResponse | WorkerErrorResponse;

const pendingWorkerRequests = new Map<number, { resolve: (result: CombatSimulationResult) => void; reject: (reason: unknown) => void }>();
let sharedWorker: Worker | null = null;
let nextWorkerRequestId = 0;

const resetWorker = (reason: unknown) => {
  const error = reason instanceof Error ? reason : new Error(String(reason ?? 'Unknown worker error'));

  pendingWorkerRequests.forEach(({ reject }) => {
    reject(error);
  });
  pendingWorkerRequests.clear();

  if (sharedWorker) {
    sharedWorker.terminate();
    sharedWorker = null;
  }
};

const isWorkerResponse = (value: unknown): value is WorkerResponse => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<WorkerResponse>;
  return typeof candidate.id === 'number' && ('result' in candidate || 'error' in candidate);
};

const getWorker = () => {
  if (!supportsWorkers()) {
    return null;
  }

  if (!sharedWorker) {
    sharedWorker = new Worker(
      new URL('../workers/combatSimulationWorker.ts', import.meta.url),
      { type: 'module' },
    );

    sharedWorker.addEventListener('message', (event: MessageEvent<unknown>) => {
      if (!isWorkerResponse(event.data)) {
        return;
      }

      const pending = pendingWorkerRequests.get(event.data.id);
      if (!pending) {
        return;
      }

      pendingWorkerRequests.delete(event.data.id);

      if ('error' in event.data && event.data.error) {
        pending.reject(new Error(event.data.error));
        return;
      }

      if ('result' in event.data) {
        pending.resolve(event.data.result);
        return;
      }

      pending.reject(new Error('Received invalid response from combat simulation worker'));
    });

    sharedWorker.addEventListener('error', (event) => {
      resetWorker(event.error ?? event.message ?? new Error('Combat simulation worker error'));
    });

    sharedWorker.addEventListener('messageerror', () => {
      resetWorker(new Error('Combat simulation worker failed to deserialize message'));
    });
  }

  return sharedWorker;
};

const getErrorMessage = (error: unknown): string => {
  if (!error) {
    return '';
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof (error as ErrorEvent)?.message === 'string') {
    return (error as ErrorEvent).message;
  }

  if (typeof (error as { error?: unknown })?.error === 'object') {
    const nested = (error as { error?: { message?: unknown } }).error;
    if (nested && typeof (nested as { message?: unknown }).message === 'string') {
      return String((nested as { message?: unknown }).message);
    }
  }

  return '';
};

const isStackOverflowError = (error: unknown) => {
  const message = getErrorMessage(error).toLowerCase();
  return message.includes('maximum call stack') || message.includes('call stack size exceeded');
};

const runSimulationInline = (
  adventurer: Adventurer,
  beast: Beast,
  options: CombatSimulationOptions,
): CombatSimulationResult => {
  try {
    return calculateCombatResult(adventurer, beast, options);
  } catch (error) {
    if (isStackOverflowError(error)) {
      console.warn('Combat simulation exceeded call stack limit; returning default result instead.');
      return defaultSimulationResult;
    }

    throw error;
  }
};

const spawnWorker = (params: WorkerParams) =>
  new Promise<CombatSimulationResult>((resolve, reject) => {
    const worker = getWorker();

    if (!worker) {
      reject(new Error('Web Workers are not supported in this environment'));
      return;
    }

    const requestId = ++nextWorkerRequestId;
    pendingWorkerRequests.set(requestId, { resolve, reject });

    try {
      const request: WorkerRequest = {
        id: requestId,
        payload: params,
      };

      worker.postMessage(request);
    } catch (error) {
      pendingWorkerRequests.delete(requestId);
      resetWorker(error);
      reject(error);
    }
  });

export const simulateCombatOutcomes = async (
  adventurer: Adventurer | null | undefined,
  beast: Beast | null | undefined,
  options: CombatSimulationOptions = {},
): Promise<CombatSimulationResult> => {
  if (!adventurer || !beast || adventurer.health <= 0 || beast.health <= 0) {
    return defaultSimulationResult;
  }

  try {
    if (supportsWorkers()) {
      return await spawnWorker({ adventurer, beast, options });
    }

    return runSimulationInline(adventurer, beast, options);
  } catch (error) {
    if (isStackOverflowError(error)) {
      console.warn('Combat simulation failed due to stack overflow; returning default result.');
      return defaultSimulationResult;
    }

    console.error('combat simulation workers failed, falling back to single-threaded run', error);

    try {
      return runSimulationInline(adventurer, beast, options);
    } catch (fallbackError) {
      if (isStackOverflowError(fallbackError)) {
        console.warn('Combat simulation fallback also exceeded call stack; returning default result.');
        return defaultSimulationResult;
      }

      throw fallbackError;
    }
  }
};
