import React from "react";

// Iridescent Wireframe Sphere (Latitude/Longitude ellipses with holographic gradient strokes)
export const WireframeSphere = React.memo<{
  size: number;
  className?: string;
  theme?: "rainbow" | "emerald" | "violet" | "cyan";
  rotation?: number;
}>(({ size, className = "", theme = "rainbow", rotation = 0 }) => {
  const gradientId = `sphere-grad-${theme}-${Math.floor(Math.random() * 10000)}`;

  return (
    <div
      className={`pointer-events-none select-none relative ${className}`}
      style={{
        width: size,
        height: size,
        transform: `rotate(${rotation}deg)`,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <defs>
          {theme === "rainbow" && (
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.8" />
              <stop offset="40%" stopColor="#a855f7" stopOpacity="0.7" />
              <stop offset="70%" stopColor="#f43f5e" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.8" />
            </linearGradient>
          )}
          {theme === "emerald" && (
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34d399" stopOpacity="0.85" />
              <stop offset="60%" stopColor="#10b981" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#065f46" stopOpacity="0.3" />
            </linearGradient>
          )}
          {theme === "violet" && (
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#c084fc" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#7c3aed" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#3b0764" stopOpacity="0.3" />
            </linearGradient>
          )}
          {theme === "cyan" && (
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.85" />
              <stop offset="70%" stopColor="#2dd4bf" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#0e7490" stopOpacity="0.2" />
            </linearGradient>
          )}
        </defs>

        {/* Outer boundary circle */}
        <circle cx="100" cy="100" r="95" stroke={`url(#${gradientId})`} strokeWidth="1.2" strokeDasharray="3 3" opacity="0.6" />

        {/* Latitude lines (Horizontal ellipses) */}
        <ellipse cx="100" cy="100" rx="95" ry="25" stroke={`url(#${gradientId})`} strokeWidth="1" opacity="0.6" />
        <ellipse cx="100" cy="100" rx="92" ry="50" stroke={`url(#${gradientId})`} strokeWidth="1" opacity="0.7" />
        <ellipse cx="100" cy="100" rx="80" ry="75" stroke={`url(#${gradientId})`} strokeWidth="0.8" opacity="0.5" />
        <ellipse cx="100" cy="60" rx="76" ry="20" stroke={`url(#${gradientId})`} strokeWidth="0.8" strokeDasharray="2 3" opacity="0.5" />
        <ellipse cx="100" cy="140" rx="76" ry="20" stroke={`url(#${gradientId})`} strokeWidth="0.8" strokeDasharray="2 3" opacity="0.5" />

        {/* Longitude lines (Vertical ellipses) */}
        <ellipse cx="100" cy="100" rx="25" ry="95" stroke={`url(#${gradientId})`} strokeWidth="1" opacity="0.6" />
        <ellipse cx="100" cy="100" rx="55" ry="92" stroke={`url(#${gradientId})`} strokeWidth="1" opacity="0.7" />
        <ellipse cx="100" cy="100" rx="75" ry="85" stroke={`url(#${gradientId})`} strokeWidth="0.8" opacity="0.5" />

        {/* Core glow axis */}
        <line x1="100" y1="5" x2="100" y2="195" stroke={`url(#${gradientId})`} strokeWidth="0.5" strokeDasharray="4 4" opacity="0.4" />
        <line x1="5" y1="100" x2="195" y2="100" stroke={`url(#${gradientId})`} strokeWidth="0.5" strokeDasharray="4 4" opacity="0.4" />
      </svg>
    </div>
  );
});

WireframeSphere.displayName = "WireframeSphere";

// Chromatic Rainbow Vortex Swirl matching the Audit Vault card background in the reference image
export const ChromaticVortex = React.memo<{ className?: string }>(({ className = "" }) => {
  return (
    <div className={`pointer-events-none select-none absolute ${className}`}>
      <svg
        viewBox="0 0 500 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full animate-[spin_40s_linear_infinite]"
        style={{ filter: "blur(0.5px)" }}
      >
        <defs>
          <radialGradient id="vortex-center" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#000000" stopOpacity="0.95" />
            <stop offset="25%" stopColor="#0d0a1a" stopOpacity="0.8" />
            <stop offset="50%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>

          {/* Rainbow dispersion gradient */}
          <linearGradient id="prism-cyan" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#818cf8" stopOpacity="0.7" />
          </linearGradient>

          <linearGradient id="prism-warm" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.8" />
            <stop offset="40%" stopColor="#f97316" stopOpacity="0.9" />
            <stop offset="70%" stopColor="#f43f5e" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#d946ef" stopOpacity="0.7" />
          </linearGradient>

          <linearGradient id="prism-emerald" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.6" />
          </linearGradient>
        </defs>

        {/* Concentric chromatic distorted rings that form the vortex spiral */}
        <g opacity="0.75" style={{ mixBlendMode: "screen" }}>
          {/* Outer ripples */}
          <ellipse cx="250" cy="250" rx="230" ry="140" transform="rotate(-25 250 250)" stroke="url(#prism-cyan)" strokeWidth="1.8" opacity="0.4" />
          <ellipse cx="250" cy="250" rx="210" ry="125" transform="rotate(-15 250 250)" stroke="url(#prism-warm)" strokeWidth="2.2" opacity="0.6" />
          <ellipse cx="250" cy="250" rx="190" ry="110" transform="rotate(-5 250 250)" stroke="url(#prism-emerald)" strokeWidth="2" opacity="0.7" />

          {/* Mid swirls with chromatic aberration */}
          <ellipse cx="250" cy="250" rx="170" ry="95" transform="rotate(10 250 250)" stroke="url(#prism-cyan)" strokeWidth="2.8" opacity="0.85" />
          <ellipse cx="250" cy="250" rx="150" ry="82" transform="rotate(25 250 250)" stroke="url(#prism-warm)" strokeWidth="3.2" opacity="0.9" />
          <ellipse cx="250" cy="250" rx="130" ry="70" transform="rotate(40 250 250)" stroke="url(#prism-emerald)" strokeWidth="2.8" opacity="0.85" />

          {/* Intense inner vortex */}
          <ellipse cx="250" cy="250" rx="110" ry="58" transform="rotate(55 250 250)" stroke="url(#prism-cyan)" strokeWidth="3.5" opacity="0.95" />
          <ellipse cx="250" cy="250" rx="90" ry="46" transform="rotate(70 250 250)" stroke="url(#prism-warm)" strokeWidth="4" opacity="1" />
          <ellipse cx="250" cy="250" rx="70" ry="35" transform="rotate(85 250 250)" stroke="url(#prism-emerald)" strokeWidth="3.5" opacity="0.9" />
          <ellipse cx="250" cy="250" rx="52" ry="25" transform="rotate(100 250 250)" stroke="url(#prism-cyan)" strokeWidth="3" opacity="0.85" />
          <ellipse cx="250" cy="250" rx="36" ry="16" transform="rotate(115 250 250)" stroke="url(#prism-warm)" strokeWidth="2.5" opacity="0.8" />
        </g>

        {/* Center gravitational black hole */}
        <circle cx="250" cy="250" r="32" fill="url(#vortex-center)" />
      </svg>
    </div>
  );
});

ChromaticVortex.displayName = "ChromaticVortex";

// Complete Space & Holographic Geodesic Background matching the reference design 1:1
export const AequitasSpaceBackground = React.memo<{ isDark?: boolean }>(({ isDark = true }) => {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none select-none overflow-hidden transition-colors duration-500">
      {/* Deep Space Foundation with Ambient Radial Glows */}
      <div
        className={`absolute inset-0 ${
          isDark
            ? "bg-[#060814] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.18),rgba(255,255,255,0))]"
            : "bg-slate-50 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(13,148,136,0.12),rgba(255,255,255,0))]"
        }`}
      />

      {/* Inner Centered Composition Container */}
      <div className="relative w-full h-full max-w-[1700px] mx-auto">
        {/* Central/Lower-Left Chromatic Rainbow Vortex (Right behind the Audit Vault table) */}
        <div className="absolute left-[2%] bottom-[-5%] w-[820px] h-[820px] opacity-80 dark:opacity-75">
          <ChromaticVortex className="w-full h-full" />
        </div>

        {/* 3D Geodesic Wireframe Spheres positioned exactly like the reference image */}
        {/* 1. Top Center-Left Rainbow Sphere */}
        <WireframeSphere
          size={310}
          theme="rainbow"
          rotation={18}
          className="absolute top-[-2%] left-[16%] opacity-65 dark:opacity-75"
        />

        {/* 2. Top Right Emerald Geodesic Sphere */}
        <WireframeSphere
          size={380}
          theme="emerald"
          rotation={28}
          className="absolute top-[-3%] right-[2%] opacity-65 dark:opacity-75"
        />

        {/* 3. Mid-Left Cyan Sphere */}
        <WireframeSphere
          size={260}
          theme="cyan"
          rotation={-25}
          className="absolute top-[22%] left-[-4%] opacity-55 dark:opacity-65"
        />

        {/* 4. Bottom-Left Violet Sphere */}
        <WireframeSphere
          size={270}
          theme="violet"
          rotation={42}
          className="absolute bottom-[2%] left-[4%] opacity-60 dark:opacity-70"
        />

        {/* 5. Bottom-Right Violet/Purple Sphere */}
        <WireframeSphere
          size={330}
          theme="violet"
          rotation={-18}
          className="absolute bottom-[2%] right-[5%] opacity-65 dark:opacity-75"
        />

        {/* 6. Four-point Sparkle Star in Bottom Right */}
        <div className="absolute bottom-[16%] right-[11%] sparkle-star w-6 h-6 bg-white shadow-[0_0_20px_#ffffff] pointer-events-none animate-pulse opacity-90" />
      </div>
    </div>
  );
});

AequitasSpaceBackground.displayName = "AequitasSpaceBackground";

