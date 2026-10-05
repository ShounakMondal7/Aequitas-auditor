import React, { useEffect, useRef } from 'react';

export const LightTunnel = React.memo(() => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Mouse parallax variables
    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = (e.clientX - width / 2) * 0.05;
      targetMouseY = (e.clientY - height / 2) * 0.05;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Fiber optic strand configuration
    const strandsCount = 45;
    const strands: Array<{
      baseAngle: number;
      speed: number;
      curveFactor: number;
      thickness: number;
      pulseOffset: number;
      pulseSpeed: number;
      color: string;
      opacity: number;
    }> = [];

    for (let i = 0; i < strandsCount; i++) {
      strands.push({
        baseAngle: (i / strandsCount) * Math.PI * 2,
        speed: 0.0005 + Math.random() * 0.001,
        curveFactor: -0.8 + Math.random() * 1.6,
        thickness: 2 + Math.random() * 6,
        pulseOffset: Math.random() * Math.PI * 2,
        pulseSpeed: 0.01 + Math.random() * 0.02,
        color: Math.random() > 0.4 ? '#A855F7' : '#D946EF', // Neon Purple & Magenta
        opacity: 0.3 + Math.random() * 0.7,
      });
    }

    let time = 0;
    const render = () => {
      time += 1;

      // Smooth mouse interpolation
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      // Dark background with motion blur trailing effect
      ctx.fillStyle = 'rgba(10, 7, 18, 0.3)';
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2 + mouseX;
      const cy = height / 2 + mouseY;
      const maxDist = Math.hypot(width / 2, height / 2) * 1.2;

      strands.forEach((strand) => {
        // Slowly rotate the entire tunnel
        const currentAngle = strand.baseAngle + time * strand.speed;

        // Calculate curve control points for the twisting effect
        const cpx = cx + Math.cos(currentAngle + strand.curveFactor) * (maxDist * 0.5);
        const cpy = cy + Math.sin(currentAngle + strand.curveFactor) * (maxDist * 0.5);

        const ex = cx + Math.cos(currentAngle + strand.curveFactor * 2) * maxDist;
        const ey = cy + Math.sin(currentAngle + strand.curveFactor * 2) * maxDist;

        // Dynamic pulse traveling along the strand
        const pulsePhase = Math.sin(time * strand.pulseSpeed + strand.pulseOffset);
        // Normalize pulse to 0.1 - 0.9 range along the radius
        const pulsePos = Math.max(0.1, Math.min(0.9, (pulsePhase + 1) / 2));

        // Create gradient to simulate energy flowing
        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxDist);
        gradient.addColorStop(0, 'rgba(10, 7, 18, 0)');
        gradient.addColorStop(Math.max(0, pulsePos - 0.15), 'rgba(10, 7, 18, 0)');

        // The bright energy pulse
        const rgb = strand.color === '#A855F7' ? '168, 85, 247' : '217, 70, 239';
        gradient.addColorStop(pulsePos, `rgba(${rgb}, ${strand.opacity})`);

        gradient.addColorStop(Math.min(1, pulsePos + 0.15), 'rgba(10, 7, 18, 0)');
        gradient.addColorStop(1, 'rgba(10, 7, 18, 0)');

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.quadraticCurveTo(cpx, cpy, ex, ey);

        ctx.strokeStyle = gradient;
        ctx.lineWidth = strand.thickness;
        ctx.lineCap = 'round';

        // Neon glow
        ctx.shadowBlur = 20;
        ctx.shadowColor = strand.color;

        ctx.stroke();

        // Reset shadow for next strand
        ctx.shadowBlur = 0;
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none bg-[#0A0712]">
      <canvas ref={canvasRef} className="block w-full h-full opacity-90" />
      {/* Subtle vignette to deepen the edges */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,#0A0712_100%)]" />
    </div>
  );
});

LightTunnel.displayName = 'LightTunnel';

export default LightTunnel;
