
import BeastModeRewards from "@/dungeons/BeastModeRewards";
import { ChainId } from "@/utils/networkConfig";
import { ComponentType } from "react";
import { useParams } from "react-router-dom";

export interface Dungeon {
  id: string;
  name: string;
  network: ChainId;
  address: string;
  status: string;
  ticketAddress?: string;
  mainButtonText: string;
  externalLink?: string;
  includePractice?: boolean;
  rewards?: ComponentType;
  hideController?: boolean;
}

export const DUNGEONS: Record<string, Dungeon> = {
  "survivor": {
    id: "survivor",
    name: "Beast Mode",
    network: ChainId.SN_MAIN,
    address: "0x00a67ef20b61a9846e1c82b411175e6ab167ea9f8632bd6c2091823c3629ec42",
    status: "online",
    ticketAddress: "0x0452810188C4Cb3AEbD63711a3b445755BC0D6C4f27B923fDd99B1A118858136",
    mainButtonText: "Buy Game",
    includePractice: true,
    rewards: BeastModeRewards
  },
  "budokan": {
    id: "budokan",
    name: "Tournaments",
    network: ChainId.SN_MAIN,
    address: "0x58f888ba5897efa811eca5e5818540d35b664f4281660cd839cd5a4b0bf4582",
    status: "online",
    mainButtonText: "Enter Tournament",
    externalLink: "https://budokan.gg/"
  },
  "trials": {
    id: "trials",
    name: "Trials",
    network: ChainId.WP_PG_SLOT,
    address: "0x56a32ac6baa3d3e2634d55e6f2ca07bfee4ab09c6c6f0b93d456b0a6da4c84c",
    status: "online",
    mainButtonText: "Start Game",
    hideController: true
  },
}

export const useDungeon = () => {
  const { dungeonId } = useParams();

  const dungeon = DUNGEONS[dungeonId || "survivor"];

  return dungeon;
}
