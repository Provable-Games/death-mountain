import GamePage from "@/desktop/pages/GamePage";
import LandingPage from "@/desktop/pages/StartPage";
import NotFoundPage from "@/desktop/pages/NotFoundPage";
import WatchPage from "@/desktop/pages/WatchPage";
import ClaimPage from "@/desktop/pages/ClaimPage";

import { default as MobileCampaignPage } from "@/mobile/pages/CampaignPage";
import { default as MobileGamePage } from "@/mobile/pages/GamePage";
import { default as MobileStartPage } from "@/mobile/pages/StartPage";
import { default as MobileWatchPage } from "@/mobile/pages/WatchPage";
import { default as MobileNotFoundPage } from "@/mobile/pages/NotFoundPage";
import { default as MobileClaimPage } from "@/mobile/pages/ClaimPage";

export const desktopRoutes = [
  {
    path: '/',
    content: <LandingPage />
  },
  {
    path: '/survivor',
    content: <LandingPage />
  },
  {
    path: '/survivor/play',
    content: <GamePage />
  },
  {
    path: '/survivor/watch',
    content: <WatchPage />
  },
  {
    path: '/survivor/claim',
    content: <ClaimPage />
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
    path: '/survivor',
    content: <MobileStartPage />
  },
  {
    path: '/survivor/play',
    content: <MobileGamePage />
  },
  {
    path: '/survivor/watch',
    content: <MobileWatchPage />
  },
  {
    path: '/survivor/campaign',
    content: <MobileCampaignPage />
  },
  {
    path: '/survivor/claim',
    content: <MobileClaimPage />
  },
  {
    path: '*',
    content: <MobileNotFoundPage />
  }
]