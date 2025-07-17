import { create } from 'zustand'

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
}

export const useUIStore = create<UIState>((set) => ({
  // Game settings
  setGameSettingsListOpen: (isOpen) => set({ isGameSettingsListOpen: isOpen }),
  setGameSettingsDialogOpen: (isOpen) => set({ isGameSettingsDialogOpen: isOpen }),
  setGameSettingsEdit: (edit) => set({ gameSettingsEdit: edit }),
  setSelectedSettingsId: (id) => set({ selectedSettingsId: id }),
  isGameSettingsListOpen: false,
  isGameSettingsDialogOpen: false,
  gameSettingsEdit: false,
  selectedSettingsId: null,
  
  // Client preferences
  setUseMobileClient: (useMobile) => {
    // Save to localStorage
    localStorage.setItem('useMobileClient', useMobile.toString());
    set({ useMobileClient: useMobile });
  },
  useMobileClient: (() => {
    // Load from localStorage on initialization
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('useMobileClient');
      return stored ? stored === 'true' : false;
    }
    return false;
  })(),
}))
