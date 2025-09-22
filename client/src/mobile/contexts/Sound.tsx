import { useGameStore } from '@/stores/gameStore';
import { calculateLevel } from '@/utils/game';
import { createContext, PropsWithChildren, useContext, useEffect, useRef, useState } from 'react';

const tracks: Record<string, string> = {
  Intro: "https://media.lootsurvivor.io/Intro.mp3?v=2",
  Death: "https://media.lootsurvivor.io/Game_Over.mp3?v=2",
  Beginning: "https://media.lootsurvivor.io/Start_Journey.mp3?v=2",
  Early: "https://media.lootsurvivor.io/Vault_Of_Whispers.mp3?v=2",
  RampUp: "https://media.lootsurvivor.io/Torchlit_Passage.mp3?v=2",
  Mid: "https://media.lootsurvivor.io/Trap_Door.mp3?v=2",
  Late: "https://media.lootsurvivor.io/Courage.mp3?v=2",
  SuperLate: "https://media.lootsurvivor.io/Hall_Of_A_Thousand_Eyes.mp3?v=2",
};

interface SoundContextType {
  playing: boolean;
  muted: boolean;
  volume: number;
  hasInteracted: boolean;
  setMuted: (muted: boolean) => void;
  setPlaying: (playing: boolean) => void;
  setVolume: (volume: number) => void;
}

const SoundContext = createContext<SoundContextType>({
  playing: true,
  muted: false,
  volume: 1,
  hasInteracted: false,
  setMuted: () => { },
  setPlaying: () => { },
  setVolume: () => { },
});

export const SoundProvider = ({ children }: PropsWithChildren) => {
  const { gameId, adventurer } = useGameStore();

  const savedVolume = typeof window !== 'undefined' ? localStorage.getItem('soundVolume') : null;
  const savedMuted = typeof window !== 'undefined' ? localStorage.getItem('soundMuted') : null;

  const [playing, setPlaying] = useState(true);
  const [volume, setVolumeState] = useState(savedVolume ? parseFloat(savedVolume) : 0.5);
  const [muted, setMutedState] = useState(savedMuted === 'true');
  const [hasInteracted, setHasInteracted] = useState(false)

  const audioRef = useRef(new Audio(tracks.Intro));
  audioRef.current.crossOrigin = "anonymous";
  audioRef.current.loop = true;

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

  useEffect(() => {
    audioRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    if (!muted) {
      setPlaying(true);
    } else if (muted) {
      setPlaying(false);
    }
  }, [muted]);

  useEffect(() => {
    const handleFirstInteraction = () => {
      setHasInteracted(true);
      if (playing && !muted) {
        audioRef.current.play().catch(() => { });
      }

      document.removeEventListener('click', handleFirstInteraction);
    };
    document.addEventListener('click', handleFirstInteraction);
    return () => {
      document.removeEventListener('click', handleFirstInteraction);
    };
  }, [playing, muted]);

  useEffect(() => {
    if (playing && !muted) {
      audioRef.current.play().catch(() => { });
    } else {
      audioRef.current.pause();
    }
  }, [playing, muted]);

  useEffect(() => {
    let newTrack = null;
    if (!gameId || !adventurer) {
      newTrack = tracks.Intro;
    } else {
      if (adventurer.health === 0) {
        newTrack = tracks.Death;
      } else {
        const level = calculateLevel(adventurer.xp);
        if (level < 3) {
          newTrack = tracks.Beginning;
        } else if (level < 6) {
          newTrack = tracks.Early;
        } else if (level < 9) {
          newTrack = tracks.RampUp;
        } else if (level < 15) {
          newTrack = tracks.Mid;
        } else if (level < 25) {
          newTrack = tracks.Late;
        } else {
          newTrack = tracks.SuperLate;
        }
      }
    }

    if (newTrack && newTrack !== new URL(audioRef.current.src).pathname) {
      audioRef.current.crossOrigin = "anonymous";
      audioRef.current.src = newTrack;
      if (playing) {
        audioRef.current.load();
        audioRef.current.play();
      }
    }
  }, [gameId, adventurer, playing]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current.load();
      }
    };
  }, []);

  return (
    <SoundContext.Provider value={{
      playing,
      muted,
      volume,
      hasInteracted,
      setMuted,
      setPlaying,
      setVolume,
    }}>
      {children}
    </SoundContext.Provider>
  );
};

export const useSound = () => {
  return useContext(SoundContext);
}; 