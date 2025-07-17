
export interface Quest {
  id: number;
  title: string;
  description: string;
  isLocked: boolean;
  requiredQuestId?: number;
  beastImage: string;
  beastName: string;
  settingsId: number;
  targetScore: number;
}

export interface Chapter {
  id: number;
  title: string;
  description: string;
  isLocked: boolean;
  requiredChapterId?: number;
  quests: Quest[];
  chapterImage: string;
  chapterBeast: string;
  unlockTime?: number; // Unix timestamp when chapter unlocks
  introVideo?: string; // URL to intro video
  outroVideo?: string; // URL to outro video
}

export const fetchCampaign = async (id: number) => {
  const chapters: Chapter[] = [
    {
      id: 1,
      title: "Chapter 1: First Steps",
      description: "Start your journey as an adventurer. Learn the basics of survival and combat in this first chapter.",
      isLocked: false,
      chapterImage: '/images/beasts/wyvern.png',
      chapterBeast: "Phoenix",
      quests: [
        {
          id: 1,
          title: "Basic Combat",
          description: "A wild beast approaches. What will you do?",
          isLocked: false,
          beastImage: '/images/beasts/troll.png',
          beastName: "Griffin",
          settingsId: 0,
          targetScore: 4
        },
        {
          id: 2,
          title: "Survival Instinct",
          description: "A powerful beast emerges from the shadows. Fight or flight?",
          isLocked: true,
          requiredQuestId: 1,
          beastImage: '/images/beasts/leviathan.png',
          beastName: "Wyvern",
          settingsId: 1,
          targetScore: 11
        },
        {
          id: 3,
          title: "The Right Gear",
          description: "Your current gear feels inadequate. Perhaps there's something in your inventory that could help.",
          isLocked: true,
          requiredQuestId: 2,
          beastImage: '/images/beasts/ghoul.png',
          beastName: "Phoenix",
          settingsId: 2,
          targetScore: 50
        },
        {
          id: 4,
          title: "Wisdom of the Hunt",
          description: "You sense an ambush coming, choose your stats wisely to avoid the beast's surprise attack.",
          isLocked: true,
          requiredQuestId: 3,
          beastImage: '/images/beasts/basilisk.png',
          beastName: "Basilisk",
          settingsId: 3,
          targetScore: 101
        },
        {
          id: 5,
          title: "Intelligence of the Path",
          description: "The path ahead is treacherous, use your intellect to navigate through the obstacles.",
          isLocked: true,
          requiredQuestId: 4,
          beastImage: '/images/beasts/anansi.png',
          beastName: "Anansi",
          settingsId: 4,
          targetScore: 133
        },
        {
          id: 6,
          title: "The Marketplace",
          description: "The marketplace teems with fine loot. A well-equipped adventurer is a living adventurer.",
          isLocked: true,
          requiredQuestId: 5,
          beastImage: '/images/beasts/chimera.png',
          beastName: "Chimera",
          settingsId: 5,
          targetScore: 81
        }
      ]
    },
    {
      id: 2,
      title: "Chapter 2: The Dark Forest",
      description: "Venture into the mysterious forest where stronger beasts and ancient secrets await.",
      isLocked: true,
      requiredChapterId: 1,
      chapterImage: '/images/beasts/chimera.png',
      chapterBeast: "Chimera",
      unlockTime: Date.now() + 360000000,
      quests: [
        {
          id: 6,
          title: "Forest Entrance",
          description: "Enter the dark forest and face its guardians",
          isLocked: true,
          requiredQuestId: 5,
          beastImage: '/images/beasts/wyvern.png',
          beastName: "Basilisk",
          settingsId: 6,
          targetScore: 600
        },
        {
          id: 7,
          title: "Ancient Ruins",
          description: "Explore the mysterious ruins within the forest",
          isLocked: true,
          requiredQuestId: 6,
          beastImage: '/images/beasts/wyvern.png',
          beastName: "Chimera",
          settingsId: 7,
          targetScore: 700
        },
        {
          id: 8,
          title: "The Corrupted Grove",
          description: "Clear the corruption from an ancient grove",
          isLocked: true,
          requiredQuestId: 7,
          beastImage: '/images/beasts/wyvern.png',
          beastName: "Hydra",
          settingsId: 8,
          targetScore: 800
        },
        {
          id: 9,
          title: "The Forest Guardian",
          description: "Face the ancient guardian of the forest",
          isLocked: true,
          requiredQuestId: 8,
          beastImage: '/images/beasts/wyvern.png',
          beastName: "Dragon",
          settingsId: 9,
          targetScore: 900
        },
        {
          id: 10,
          title: "The Heart of Darkness",
          description: "Confront the source of corruption in the forest",
          isLocked: true,
          requiredQuestId: 9,
          beastImage: '/images/beasts/wyvern.png',
          beastName: "Phoenix",
          settingsId: 10,
          targetScore: 1000
        }
      ]
    },
    {
      id: 3,
      title: "Chapter 3: The Mountain Pass",
      description: "Scale the treacherous mountains and face legendary creatures that guard ancient secrets.",
      isLocked: true,
      requiredChapterId: 2,
      chapterImage: '/images/beasts/dragon.png',
      chapterBeast: "Dragon",
      unlockTime: Date.now() + 360000000,
      quests: [
        {
          id: 11,
          title: "Mountain Trail",
          description: "Begin your ascent up the treacherous mountain",
          isLocked: true,
          requiredQuestId: 10,
          beastImage: '/images/beasts/wyvern.png',
          beastName: "Hydra",
          settingsId: 11,
          targetScore: 1100
        },
        {
          id: 12,
          title: "The Crystal Caves",
          description: "Explore the mysterious crystal caves",
          isLocked: true,
          requiredQuestId: 11,
          beastImage: '/images/beasts/wyvern.png',
          beastName: "Wyvern",
          settingsId: 12,
          targetScore: 1200
        },
        {
          id: 13,
          title: "The Frozen Peak",
          description: "Reach the frozen peak of the mountain",
          isLocked: true,
          requiredQuestId: 12,
          beastImage: '/images/beasts/wyvern.png',
          beastName: "Griffin",
          settingsId: 13,
          targetScore: 1300
        },
        {
          id: 14,
          title: "The Ancient Dragon",
          description: "Face the ancient dragon that guards the peak",
          isLocked: true,
          requiredQuestId: 13,
          beastImage: '/images/beasts/wyvern.png',
          beastName: "Dragon",
          settingsId: 14,
          targetScore: 1400
        },
        {
          id: 15,
          title: "The Mountain's Secret",
          description: "Uncover the secret hidden within the mountain",
          isLocked: true,
          requiredQuestId: 14,
          beastImage: '/images/beasts/wyvern.png',
          beastName: "Chimera",
          settingsId: 15,
          targetScore: 1500
        }
      ]
    },
    {
      id: 4,
      title: "Chapter 4: The Abyssal Depths",
      description: "Descend into the depths of the earth where ancient horrors and forgotten knowledge await.",
      isLocked: true,
      requiredChapterId: 3,
      chapterImage: '/images/beasts/hydra.png',
      chapterBeast: "Hydra",
      unlockTime: Date.now() + 360000000,
      quests: [
        {
          id: 16,
          title: "The Deep Entrance",
          description: "Enter the mysterious depths of the earth",
          isLocked: true,
          requiredQuestId: 15,
          beastImage: '/images/beasts/wyvern.png',
          beastName: "Basilisk",
          settingsId: 16,
          targetScore: 1600
        },
        {
          id: 17,
          title: "The Crystal Caverns",
          description: "Navigate through the treacherous crystal caverns",
          isLocked: true,
          requiredQuestId: 16,
          beastImage: '/images/beasts/wyvern.png',
          beastName: "Wyvern",
          settingsId: 17,
          targetScore: 1700
        },
        {
          id: 18,
          title: "The Abyssal Lake",
          description: "Cross the mysterious abyssal lake",
          isLocked: true,
          requiredQuestId: 17,
          beastImage: '/images/beasts/wyvern.png',
          beastName: "Hydra",
          settingsId: 18,
          targetScore: 1800
        },
        {
          id: 19,
          title: "The Ancient Temple",
          description: "Explore the ancient temple hidden in the depths",
          isLocked: true,
          requiredQuestId: 18,
          beastImage: '/images/beasts/wyvern.png',
          beastName: "Dragon",
          settingsId: 19,
          targetScore: 1900
        },
        {
          id: 20,
          title: "The Heart of the Abyss",
          description: "Confront the ancient horror at the heart of the abyss",
          isLocked: true,
          requiredQuestId: 19,
          beastImage: '/images/beasts/wyvern.png',
          beastName: "Phoenix",
          settingsId: 20,
          targetScore: 2000
        }
      ]
    },
    {
      id: 5,
      title: "Chapter 5: The Eternal Void",
      description: "Enter the realm between worlds where time and space have no meaning.",
      isLocked: true,
      requiredChapterId: 4,
      chapterImage: '/images/beasts/phoenix.png',
      chapterBeast: "Phoenix",
      unlockTime: Date.now() + 360000000,
      outroVideo: "https://example.com/videos/chapter5-outro.mp4",
      quests: [
        {
          id: 21,
          title: "The Void Gate",
          description: "Enter the mysterious void between worlds",
          isLocked: true,
          requiredQuestId: 20,
          beastImage: '/images/beasts/wyvern.png',
          beastName: "Griffin",
          settingsId: 21,
          targetScore: 2100
        },
        {
          id: 22,
          title: "The Time Rift",
          description: "Navigate through the unstable time rifts",
          isLocked: true,
          requiredQuestId: 21,
          beastImage: '/images/beasts/wyvern.png',
          beastName: "Wyvern",
          settingsId: 22,
          targetScore: 2200
        },
        {
          id: 23,
          title: "The Space Distortion",
          description: "Overcome the warped space of the void",
          isLocked: true,
          requiredQuestId: 22,
          beastImage: '/images/beasts/wyvern.png',
          beastName: "Hydra",
          settingsId: 23,
          targetScore: 2300
        },
        {
          id: 24,
          title: "The Eternal Guardian",
          description: "Face the guardian of the void",
          isLocked: true,
          requiredQuestId: 23,
          beastImage: '/images/beasts/wyvern.png',
          beastName: "Dragon",
          settingsId: 24,
          targetScore: 2400
        },
        {
          id: 25,
          title: "The Void's Secret",
          description: "Uncover the ultimate secret of the void",
          isLocked: true,
          requiredQuestId: 24,
          beastImage: '/images/beasts/wyvern.png',
          beastName: "Chimera",
          settingsId: 25,
          targetScore: 2500
        }
      ]
    }
  ];

  return chapters;
};