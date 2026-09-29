import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';

// Re-export shallow for consumers
export { shallow };

export interface FollowedPlayer {
  address: string;
  name: string;
  followedAt: number;
}

interface FollowState {
  // Map of address -> FollowedPlayer
  followedPlayers: Record<string, FollowedPlayer>;

  // Actions
  followPlayer: (address: string, name: string) => void;
  unfollowPlayer: (address: string) => void;
  isFollowing: (address: string) => boolean;
  getFollowedAddresses: () => string[];
  getFollowedCount: () => number;
}

export const useFollowStore = create<FollowState>()(
  persist(
    (set, get) => ({
      followedPlayers: {},

      followPlayer: (address: string, name: string) => {
        const normalizedAddress = address.toLowerCase();
        set((state) => ({
          followedPlayers: {
            ...state.followedPlayers,
            [normalizedAddress]: {
              address: normalizedAddress,
              name,
              followedAt: Date.now(),
            },
          },
        }));
      },

      unfollowPlayer: (address: string) => {
        const normalizedAddress = address.toLowerCase();
        set((state) => {
          const { [normalizedAddress]: _, ...rest } = state.followedPlayers;
          return { followedPlayers: rest };
        });
      },

      isFollowing: (address: string) => {
        const normalizedAddress = address.toLowerCase();
        return normalizedAddress in get().followedPlayers;
      },

      getFollowedAddresses: () => {
        return Object.keys(get().followedPlayers);
      },

      getFollowedCount: () => {
        return Object.keys(get().followedPlayers).length;
      },
    }),
    {
      name: 'followed-players',
      partialize: (state) => ({
        followedPlayers: state.followedPlayers,
      }),
    }
  )
);
