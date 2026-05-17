// ============================================================
// QR BELL - Global State Store (Zustand)
// ============================================================
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserProfile, Property, RingEvent } from '@/types'

interface AppState {
  // User
  profile: UserProfile | null
  setProfile: (profile: UserProfile | null) => void

  // Properties
  properties: Property[]
  setProperties: (properties: Property[]) => void
  updateProperty: (id: string, updates: Partial<Property>) => void
  removeProperty: (id: string) => void

  // Live rings (for dashboard toast)
  liveRings: RingEvent[]
  addLiveRing: (ring: RingEvent) => void
  clearLiveRings: () => void

  // UI State
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void

  // Notifications
  unreadCount: number
  setUnreadCount: (count: number) => void
  incrementUnread: () => void
  resetUnread: () => void

  // PWA
  swRegistered: boolean
  setSwRegistered: (registered: boolean) => void
  pushSubscribed: boolean
  setPushSubscribed: (subscribed: boolean) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // User
      profile: null,
      setProfile: (profile) => set({ profile }),

      // Properties
      properties: [],
      setProperties: (properties) => set({ properties }),
      updateProperty: (id, updates) =>
        set((state) => ({
          properties: state.properties.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        })),
      removeProperty: (id) =>
        set((state) => ({
          properties: state.properties.filter((p) => p.id !== id),
        })),

      // Live rings
      liveRings: [],
      addLiveRing: (ring) =>
        set((state) => ({ liveRings: [ring, ...state.liveRings.slice(0, 9)] })),
      clearLiveRings: () => set({ liveRings: [] }),

      // UI
      sidebarOpen: false,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      // Notifications
      unreadCount: 0,
      setUnreadCount: (count) => set({ unreadCount: count }),
      incrementUnread: () => set((s) => ({ unreadCount: s.unreadCount + 1 })),
      resetUnread: () => set({ unreadCount: 0 }),

      // PWA
      swRegistered: false,
      setSwRegistered: (registered) => set({ swRegistered: registered }),
      pushSubscribed: false,
      setPushSubscribed: (subscribed) => set({ pushSubscribed: subscribed }),
    }),
    {
      name: 'qrbell-store',
      partialize: (state) => ({
        pushSubscribed: state.pushSubscribed,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
)
