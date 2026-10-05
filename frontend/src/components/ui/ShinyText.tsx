import React from "react";
import { motion, type Variants } from "framer-motion";

interface ShinyTextProps {
  text: string;
  className?: string;
}

export const ShinyText = React.memo<ShinyTextProps>(({
  text,
  className = "",
}) => {
  return (
    <span
      className={`inline-block relative font-bold bg-clip-text text-transparent ${className}`}
      style={{
        backgroundImage: `linear-gradient(110deg, #94a3b8 0%, #ffffff 40%, #38bdf8 50%, #ffffff 60%, #94a3b8 100%)`,
        backgroundSize: `250% 100%`,
        animation: `shimmer 4s infinite linear`,
        transform: "translateZ(0)",
      }}
    >
      {text}
    </span>
  );
});

ShinyText.displayName = "ShinyText";

interface TextRevealProps {
  text: string;
  className?: string;
  delay?: number;
}

export const TextReveal = React.memo<TextRevealProps>(({
  text,
  className = "",
  delay = 0,
}) => {
  const words = text.split(" ");

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06,
        delayChildren: delay,
      },
    },
  };

  // Strictly animate GPU properties: opacity and transform y (zero CPU filter/layout thrash)
  const wordVariants: Variants = {
    hidden: {
      opacity: 0,
      y: 10,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut",
      },
    },
  };

  return (
    <motion.h2
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={`inline-flex flex-wrap justify-center gap-x-2 tracking-tight ${className}`}
    >
      {words.map((word, i) => (
        <motion.span
          key={i}
          variants={wordVariants}
          style={{ transform: "translateZ(0)" }}
          className="inline-block will-change-transform"
        >
          {word === "Bias" || word === "Fairness" ? (
            <span className="bg-gradient-to-r from-sky-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent font-extrabold">
              {word}
            </span>
          ) : (
            word
          )}
        </motion.span>
      ))}
    </motion.h2>
  );
});

TextReveal.displayName = "TextReveal";
