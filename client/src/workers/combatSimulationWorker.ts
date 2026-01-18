/// <reference lib="webworker" />

import type { Adventurer, Beast } from '@/types/game';
import {
  calculateCombatResult,
  type CombatSimulationOptions,
  type CombatSimulationResult,
} from '@/utils/combatSimulationCore';

interface CombatSimulationPayload {
  adventurer: Adventurer;
  beast: Beast;
  options?: CombatSimulationOptions;
}

interface CombatSimulationRequest {
  id: number;
  payload: CombatSimulationPayload;
}

type CombatSimulationResponse =
  | { id: number; result: CombatSimulationResult }
  | { id: number; error: string };

const serializeError = (error: unknown): string => {
  if (!error) {
    return 'Unknown worker error';
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error) {
    return error.message || error.name || 'Unknown worker error';
  }

  return (error as { message?: unknown })?.message?.toString() ?? 'Unknown worker error';
};

const ctx: DedicatedWorkerGlobalScope = self as DedicatedWorkerGlobalScope;

ctx.onmessage = (event: MessageEvent<CombatSimulationRequest>) => {
  const { id, payload } = event.data;
  const { adventurer, beast, options } = payload;

  try {
    const result = calculateCombatResult(adventurer, beast, options);
    const response: CombatSimulationResponse = { id, result };
    ctx.postMessage(response);
  } catch (error) {
    const response: CombatSimulationResponse = { id, error: serializeError(error) };
    ctx.postMessage(response);
  }
};
