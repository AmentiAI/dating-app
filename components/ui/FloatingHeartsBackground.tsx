"use client";

import { motion } from "framer-motion";

const HEARTS = [
  { left: "2%", size: "text-lg", delay: 0.1, duration: 9.5, alpha: "text-accent/85" },
  { left: "5%", size: "text-xl", delay: 0.8, duration: 11.2, alpha: "text-accent2/85" },
  { left: "9%", size: "text-lg", delay: 1.5, duration: 10.4, alpha: "text-accent3/80" },
  { left: "13%", size: "text-2xl", delay: 2.1, duration: 12.1, alpha: "text-gold/75" },
  { left: "17%", size: "text-lg", delay: 0.6, duration: 8.7, alpha: "text-accent/85" },
  { left: "21%", size: "text-xl", delay: 2.7, duration: 12.4, alpha: "text-accent2/85" },
  { left: "25%", size: "text-lg", delay: 3.1, duration: 10.6, alpha: "text-accent3/80" },
  { left: "29%", size: "text-2xl", delay: 1.8, duration: 9.6, alpha: "text-gold/75" },
  { left: "33%", size: "text-lg", delay: 4.0, duration: 12.3, alpha: "text-accent/85" },
  { left: "37%", size: "text-xl", delay: 2.4, duration: 10.2, alpha: "text-accent2/85" },
  { left: "41%", size: "text-lg", delay: 1.0, duration: 8.9, alpha: "text-accent3/80" },
  { left: "45%", size: "text-2xl", delay: 3.3, duration: 11.4, alpha: "text-gold/75" },
  { left: "49%", size: "text-lg", delay: 4.8, duration: 10.5, alpha: "text-accent/85" },
  { left: "53%", size: "text-xl", delay: 0.4, duration: 9.1, alpha: "text-accent2/85" },
  { left: "57%", size: "text-lg", delay: 1.6, duration: 12.0, alpha: "text-accent3/80" },
  { left: "61%", size: "text-2xl", delay: 3.8, duration: 10.8, alpha: "text-gold/75" },
  { left: "65%", size: "text-lg", delay: 2.9, duration: 9.4, alpha: "text-accent/85" },
  { left: "69%", size: "text-xl", delay: 0.2, duration: 10.1, alpha: "text-accent2/85" },
  { left: "73%", size: "text-lg", delay: 2.2, duration: 11.1, alpha: "text-accent3/80" },
  { left: "77%", size: "text-2xl", delay: 4.2, duration: 9.9, alpha: "text-gold/75" },
  { left: "81%", size: "text-lg", delay: 1.4, duration: 11.7, alpha: "text-accent/85" },
  { left: "85%", size: "text-xl", delay: 2.5, duration: 10.7, alpha: "text-accent2/85" },
  { left: "89%", size: "text-lg", delay: 3.5, duration: 12.2, alpha: "text-accent3/80" },
  { left: "93%", size: "text-2xl", delay: 0.9, duration: 10.0, alpha: "text-gold/75" },
  { left: "97%", size: "text-xl", delay: 1.9, duration: 11.9, alpha: "text-accent/85" }
];

export function FloatingHeartsBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-[5] overflow-hidden" aria-hidden>
      {HEARTS.map((heart) => (
        <motion.span
          key={`${heart.left}-${heart.delay}`}
          className={`absolute -bottom-10 ${heart.size} ${heart.alpha} drop-shadow-[0_2px_8px_rgba(233,140,160,0.55)]`}
          style={{ left: heart.left }}
          initial={{ y: 0, x: 0, opacity: 0 }}
          animate={{
            y: [-20, -180, -360, -520, -700, -900],
            x: [0, 8, -6, 6, -8, 0],
            opacity: [0, 0.75, 0.9, 0.75, 0.5, 0]
          }}
          transition={{
            duration: heart.duration,
            delay: heart.delay,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear"
          }}
        >
          ❤
        </motion.span>
      ))}
    </div>
  );
}
