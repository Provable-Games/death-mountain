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