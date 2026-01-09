"use client";

import { cn } from "@/lib/utils";
import { motion } from "motion/react";

interface AnimatedGradientTextProps {
  children: React.ReactNode;
  className?: string;
}

export function AnimatedGradientText({
  children,
  className,
}: AnimatedGradientTextProps) {
  return (
    <motion.span
      initial={{ backgroundPosition: "0% 50%" }}
      animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
      transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
      className={cn(
        "inline-block bg-gradient-to-r from-blue-600 via-violet-600 to-pink-600 bg-[length:200%_auto] bg-clip-text text-transparent",
        className
      )}
    >
      {children}
    </motion.span>
  );
}

interface TypewriterTextProps {
  text: string;
  className?: string;
  delay?: number;
}

export function TypewriterText({
  text,
  className,
  delay = 0,
}: TypewriterTextProps) {
  return (
    <span className={className}>
      {text.split("").map((char, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.3,
            delay: delay + index * 0.03,
            ease: "easeOut",
          }}
        >
          {char}
        </motion.span>
      ))}
    </span>
  );
}

interface ShinyTextProps {
  children: React.ReactNode;
  className?: string;
}

export function ShinyText({ children, className }: ShinyTextProps) {
  return (
    <motion.span
      className={cn(
        "relative inline-block",
        className
      )}
    >
      <span className="relative z-10">{children}</span>
      <motion.span
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
        initial={{ x: "-100%" }}
        animate={{ x: "100%" }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatDelay: 3,
          ease: "easeInOut",
        }}
      />
    </motion.span>
  );
}
