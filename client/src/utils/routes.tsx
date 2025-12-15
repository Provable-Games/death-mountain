import GamePage from "@/desktop/pages/GamePage";
import NotFoundPage from "@/desktop/pages/NotFoundPage";
import LandingPage from "@/desktop/pages/StartPage";
import WatchPage from "@/desktop/pages/WatchPage";

import { default as MobileGamePage } from "@/mobile/pages/GamePage";
import { default as MobileNotFoundPage } from "@/mobile/pages/NotFoundPage";
import { default as MobileStartPage } from "@/mobile/pages/StartPage";
import { default as MobileWatchPage } from "@/mobile/pages/WatchPage";

export const desktopRoutes = [
  {
    path: '/',
    content: <LandingPage />
  },
  {
    path: '/:dungeonId',
    content: <LandingPage />
  },
  {
    path: '/:dungeonId/play',
    content: <GamePage />
  },
  {
    path: '/:dungeonId/watch',
    content: <WatchPage />
  },
  {
    path: '*',
    content: <NotFoundPage />
  },
]

export const mobileRoutes = [
  {
    path: '/',
    content: <MobileStartPage />
  },
  {
    path: '/:dungeonId',
    content: <MobileStartPage />
  },
  {
    path: '/:dungeonId/play',
    content: <MobileGamePage />
  },
  {
    path: '/:dungeonId/watch',
    content: <MobileWatchPage />
  },
  {
    path: '*',
    content: <MobileNotFoundPage />
  }
]