import { useGameStore } from '@/stores/gameStore';
import { createContext, PropsWithChildren, useContext, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

const tracks: Record<string, string> = {
  Intro: "https://media.lootsurvivor.io/LS2_2.mp3?v=2",
  Death: "https://media.lootsurvivor.io/LS2_4.mp3?v=2",
  Battle: "https://media.lootsurvivor.io/LS2_3.mp3?v=2",
  Background: "https://media.lootsurvivor.io/background.mp3?v=2",
};

class AudioManager {
  private primary: HTMLAudioElement;
  private background: HTMLAudioElement | null = null;
  private isTransitioning = false;
  private currentTrack: string | null = null;

  constructor() {
    this.primary = new Audio();
    this.primary.crossOrigin = 'anonymous';
    this.primary.loop = true;
    // Don't create background audio until we need it
  }

  setVolume(volume: number) {
    this.primary.volume = volume;
    if (this.background) {
      this.background.volume = volume;
    }
  }

  async play() {
    // Only start background if we're currently playing background track
    if (!this.currentTrack) {
      if (!this.background) {
        this.background = new Audio(tracks.Background);
        this.background.crossOrigin = 'anonymous';
        this.background.loop = true;
      }
      await this.background.play().catch(() => { });
    } else {
      await this.primary.play().catch(() => { });
    }
  }

  pause() {
    this.primary.pause();
    if (this.background) {
      this.background.pause();
    }
  }

  async switchToTrack(trackPath: string | null, volume: number) {
    // If we're already playing background and want to play background, just return
    if (!trackPath && !this.currentTrack && !this.isTransitioning) {
      return;
    }

    // Allow overriding transitions when switching between specific tracks
    // Only block transitions when switching to/from background
    const isSwitchingToBackground = !trackPath;
    const isSwitchingFromBackground = !this.currentTrack;

    if (this.isTransitioning && (isSwitchingToBackground || isSwitchingFromBackground)) {
      return; // Block only background-related transitions
    }

    this.isTransitioning = true;
    this.currentTrack = trackPath;

    if (!trackPath) {
      // Switch to background
      if (!this.background) {
        this.background = new Audio(tracks.Background);
        this.background.crossOrigin = 'anonymous';
        this.background.loop = true;
      }
      await this.crossfade(this.primary, this.background, volume);
      this.primary.src = '';
    } else {
      // Switch to specific track
      this.primary.src = trackPath;
      await this.primary.load();
      if (this.background) {
        await this.crossfade(this.background, this.primary, volume);
      } else {
        // No background to crossfade from, just start the primary track
        this.primary.volume = volume;
        await this.primary.play().catch(() => { });
      }
    }

    this.isTransitioning = false;
  }

  private async crossfade(from: HTMLAudioElement, to: HTMLAudioElement, targetVolume: number) {
    const duration = 2000;
    const startTime = Date.now();
    const fromStartVolume = from.volume;
    const toStartVolume = to.volume;

    // Start the target audio
    await to.play().catch(() => { });

    return new Promise<void>((resolve) => {
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeInOut = progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;

        // Ensure combined volume never exceeds target volume
        const fromVolume = fromStartVolume * (1 - easeInOut);
        const toVolume = toStartVolume + (targetVolume - toStartVolume) * easeInOut;
        
        // Scale down both volumes if their sum exceeds target volume
        const combinedVolume = fromVolume + toVolume;
        const scaleFactor = combinedVolume > targetVolume ? targetVolume / combinedVolume : 1;
        
        from.volume = fromVolume * scaleFactor;
        to.volume = toVolume * scaleFactor;

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          from.volume = 0;
          to.volume = targetVolume;
          from.pause();
          resolve();
        }
      };

      requestAnimationFrame(animate);
    });
  }

  // Force stop current transition and immediately switch to new track
  async forceSwitchToTrack(trackPath: string | null, volume: number) {
    this.isTransitioning = false; // Stop any current transition
    this.currentTrack = trackPath;

    if (!trackPath) {
      // Switch to background
      this.primary.pause();
      this.primary.src = '';
      if (!this.background) {
        this.background = new Audio(tracks.Background);
        this.background.crossOrigin = 'anonymous';
        this.background.loop = true;
      }
      this.background.volume = volume;
      await this.background.play().catch(() => { });
    } else {
      // Switch to specific track
      if (this.background) {
        this.background.pause();
      }
      this.primary.src = trackPath;
      await this.primary.load();
      this.primary.volume = volume;
      await this.primary.play().catch(() => { });
    }
  }

  resetBackgroundMusic() {
    if (this.background) {
      this.background.currentTime = 0;
    }
  }

  destroy() {
    this.primary.pause();
    this.primary.src = '';
    if (this.background) {
      this.background.pause();
      this.background.src = '';
    }
  }
}

interface SoundContextType {
  muted: boolean;
  volume: number;
  musicVolume: number;
  musicMuted: boolean;
  hasInteracted: boolean;
  setMuted: (muted: boolean) => void;
  setVolume: (volume: number) => void;
  setMusicVolume: (musicVolume: number) => void;
  setMusicMuted: (musicMuted: boolean) => void;
}

const SoundContext = createContext<SoundContextType>({
  muted: false,
  volume: 0.5,
  musicVolume: 0.25,
  musicMuted: false,
  hasInteracted: false,
  setMuted: () => { },
  setVolume: () => { },
  setMusicVolume: () => { },
  setMusicMuted: () => { },
});

export const SoundProvider = ({ children }: PropsWithChildren) => {
  const { gameId, adventurer, beast } = useGameStore();
  const location = useLocation();

  const savedVolume = typeof window !== 'undefined' ? localStorage.getItem('soundVolume') : null;
  const savedMuted = typeof window !== 'undefined' ? localStorage.getItem('soundMuted') : null;
  const savedMusicVolume = typeof window !== 'undefined' ? localStorage.getItem('musicVolume') : null;
  const savedMusicMuted = typeof window !== 'undefined' ? localStorage.getItem('musicMuted') : null;

  const [hasInteracted, setHasInteracted] = useState(false)
  const [volume, setVolumeState] = useState(savedVolume ? parseFloat(savedVolume) : 0.5);
  const [muted, setMutedState] = useState(savedMuted === 'true');
  const [musicVolume, setMusicVolumeState] = useState(savedMusicVolume ? parseFloat(savedMusicVolume) : 0.25);
  const [musicMuted, setMusicMutedState] = useState(savedMusicMuted === 'true');
  const [startTimestamp, setStartTimestamp] = useState(0);

  const audioManager = useRef(new AudioManager());

  const setVolume = (newVolume: number) => {
    setVolumeState(newVolume);
    if (typeof window !== 'undefined') {
      localStorage.setItem('soundVolume', newVolume.toString());
    }
  };

  const setMuted = (newMuted: boolean) => {
    setMutedState(newMuted);
    if (typeof window !== 'undefined') {
      localStorage.setItem('soundMuted', newMuted.toString());
    }
  };

  const setMusicVolume = (newVolume: number) => {
    setMusicVolumeState(newVolume);
    if (typeof window !== 'undefined') {
      localStorage.setItem('musicVolume', newVolume.toString());
    }
  };

  const setMusicMuted = (newMuted: boolean) => {
    setMusicMutedState(newMuted);
    if (typeof window !== 'undefined') {
      localStorage.setItem('musicMuted', newMuted.toString());
    }
  };

  useEffect(() => {
    audioManager.current.setVolume(musicVolume);
  }, [musicVolume]);

  useEffect(() => {
    const handleFirstInteraction = () => {
      setHasInteracted(true);
      if (!musicMuted) {
        audioManager.current.play();
      }
      document.removeEventListener('click', handleFirstInteraction);
    };
    document.addEventListener('click', handleFirstInteraction);
    return () => {
      document.removeEventListener('click', handleFirstInteraction);
    };
  }, [musicMuted]);

  useEffect(() => {
    if (hasInteracted) {
      if (!musicMuted) {
        audioManager.current.play();
      } else {
        audioManager.current.pause();
      }
    }
  }, [musicMuted, hasInteracted]);

  useEffect(() => {
    let newTrack = null;
    let isCriticalTrack = false;

    if (location.pathname === '/survivor/watch') {
      newTrack = null;
    } else if (location.pathname !== '/survivor/play') {
      newTrack = tracks.Intro;
      setStartTimestamp(0);
      audioManager.current.resetBackgroundMusic();
    } else {
      if (startTimestamp === 0) {
        setStartTimestamp(Date.now());
      }

      if (!gameId || !adventurer) {
        // Only play background music when we have a game and adventurer
        newTrack = null;
      } else if (adventurer.health === 0) {
        newTrack = tracks.Death;
        isCriticalTrack = true;
      } else if (Date.now() - startTimestamp < 122000) {
        // Play background music during the first 122 seconds of gameplay
        newTrack = null;
      } else if (beast) {
        newTrack = tracks.Battle;
      } else {
        // Continue playing background music after intro period
        newTrack = null;
      }
    }

    if (!musicMuted) {
      if (isCriticalTrack) {
        audioManager.current.forceSwitchToTrack(newTrack, musicVolume);
      } else {
        audioManager.current.switchToTrack(newTrack, musicVolume);
      }
    }
  }, [gameId, adventurer, beast, musicMuted, location.pathname]);

  useEffect(() => {
    return () => {
      audioManager.current.destroy();
    };
  }, []);

  return (
    <SoundContext.Provider value={{
      muted,
      musicVolume,
      musicMuted,
      volume,
      hasInteracted,
      setMuted,
      setMusicVolume,
      setMusicMuted,
      setVolume,
    }}>
      {children}
    </SoundContext.Provider>
  );
};

export const useSound = () => {
  return useContext(SoundContext);
}; 