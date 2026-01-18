import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIState {
  // Game settings
  setGameSettingsListOpen: (isOpen: boolean) => void
  setGameSettingsDialogOpen: (isOpen: boolean) => void
  setGameSettingsEdit: (edit: boolean) => void
  setSelectedSettingsId: (id: number | null) => void
  isGameSettingsListOpen: boolean
  isGameSettingsDialogOpen: boolean
  gameSettingsEdit: boolean
  selectedSettingsId: number | null

  // Client preferences
  setUseMobileClient: (useMobile: boolean) => void
  useMobileClient: boolean

  // Animations
  setSkipIntroOutro: (skip: boolean) => void
  setSkipAllAnimations: (skip: boolean) => void
  skipIntroOutro: boolean
  skipAllAnimations: boolean

  // Game
  setSkipFirstBattle: (skip: boolean) => void
  skipFirstBattle: boolean
  setFastBattle: (fast: boolean) => void
  fastBattle: boolean
  setAdvancedMode: (advanced: boolean) => void
  advancedMode: boolean
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // Game settings
      setGameSettingsListOpen: (isOpen) => set({ isGameSettingsListOpen: isOpen }),
      setGameSettingsDialogOpen: (isOpen) => set({ isGameSettingsDialogOpen: isOpen }),
      setGameSettingsEdit: (edit) => set({ gameSettingsEdit: edit }),
      setSelectedSettingsId: (id) => set({ selectedSettingsId: id }),
      isGameSettingsListOpen: false,
      isGameSettingsDialogOpen: false,
      gameSettingsEdit: false,
      selectedSettingsId: null,

      // Animations
      setSkipIntroOutro: (skip) => set({ skipIntroOutro: skip }),
      setSkipAllAnimations: (skip) => set({ skipAllAnimations: skip }),
      skipIntroOutro: false,
      skipAllAnimations: false,

      // Game
      setSkipFirstBattle: (skip) => set({ skipFirstBattle: skip }),
      skipFirstBattle: false,
      setFastBattle: (fast) => set({ fastBattle: fast }),
      fastBattle: false,
      setAdvancedMode: (advanced) => set({ advancedMode: advanced }),
      advancedMode: false,

      // Client preferences
      setUseMobileClient: (useMobile) => set({ useMobileClient: useMobile }),
      useMobileClient: false,
    }),
    {
      name: 'death-mountain-ui-settings',
      partialize: (state) => ({
        useMobileClient: state.useMobileClient,
        skipIntroOutro: state.skipIntroOutro,
        skipAllAnimations: state.skipAllAnimations,
        skipFirstBattle: state.skipFirstBattle,
        fastBattle: state.fastBattle,
        advancedMode: state.advancedMode,
      }),
    }
  )
)
