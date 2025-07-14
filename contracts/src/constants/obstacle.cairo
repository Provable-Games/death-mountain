// SPDX-License-Identifier: MIT

pub mod ObstacleSettings {
    // Determines the minimum damage an obstacle can do
    pub const MINIMUM_DAMAGE: u16 = 2;
    pub const DAMAGE_BOOST: u16 = 0;
    pub const MINIMUM_XP_REWARD: u16 = 4;
}

pub mod ObstacleId {
    // Magical Obstacles
    pub const DemonicAlter: u8 = 1; //T1
    pub const VortexOfDespair: u8 = 2; //T1
    pub const EldritchBarrier: u8 = 3; //T1
    pub const SoulTrap: u8 = 4; //T1
    pub const PhantomVortex: u8 = 5; //T1
    pub const EctoplasmicWeb: u8 = 6; //T2
    pub const SpectralChains: u8 = 7; //T2
    pub const InfernalPact: u8 = 8; //T2
    pub const ArcaneExplosion: u8 = 9; //T2
    pub const HypnoticEssence: u8 = 10; // T2
    pub const MischievousSprites: u8 = 11; //T3
    pub const SoulDrainingStatue: u8 = 12; //T3
    pub const PetrifyingGaze: u8 = 13; //T3
    pub const SummoningCircle: u8 = 14; //T3
    pub const EtherealVoid: u8 = 15; //T3
    pub const MagicLock: u8 = 16; //T4
    pub const BewitchingFog: u8 = 17; //T4
    pub const IllusionaryMaze: u8 = 18; //T4
    pub const SpellboundMirror: u8 = 19; //T4
    pub const EnsnaringShadow: u8 = 20; //T4
    pub const DarkMist: u8 = 21; //T5
    pub const Curse: u8 = 22; //T5
    pub const HauntingEcho: u8 = 23; //T5
    pub const Hex: u8 = 24; //T5
    pub const GhostlyWhispers: u8 = 25; //T5

    // Sharp Obstacles
    pub const PendulumBlades: u8 = 26; //T1
    pub const IcyRazorWinds: u8 = 27; //T1
    pub const AcidicThorns: u8 = 28; //T1
    pub const DragonsBreath: u8 = 29; //T1
    pub const PendulumScythe: u8 = 30; //T1
    pub const FlameJet: u8 = 31; // T2
    pub const PiercingIceDarts: u8 = 32; //T2
    pub const GlassSandStorm: u8 = 33; //T2
    pub const PoisonedDartWall: u8 = 34; //T2
    pub const SpinningBladeWheel: u8 = 35; //T2
    pub const PoisonDart: u8 = 36; // T3
    pub const SpikedTumbleweed: u8 = 37; //T3
    pub const Thunderbolt: u8 = 38; //T3
    pub const GiantBearTrap: u8 = 39; //T3
    pub const SteelNeedleRain: u8 = 40; //T3
    pub const SpikedPit: u8 = 41; // T4
    pub const DiamondDustStorm: u8 = 42; //T4
    pub const TrapdoorScorpionPit: u8 = 43; //T4
    pub const BladedFan: u8 = 44; //T4
    pub const BearTrap: u8 = 45; //T4
    pub const PorcupineQuill: u8 = 46; //T5
    pub const HiddenArrow: u8 = 47; // T5
    pub const GlassShard: u8 = 48; //T5
    pub const ThornBush: u8 = 49; //T5
    pub const JaggedRocks: u8 = 50; //T5

    // Crushing Obstacles
    pub const CollapsingCeiling: u8 = 51; //T1
    pub const Rockslide: u8 = 52; //T1
    pub const FlashFlood: u8 = 53; //T1
    pub const ClingingRoots: u8 = 54; //T1
    pub const CollapsingCavern: u8 = 55; //T1
    pub const CrushingWalls: u8 = 56; //T2
    pub const SmashingPillars: u8 = 57; //T2
    pub const RumblingCatacomb: u8 = 58; //T2
    pub const WhirlingCyclone: u8 = 59; //T2
    pub const EruptingEarth: u8 = 60; //T2
    pub const SubterraneanTremor: u8 = 61; //T3
    pub const FallingChandelier: u8 = 62; //T3
    pub const CollapsingBridge: u8 = 63; //T3
    pub const RagingSandstorm: u8 = 64; //T3
    pub const AvalanchingRocks: u8 = 65; //T3
    pub const TumblingBoulders: u8 = 66; // T4
    pub const SlammingIronGate: u8 = 67; //T4
    pub const ShiftingSandtrap: u8 = 68; //T4
    pub const EruptingMudGeyser: u8 = 69; //T4
    pub const CrumblingStaircase: u8 = 70; //T4
    pub const SwingingLogs: u8 = 71; //T5
    pub const UnstableCliff: u8 = 72; //T5
    pub const TopplingStatue: u8 = 73; //T5
    pub const TumblingBarrels: u8 = 74; //T5
    pub const RollingBoulder: u8 = 75; //T5

    // If you add obstacle, make sure to update MAX_ID below
    pub const MAX_ID: u8 = 75;
}
