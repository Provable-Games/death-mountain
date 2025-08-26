import { usePostHog } from "posthog-js/react";
import { track } from "@vercel/analytics";
import { calculateLevel } from "@/utils/game";

export const useAnalytics = () => {
  const posthog = usePostHog();

  const identifyAddress = ({ address }: { address: string }) => {
    posthog.identify(address, {
      wallet: address, // custom property on the person
      login_method: "controller", // optional metadata
    });
  };

  const gameStartedEvent = ({
    adventurerId,
    dungeon,
    settingsId,
    tokenAddress,
  }: {
    adventurerId: number;
    dungeon: string;
    settingsId: number;
    tokenAddress?: string;
  }) => {
    posthog?.capture("game_started", {
      adventurerId,
      dungeon,
      settingsId,
      payment_token: tokenAddress ?? null,
    });
    track("game_started", {
      dungeon,
      payment_token: tokenAddress ?? null,
    });
  };

  const playerDiedEvent = ({
    adventurerId,
    xp,
  }: {
    adventurerId: number;
    xp: number;
  }) => {
    posthog?.capture("player_died", {
      adventurerId,
      xp,
      level: calculateLevel(xp),
    });
    track("player_died", {
      level: calculateLevel(xp),
    });
  };

  return {
    identifyAddress,
    gameStartedEvent,
    playerDiedEvent,
  };
};
