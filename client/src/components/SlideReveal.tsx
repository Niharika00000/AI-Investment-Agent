"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";

interface SlideRevealProps {
  children: ReactNode;
  direction?: "left" | "right";
  delay?: number;
  className?: string;
}

export function SlideReveal({
  children,
  direction = "left",
  delay = 0,
  className = "",
}: SlideRevealProps) {
  const x = direction === "left" ? -56 : 56;

  return (
    <motion.div
      initial={{ opacity: 0, x }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ type: "spring", stiffness: 320, damping: 32, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
