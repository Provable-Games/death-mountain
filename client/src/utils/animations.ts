import { Variants } from 'framer-motion';

export const eventItemVariants: Variants = {
  initial: { 
    opacity: 0,
    y: -20,
    scale: 0.95,
    filter: "blur(2px)"
  },
  animate: { 
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)"
  },
  exit: { 
    opacity: 0,
    y: 20,
    scale: 0.95,
    filter: "blur(2px)"
  }
};

export const eventItemTransition = (index: number) => ({
  type: "spring",
  stiffness: 500,
  damping: 30,
  mass: 1,
  delay: 0
});

export const eventBackgroundVariants: Variants = {
  initial: { backgroundColor: "rgba(128, 255, 0, 0.1)" },
  animate: { backgroundColor: "rgba(128, 255, 0, 0.05)" }
};

export const eventIconVariants: Variants = {
  initial: { scale: 0.8, rotate: -10 },
  animate: { scale: 1, rotate: 0 }
};

export const eventIconTransition = (index: number) => ({
  type: "spring",
  stiffness: 500,
  damping: 20,
  delay: 0.2
});

export const eventTextVariants: Variants = {
  initial: { x: -10, opacity: 0 },
  animate: { x: 0, opacity: 1 }
};

export const eventTextTransition = (index: number) => ({
  type: "spring",
  stiffness: 500,
  damping: 30,
  delay: 0.3
});

export const eventStatsTransition = (index: number) => ({
  type: "spring",
  stiffness: 500,
  damping: 30,
  delay: 0.4
});

export const screenVariants: Variants = {
  initial: { 
    opacity: 0,
    y: 20,
    scale: 0.98
  },
  animate: { 
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25,
      mass: 1,
      delay: 0.2
    }
  },
  exit: { 
    opacity: 0,
    y: -20,
    scale: 0.98,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25,
      mass: 1
    }
  }
};

export const fadeVariant = {
  initial: {
    opacity: 0
  },
  enter: {
    opacity: 1,
    transition: { duration: 0.5 }
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.5 }
  }
};

// Stat change animations for equip/unequip feedback (desktop - gold text)
export const statChangeVariants: Variants = {
  initial: {
    scale: 1,
  },
  increase: {
    scale: [1, 1.2, 1],
    color: ['#d0c98d', '#4caf50', '#4caf50', '#d0c98d'],
    textShadow: [
      '0 0 0px transparent',
      '0 0 10px rgba(76, 175, 80, 0.9)',
      '0 0 6px rgba(76, 175, 80, 0.5)',
      '0 0 0px transparent',
    ],
    transition: {
      duration: 1,
      ease: 'easeOut',
      times: [0, 0.15, 0.6, 1],
    },
  },
  decrease: {
    scale: [1, 1.2, 1],
    color: ['#d0c98d', '#ef5350', '#ef5350', '#d0c98d'],
    textShadow: [
      '0 0 0px transparent',
      '0 0 10px rgba(239, 83, 80, 0.9)',
      '0 0 6px rgba(239, 83, 80, 0.5)',
      '0 0 0px transparent',
    ],
    transition: {
      duration: 1,
      ease: 'easeOut',
      times: [0, 0.15, 0.6, 1],
    },
  },
};

// Stat change animations for mobile (green text #80FF00)
export const statChangeVariantsMobile: Variants = {
  initial: {
    scale: 1,
  },
  increase: {
    scale: [1, 1.2, 1],
    color: ['#80FF00', '#4caf50', '#4caf50', '#80FF00'],
    textShadow: [
      '0 0 0px transparent',
      '0 0 10px rgba(76, 175, 80, 0.9)',
      '0 0 6px rgba(76, 175, 80, 0.5)',
      '0 0 0px transparent',
    ],
    transition: {
      duration: 1,
      ease: 'easeOut',
      times: [0, 0.15, 0.6, 1],
    },
  },
  decrease: {
    scale: [1, 1.2, 1],
    color: ['#80FF00', '#ef5350', '#ef5350', '#80FF00'],
    textShadow: [
      '0 0 0px transparent',
      '0 0 10px rgba(239, 83, 80, 0.9)',
      '0 0 6px rgba(239, 83, 80, 0.5)',
      '0 0 0px transparent',
    ],
    transition: {
      duration: 1,
      ease: 'easeOut',
      times: [0, 0.15, 0.6, 1],
    },
  },
};