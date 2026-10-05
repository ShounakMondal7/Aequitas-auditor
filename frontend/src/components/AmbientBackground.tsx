import React, { useState } from 'react';
import AeroShards from './AeroShards';
import { useTheme } from '../context/ThemeContext';

const AmbientBackground = React.memo(() => {
  const { isDark } = useTheme();
  const [gpuError, setGpuError] = useState(() => {
    if (typeof navigator !== 'undefined' && !('gpu' in navigator)) {
      return true;
    }
    return false;
  });

  // Safe fallback if the user's browser/hardware does not support WebGPU
  if (gpuError) {
    return (
      <div
        className={`fixed inset-0 z-0 pointer-events-none transition-colors duration-500 ${
          isDark ? 'bg-[#120F17]' : 'bg-slate-50'
        }`}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      {/* 3D Floating Crystal Galaxy: stream of reflective violet glass-like shards across cosmic void */}
      <AeroShards
        backgroundColor={isDark ? '#120F17' : '#F8FAFC'}
        shardColor={isDark ? '#8B5CF6' : '#CBD5E1'} // Bright violet / crystal purple
        accentColor={isDark ? '#A855F7' : '#896ABD'} // Soft spread glow highlights
        placement="full"
        flow="stream"
        material="chrome" // Glass, metallic reflections
        detail="balanced"
        effect="none"
        scale={1.2}
        spread={1.5}
        depth={2.0}
        speed={0.6}
        spin={1.2}
        density={1.5}
        shardSize={1.1}
        stretch={1.5}
        turbulence={1.2}
        edgeSoftness={2}
        bloom={1.2}
        grain={0.02}
        chromaticAberration={0.015} // Subtle RGB splitting on shard edges
        interaction="repel" // Cursor repels nearby shards
        interactionRadius={1.5}
        interactionStrength={0.8}
        rippleIntensity={1}
        holdToGather={true} // Holding click gathers nearby shards
        transitionDuration={1}
        onError={(err: Error) => {
          console.warn("WebGPU initialization failed. Falling back to solid background.", err);
          setGpuError(true);
        }}
      />
    </div>
  );
});

AmbientBackground.displayName = 'AmbientBackground';

export default AmbientBackground;
