import { useGameStore } from '@/stores/gameStore';
import { calculateLevel } from '@/utils/game';
import { createContext, PropsWithChildren, useContext, useEffect, useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';

const tracks: Record<string, string> = {
  Intro: "/audio/Intro.mp3",
  Death: "/audio/Game_Over.mp3",
  Beginning: "/audio/Start_Journey.mp3",
  Early: "/audio/Vault_Of_Whispers.mp3",
  RampUp: "/audio/Torchlit_Passage.mp3",
  Mid: "/audio/Trap_Door.mp3",
  Late: "/audio/Courage.mp3",
  SuperLate: "/audio/Hall_Of_A_Thousand_Eyes.mp3",
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
  const audioRef = useRef(new Audio(tracks.Intro));
  audioRef.current.loop = true;

  const [playing, setPlaying] = useState(isMobile ? true : false);
  const [volume, setVolume] = useState(0.5);
  const [muted, setMuted] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false)

  useEffect(() => {
    audioRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    const handleFirstInteraction = () => {
      setHasInteracted(true);
      if (playing) { audioRef.current.play().catch(() => { }); }
      document.removeEventListener('click', handleFirstInteraction);
    };
    document.addEventListener('click', handleFirstInteraction);
    return () => {
      document.removeEventListener('click', handleFirstInteraction);
    };
  }, []);

  useEffect(() => {
    playing ? audioRef.current.play().catch(() => { }) : audioRef.current.pause();
  }, [playing]);

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
      audioRef.current.src = newTrack;
      if (playing) {
        audioRef.current.load();
        audioRef.current.play();
      }
    }
  }, [gameId, adventurer, playing]);

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