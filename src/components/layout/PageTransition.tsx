import React, { ReactNode } from 'react';
import { motion, AnimatePresence, useReducedMotion, Variants } from 'framer-motion';

export interface PageTransitionProps {
  currentKey: string;
  direction: number; // 1 for forward, -1 for backward
  children: ReactNode;
}

// Premium cubic-bezier easing: cubic-bezier(0.22, 1, 0.36, 1) as 4-tuple
export const CUBIC_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const PageTransition: React.FC<PageTransitionProps> = ({
  currentKey,
  direction,
  children,
}) => {
  const shouldReduceMotion = useReducedMotion();

  // Premium cinematic horizontal slide variants
  const slideVariants: Variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? '100%' : '-100%',
      opacity: 0.2,
      scale: 0.995,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        x: { duration: 0.75, ease: CUBIC_EASE },
        opacity: { duration: 0.55, ease: CUBIC_EASE },
        scale: { duration: 0.75, ease: CUBIC_EASE },
      },
    },
    exit: (dir: number) => ({
      x: dir > 0 ? '-100%' : '100%',
      opacity: 0.15,
      scale: 0.995,
      transition: {
        x: { duration: 0.75, ease: CUBIC_EASE },
        opacity: { duration: 0.45, ease: CUBIC_EASE },
        scale: { duration: 0.75, ease: CUBIC_EASE },
      },
    }),
  };

  const reducedMotionVariants: Variants = {
    enter: { opacity: 0 },
    center: { opacity: 1, transition: { duration: 0.35, ease: 'easeOut' } },
    exit: { opacity: 0, transition: { duration: 0.25, ease: 'easeIn' } },
  };

  return (
    <div className="relative w-full overflow-hidden min-h-[calc(100vh-140px)]">
      <AnimatePresence mode="popLayout" custom={direction} initial={false}>
        <motion.div
          key={currentKey}
          custom={direction}
          variants={shouldReduceMotion ? reducedMotionVariants : slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          className="w-full will-change-transform"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// Subtle Content Stagger Helpers (Section 5)
export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.08,
    },
  },
};

export const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: CUBIC_EASE,
    },
  },
};
