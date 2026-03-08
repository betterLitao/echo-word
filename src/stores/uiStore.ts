import { create } from 'zustand'

interface UIState {
  popupVisible: boolean
  currentPage: 'main' | 'onboarding'
  showPopup: () => void
  hidePopup: () => void
  setCurrentPage: (page: 'main' | 'onboarding') => void
}

export const useUIStore = create<UIState>((set) => ({
  popupVisible: false,
  currentPage: 'main',
  showPopup: () => set({ popupVisible: true }),
  hidePopup: () => set({ popupVisible: false }),
  setCurrentPage: (page) => set({ currentPage: page }),
}))
