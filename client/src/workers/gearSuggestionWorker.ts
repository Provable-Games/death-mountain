/// <reference lib="webworker" />

import type { Adventurer, Beast, Item } from '@/types/game';
import {
  EquipmentSlot,
  evaluateSelections,
} from '@/utils/gearSuggestionShared';

interface GearSuggestionWorkerMessage {
  adventurer: Adventurer;
  beast: Beast;
  selections: Array<Partial<Record<EquipmentSlot, Item>>>;
}

const ctx: DedicatedWorkerGlobalScope = self as DedicatedWorkerGlobalScope;

ctx.onmessage = (event: MessageEvent<GearSuggestionWorkerMessage>) => {
  const { adventurer, beast, selections } = event.data;
  const result = evaluateSelections(adventurer, beast, selections);
  ctx.postMessage(result);
};
