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

  // Desktop helpers
  setShowHotkeys: (show: boolean) => void
  showHotkeys: boolean

  // Animations
  setSkipIntroOutro: (skip: boolean) => void
  setSkipAllAnimations: (skip: boolean) => void
  skipIntroOutro: boolean
  skipAllAnimations: boolean
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

      // Client preferences
      setUseMobileClient: (useMobile) => set({ useMobileClient: useMobile }),
      useMobileClient: false,

      // Desktop helpers
      setShowHotkeys: (show) => set({ showHotkeys: show }),
      showHotkeys: false,
    }),
    {
      name: 'death-mountain-ui-settings',
      partialize: (state) => ({
        useMobileClient: state.useMobileClient,
        skipIntroOutro: state.skipIntroOutro,
        skipAllAnimations: state.skipAllAnimations,
        showHotkeys: state.showHotkeys,
      }),
    }
  )
)
