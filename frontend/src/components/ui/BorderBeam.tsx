import React from "react";
import { motion } from "framer-motion";

interface BorderBeamProps {
  className?: string;
  duration?: number;
  colorFrom?: string;
  colorTo?: string;
}

export const BorderBeam = React.memo<BorderBeamProps>(({
  className = "",
  duration = 8,
  colorFrom = "#38bdf8",
  colorTo = "#10b981",
}) => {
  return (
    <div className={`pointer-events-none absolute inset-0 rounded-[inherit] overflow-hidden ${className}`}>
      {/* Hardware accelerated rotating conic glow */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{
          repeat: Infinity,
          duration,
          ease: "linear",
        }}
        style={{
          background: `conic-gradient(from 0deg at 50% 50%, transparent 0deg, ${colorFrom} 60deg, ${colorTo} 120deg, transparent 180deg)`,
          transform: "translateZ(0)",
        }}
        className="absolute -inset-[100%] opacity-60 will-change-transform"
      />
    </div>
  );
});

BorderBeam.displayName = "BorderBeam";
