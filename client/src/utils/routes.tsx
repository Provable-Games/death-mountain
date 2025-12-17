import GamePage from "@/desktop/pages/GamePage";
import NotFoundPage from "@/desktop/pages/NotFoundPage";
import LandingPage from "@/desktop/pages/StartPage";
import WatchPage from "@/desktop/pages/WatchPage";

import { default as MobileGamePage } from "@/mobile/pages/GamePage";
import { default as MobileNotFoundPage } from "@/mobile/pages/NotFoundPage";
import { default as MobileStartPage } from "@/mobile/pages/StartPage";
import { default as MobileWatchPage } from "@/mobile/pages/WatchPage";

import { useDynamicConnector } from "@/contexts/starknet";
import { useDungeon } from "@/dojo/useDungeon";
import { ReactNode, useEffect } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { ChainId, getNetworkConfig, NetworkConfig } from "./networkConfig";

function DungeonRoute({ children }: { children: ReactNode }) {
  const [searchParams] = useSearchParams();
  let dungeon = useDungeon();
  const { currentNetworkConfig, setCurrentNetworkConfig } = useDynamicConnector();
  const mode = searchParams.get("mode");

  useEffect(() => {
    if (mode === "practice") {
      setCurrentNetworkConfig(getNetworkConfig(ChainId.WP_PG_SLOT) as NetworkConfig);
      return;
    }

    if (dungeon && dungeon.network !== currentNetworkConfig.chainId) {
      setCurrentNetworkConfig(
        getNetworkConfig(dungeon.network) as NetworkConfig
      );
    }
  }, [dungeon, mode]);

  if (!dungeon) {
    return <NotFoundPage />
  }

  if (mode !== "practice" && dungeon.network !== currentNetworkConfig.chainId) {
    return null;
  }

  return <>{children}</>;
}

export const desktopRoutes = [
  {
    path: '/',
    content: <Navigate to="/survivor" replace />,
  },
  {
    path: '/:dungeonId',
    content: (
      <DungeonRoute>
        <LandingPage />
      </DungeonRoute>
    )
  },
  {
    path: '/:dungeonId/play',
    content: (
      <DungeonRoute>
        <GamePage />
      </DungeonRoute>
    )
  },
  {
    path: '/:dungeonId/watch',
    content: (
      <DungeonRoute>
        <WatchPage />
      </DungeonRoute>
    )
  },
  {
    path: '*',
    content: <NotFoundPage />
  },
]

export const mobileRoutes = [
  {
    path: '/',
    content: <Navigate to="/survivor" replace />,
  },
  {
    path: '/:dungeonId',
    content: (
      <DungeonRoute>
        <MobileStartPage />
      </DungeonRoute>
    )
  },
  {
    path: '/:dungeonId/play',
    content: (
      <DungeonRoute>
        <MobileGamePage />
      </DungeonRoute>
    )
  },
  {
    path: '/:dungeonId/watch',
    content: (
      <DungeonRoute>
        <MobileWatchPage />
      </DungeonRoute>
    )
  },
  {
    path: '*',
    content: <MobileNotFoundPage />
  }
]