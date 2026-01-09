"use client";

import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import Link from "next/link";

interface PulseButtonProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export function PulseButton({ href, children, className }: PulseButtonProps) {
  return (
    <Link href={href}>
      <motion.button
        className={cn(
          "relative overflow-hidden rounded-full px-8 py-3 font-semibold text-white shadow-lg transition-all",
          "bg-gradient-to-r from-blue-600 via-violet-600 to-pink-600",
          "hover:shadow-xl hover:shadow-violet-500/25",
          className
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Pulse ring animations */}
        <motion.span
          className="absolute inset-0 rounded-full bg-white/20"
          animate={{
            scale: [1, 1.5, 1.5],
            opacity: [0.5, 0, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
        <motion.span
          className="absolute inset-0 rounded-full bg-white/20"
          animate={{
            scale: [1, 1.5, 1.5],
            opacity: [0.5, 0, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeOut",
            delay: 0.5,
          }}
        />
        <motion.span
          className="absolute inset-0 rounded-full bg-white/20"
          animate={{
            scale: [1, 1.5, 1.5],
            opacity: [0.5, 0, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeOut",
            delay: 1,
          }}
        />
        
        {/* Shimmer effect */}
        <motion.span
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
          initial={{ x: "-100%" }}
          animate={{ x: "200%" }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            repeatDelay: 2,
            ease: "easeInOut",
          }}
        />
        
        {/* Button content */}
        <span className="relative z-10 flex items-center gap-2">
          {children}
        </span>
      </motion.button>
    </Link>
  );
}
