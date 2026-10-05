import React, { useEffect, useRef } from 'react';

export const NeuralTunnel = React.memo(() => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Try WebGL context for GPU acceleration
    const gl = (canvas.getContext('webgl', {
      alpha: false,
      antialias: true,
      powerPreference: 'high-performance',
    }) ||
      canvas.getContext('experimental-webgl', {
        alpha: false,
        antialias: true,
      })) as WebGLRenderingContext | null;

    let animationFrameId: number;
    let width = 0;
    let height = 0;

    // Mouse tracking & interactive dynamics
    let targetMouseX = 0.5;
    let targetMouseY = 0.5;
    let currentMouseX = 0.5;
    let currentMouseY = 0.5;
    let targetIntensity = 1.0;
    let currentIntensity = 1.0;
    let targetSpeed = 1.0;
    let currentSpeed = 1.0;

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = e.clientX / window.innerWidth;
      targetMouseY = 1.0 - e.clientY / window.innerHeight;
      targetIntensity = 1.15;
    };

    const handleMouseDown = () => {
      targetSpeed = 1.8;
      targetIntensity = 1.35;
    };

    const handleMouseUp = () => {
      targetSpeed = 1.0;
      targetIntensity = 1.0;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mousedown', handleMouseDown, { passive: true });
    window.addEventListener('mouseup', handleMouseUp, { passive: true });

    if (gl) {
      // Vertex shader: Fullscreen quad
      const vsSource = `
        attribute vec2 a_position;
        void main() {
          gl_Position = vec4(a_position, 0.0, 1.0);
        }
      `;

      // Fragment shader: Organic pulsing neural tunnel matching React Bits Pro neural-tunnel aesthetic
      const fsSource = `
        precision highp float;
        uniform vec2 u_resolution;
        uniform float u_time;
        uniform vec2 u_mouse;
        uniform float u_intensity;

        void main() {
          vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / min(u_resolution.x, u_resolution.y);

          // Interactive mouse parallax offset (smooth perspective shift)
          uv += (u_mouse - 0.5) * 0.42;

          float r = length(uv);
          float a = atan(uv.y, uv.x);

          // Infinite cylindrical tunnel depth projection
          float depth = 1.0 / (r + 0.02);
          float z = depth - u_time * 2.2;

          // Harmonic volumetric neural strands (layered sinusoidal domain warping)
          float w1 = sin(a * 6.0 + sin(z * 0.45 + a * 2.0) * 1.7 + cos(z * 0.8) * 0.9);
          float ribbon1 = pow(max(0.0, w1 * 0.5 + 0.5), 3.2);
          float core1 = pow(max(0.0, w1 * 0.5 + 0.5), 14.0);

          float w2 = cos(a * 8.0 - cos(z * 0.65 - a * 3.0) * 2.1 + sin(z * 1.25) * 1.1);
          float ribbon2 = pow(max(0.0, w2 * 0.5 + 0.5), 3.6);
          float core2 = pow(max(0.0, w2 * 0.5 + 0.5), 16.0);

          float w3 = sin(a * 4.0 + sin(z * 0.3 + u_time * 0.4) * 2.2);
          float ribbon3 = pow(max(0.0, w3 * 0.5 + 0.5), 2.2);

          // Dynamic longitudinal energy pulses traveling forward towards camera
          float pulse1 = 0.55 + 0.45 * sin(z * 1.35 - u_time * 4.5);
          float pulse2 = 0.55 + 0.45 * cos(z * 1.85 - u_time * 5.2);

          // Central vanishing singularity (deep dark void in the center)
          float centerMask = smoothstep(0.02, 0.25, r);
          // Wide flare towards the screen edges
          float edgeBoost = 0.4 + 0.6 * smoothstep(0.08, 0.65, r);

          // Deep cosmic violet & electric magenta color palette
          vec3 bgVoid = vec3(0.025, 0.01, 0.045);
          vec3 deepViolet = vec3(0.58, 0.12, 0.88);     // Vibrant Purple #9420E0
          vec3 brightMagenta = vec3(0.88, 0.20, 0.96);   // Neon Magenta #E033F5
          vec3 neonGlow = vec3(0.96, 0.52, 1.0);        // Electric Fuchsia #F585FF
          vec3 whiteHot = vec3(1.0, 0.92, 1.0);

          vec3 color = bgVoid;
          color += deepViolet * ribbon1 * (0.8 + 0.4 * pulse1) * 1.8;
          color += brightMagenta * core1 * (1.0 + 0.6 * pulse1) * 2.6;
          color += brightMagenta * ribbon2 * (0.8 + 0.4 * pulse2) * 1.5;
          color += neonGlow * core2 * (1.0 + 0.6 * pulse2) * 2.4;
          color += deepViolet * ribbon3 * 0.8;
          color += whiteHot * (core1 * 0.5 + core2 * 0.5) * 1.5;

          color *= centerMask * edgeBoost * u_intensity;

          // Gentle vignette at far screen borders
          vec2 screenUV = gl_FragCoord.xy / u_resolution.xy;
          float vig = 16.0 * screenUV.x * screenUV.y * (1.0 - screenUV.x) * (1.0 - screenUV.y);
          color *= clamp(pow(vig, 0.18), 0.0, 1.0);

          gl_FragColor = vec4(color, 1.0);
        }
      `;

      const createShader = (type: number, source: string) => {
        const shader = gl.createShader(type);
        if (!shader) return null;
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          console.error(gl.getShaderInfoLog(shader));
          gl.deleteShader(shader);
          return null;
        }
        return shader;
      };

      const vs = createShader(gl.VERTEX_SHADER, vsSource);
      const fs = createShader(gl.FRAGMENT_SHADER, fsSource);
      if (!vs || !fs) return;

      const program = gl.createProgram();
      if (!program) return;
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(program));
        return;
      }

      gl.useProgram(program);

      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
        gl.STATIC_DRAW
      );

      const aPosition = gl.getAttribLocation(program, 'a_position');
      gl.enableVertexAttribArray(aPosition);
      gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

      const uResolution = gl.getUniformLocation(program, 'u_resolution');
      const uTime = gl.getUniformLocation(program, 'u_time');
      const uMouse = gl.getUniformLocation(program, 'u_mouse');
      const uIntensity = gl.getUniformLocation(program, 'u_intensity');

      const handleResize = () => {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        width = canvas.width = Math.floor(window.innerWidth * dpr);
        height = canvas.height = Math.floor(window.innerHeight * dpr);
        gl.viewport(0, 0, width, height);
      };
      handleResize();
      window.addEventListener('resize', handleResize);

      let accumulatedTime = 0;
      let lastFrame = performance.now();

      const render = (now: number) => {
        const dt = Math.min((now - lastFrame) * 0.001, 0.1);
        lastFrame = now;

        // Smooth interpolation for mouse parallax & speed
        currentMouseX += (targetMouseX - currentMouseX) * 0.06;
        currentMouseY += (targetMouseY - currentMouseY) * 0.06;
        currentSpeed += (targetSpeed - currentSpeed) * 0.05;
        currentIntensity += (targetIntensity - currentIntensity) * 0.05;

        accumulatedTime += dt * currentSpeed;

        gl.uniform2f(uResolution, width, height);
        gl.uniform1f(uTime, accumulatedTime);
        gl.uniform2f(uMouse, currentMouseX, currentMouseY);
        gl.uniform1f(uIntensity, currentIntensity);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        animationFrameId = requestAnimationFrame(render);
      };

      animationFrameId = requestAnimationFrame(render);

      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mousedown', handleMouseDown);
        window.removeEventListener('mouseup', handleMouseUp);
        cancelAnimationFrame(animationFrameId);
        gl.deleteProgram(program);
        gl.deleteShader(vs);
        gl.deleteShader(fs);
        gl.deleteBuffer(buffer);
      };
    } else {
      // High-performance 2D Canvas fallback
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const handleResize = () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
      };
      handleResize();
      window.addEventListener('resize', handleResize);

      let time = 0;
      const render2D = () => {
        time += 0.03 * currentSpeed;
        currentMouseX += (targetMouseX - currentMouseX) * 0.05;
        currentMouseY += (targetMouseY - currentMouseY) * 0.05;

        ctx.fillStyle = 'rgba(6, 2, 13, 0.35)';
        ctx.fillRect(0, 0, width, height);

        const cx = width * (0.5 + (currentMouseX - 0.5) * 0.25);
        const cy = height * (0.5 + (currentMouseY - 0.5) * 0.25);
        const maxR = Math.hypot(width, height) * 0.7;

        for (let i = 0; i < 36; i++) {
          const angle = (i / 36) * Math.PI * 2 + time * 0.2;
          const warp = Math.sin(time * 2 + i) * 40;
          const ex = cx + Math.cos(angle) * (maxR + warp);
          const ey = cy + Math.sin(angle) * (maxR + warp);

          const grad = ctx.createLinearGradient(cx, cy, ex, ey);
          grad.addColorStop(0, 'rgba(10, 4, 20, 0)');
          grad.addColorStop(0.3, 'rgba(147, 51, 234, 0.4)');
          grad.addColorStop(0.7, 'rgba(217, 70, 239, 0.8)');
          grad.addColorStop(1, 'rgba(168, 85, 247, 0.1)');

          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(ex, ey);
          ctx.strokeStyle = grad;
          ctx.lineWidth = 4 + Math.sin(time + i) * 3;
          ctx.stroke();
        }

        animationFrameId = requestAnimationFrame(render2D);
      };

      animationFrameId = requestAnimationFrame(render2D);

      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mousedown', handleMouseDown);
        window.removeEventListener('mouseup', handleMouseUp);
        cancelAnimationFrame(animationFrameId);
      };
    }
  }, []);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none bg-[#05020A] overflow-hidden">
      <canvas ref={canvasRef} className="block w-full h-full" />
      {/* Subtle vignette deepening the screen edges */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_35%,#05020A_100%)] pointer-events-none" />
    </div>
  );
});

NeuralTunnel.displayName = 'NeuralTunnel';

export default NeuralTunnel;
