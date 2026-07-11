"use client";

import { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SlideTabPanelProps {
  activeKey: string;
  direction: number;
  children: ReactNode;
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 48 : -48,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -48 : 48,
    opacity: 0,
  }),
};

export function SlideTabPanel({ activeKey, direction, children }: SlideTabPanelProps) {
  return (
    <div className="relative overflow-hidden mt-6">
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={activeKey}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: "spring", stiffness: 380, damping: 32, mass: 0.8 }}
          className="w-full"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
