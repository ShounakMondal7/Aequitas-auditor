import React, { ReactNode } from "react";
import { motion } from "framer-motion";

interface AuroraBackgroundProps {
  children?: ReactNode;
  className?: string;
  isProcessing?: boolean;
}

export const AuroraBackground = React.memo<AuroraBackgroundProps>(({
  children,
  className = "",
  isProcessing = false,
}) => {
  return (
    <div className={`relative min-h-screen bg-slate-950 overflow-hidden ${className}`}>
      {/* GPU Hardware-Accelerated Ambient Gradients */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden will-change-transform">
        {/* Layer 1: Sky/Indigo aura (animates only when idle to maximize FPS during audit stream) */}
        <motion.div
          animate={
            isProcessing
              ? { x: "0%", y: "0%", scale: 1 }
              : {
                  x: ["-15%", "15%", "-15%"],
                  y: ["-8%", "10%", "-8%"],
                  scale: [1, 1.08, 1],
                }
          }
          transition={{
            duration: 20,
            repeat: isProcessing ? 0 : Infinity,
            ease: "easeInOut",
          }}
          style={{ transform: "translateZ(0)" }}
          className="absolute -top-24 -left-24 w-[550px] h-[550px] rounded-full bg-gradient-to-tr from-sky-500/10 via-indigo-500/10 to-transparent blur-3xl opacity-80"
        />

        {/* Layer 2: Emerald/Teal aura */}
        <motion.div
          animate={
            isProcessing
              ? { x: "0%", y: "0%", scale: 1 }
              : {
                  x: ["15%", "-15%", "15%"],
                  y: ["12%", "-10%", "12%"],
                  scale: [1.05, 0.95, 1.05],
                }
          }
          transition={{
            duration: 24,
            repeat: isProcessing ? 0 : Infinity,
            ease: "easeInOut",
          }}
          style={{ transform: "translateZ(0)" }}
          className="absolute top-1/3 -right-24 w-[600px] h-[600px] rounded-full bg-gradient-to-bl from-emerald-500/10 via-teal-500/5 to-transparent blur-3xl opacity-75"
        />

        {/* Static high-tech dot grid pattern (zero CPU cost, pure CSS background) */}
        <div
          className="absolute inset-0 opacity-[0.025] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: `32px 32px`,
          }}
        />
      </div>

      {/* Content wrapper */}
      <div className="relative z-10">{children}</div>
    </div>
  );
});

AuroraBackground.displayName = "AuroraBackground";
