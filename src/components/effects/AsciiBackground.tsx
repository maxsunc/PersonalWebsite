'use client';

import React, { useEffect, useRef } from 'react';

interface AsciiBackgroundProps {
  spinnerType?: 'braille' | 'classic';
  decayTime?: number;
  waveInterval?: number;
  radius?: number;
  clickWaveSpeed?: number;
}

const BRAILLE = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
const CLASSIC = ['|', '/', '-', '\\'];
const WAVE_CHARS = ['*', '&', '^', '@', '!', '?', '<', '>', '{', '}', '[', ']', '~'];

interface Cell {
  x: number;
  y: number;
  proj: number;
  mouseHitTime: number;
  waveHitTime: number;
  waveChar: string;
}

interface ClickWave {
  x: number;
  y: number;
  startTime: number;
  lastRadius: number;
}

export default function AsciiBackground({
  spinnerType = 'braille',
  decayTime = 1000,
  waveInterval = 9000,
  radius = 90,
  clickWaveSpeed = 1.5,
}: AsciiBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let cells: Cell[] = [];
    const fontSize = 16;
    let diagonal = 0;

    let mouseX = -1000;
    let mouseY = -1000;

    let activeClickWaves: ClickWave[] = [];

    const currentWave = {
      active: false,
      angle: 0,
      startTime: 0,
      speed: 1.0, // pixels per ms
    };

    let lastWaveD = -9999;
    let lastWaveTime = Date.now();

    const handleResize = () => {
      // Adjust for device pixel ratio for crisp text
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;

      ctx.scale(dpr, dpr);
      ctx.font = `${fontSize}px "JetBrains Mono", monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const columns = Math.ceil(window.innerWidth / fontSize);
      const rows = Math.ceil(window.innerHeight / fontSize);
      diagonal = Math.sqrt(window.innerWidth ** 2 + window.innerHeight ** 2);

      cells = [];
      for (let i = 0; i < columns; i++) {
        for (let j = 0; j < rows; j++) {
          cells.push({
            x: i * fontSize + fontSize / 2,
            y: j * fontSize + fontSize / 2,
            proj: 0,
            mouseHitTime: 0,
            waveHitTime: 0,
            waveChar: '',
          });
        }
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };

    const handleMouseClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      activeClickWaves.push({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        startTime: Date.now(),
        lastRadius: 0,
      });
    };

    // Use window mouse move so we track even if hovering over other elements
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleMouseClick);

    const triggerWave = () => {
      currentWave.active = true;
      currentWave.angle = Math.random() * Math.PI * 2;
      currentWave.startTime = Date.now();
      lastWaveD = -diagonal; // Reset wave position to far negative

      // Precalculate projection for all cells for this wave angle
      cells.forEach(cell => {
        // Center origin for projection
        const cx = cell.x - window.innerWidth / 2;
        const cy = cell.y - window.innerHeight / 2;
        cell.proj = cx * Math.cos(currentWave.angle) + cy * Math.sin(currentWave.angle);
      });
    };

    let lastFrameTime = Date.now();

    const render = () => {
      const now = Date.now();
      lastFrameTime = now;

      // Trigger wave periodically
      if (now - lastWaveTime > waveInterval) {
        triggerWave();
        lastWaveTime = now;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const spinner = spinnerType === 'braille' ? BRAILLE : CLASSIC;

      // Wave progress calculation
      let waveD = -9999;
      if (currentWave.active) {
        // wave travels from roughly -diagonal/2 to +diagonal/2
        waveD = (now - currentWave.startTime) * currentWave.speed - (diagonal / 2);
        if (waveD > diagonal / 2 + 100) {
          currentWave.active = false;
        }
      }

      // Process Click Waves
      for (let w = activeClickWaves.length - 1; w >= 0; w--) {
        const clickWave = activeClickWaves[w];
        const currentRadius = (now - clickWave.startTime) * clickWaveSpeed;

        if (currentRadius > diagonal) {
          activeClickWaves.splice(w, 1);
          continue;
        }

        for (let i = 0; i < cells.length; i++) {
          const cell = cells[i];
          const dx = cell.x - clickWave.x;
          const dy = cell.y - clickWave.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist > clickWave.lastRadius && dist <= currentRadius) {
            cell.mouseHitTime = now;
          }
        }
        clickWave.lastRadius = currentRadius;
      }

      // Pass 1: Draw inactive cells to minimize context changes
      ctx.fillStyle = 'rgba(51, 65, 85, 0.25)'; // Dim slate
      const activeCells: Cell[] = [];

      for (let i = 0; i < cells.length; i++) {
        const cell = cells[i];
        let isActive = false;

        // Check mouse hit
        const dx = cell.x - mouseX;
        const dy = cell.y - mouseY;
        if (dx * dx + dy * dy < radius * radius) {
          cell.mouseHitTime = now;
        }

        // Check wave hit via sweep line algorithm
        if (currentWave.active) {
          // If cell's projection is between the last frame's wave distance and current distance
          if (cell.proj > lastWaveD && cell.proj <= waveD) {
            cell.waveHitTime = now;
            cell.waveChar = WAVE_CHARS[Math.floor(Math.random() * WAVE_CHARS.length)];
          }
        }

        if (now - cell.mouseHitTime < decayTime || now - cell.waveHitTime < decayTime) {
          activeCells.push(cell);
          isActive = true;
        }

        if (!isActive) {
          ctx.fillText('#', cell.x, cell.y);
        }
      }

      // Pass 2: Draw active cells with interpolated colors
      activeCells.forEach(cell => {
        const mouseAge = now - cell.mouseHitTime;
        const waveAge = now - cell.waveHitTime;

        let age = 0;
        let char = '#';

        if (waveAge < decayTime && waveAge <= mouseAge) {
          // Prioritize wave if more recent
          age = waveAge;
          char = cell.waveChar;
        } else {
          age = mouseAge;
          // Spinner speed (e.g., frame every 50ms)
          const frame = Math.floor(age / 50) % spinner.length;
          char = spinner[frame];
        }

        const progress = age / decayTime; // 0 to 1

        // Interpolate from Bright Green to Dim Slate
        // Green: rgb(34, 197, 94)
        // Slate: rgb(51, 65, 85)
        const r = Math.round(34 + (51 - 34) * progress);
        const g = Math.round(197 + (65 - 197) * progress);
        const b = Math.round(94 + (85 - 94) * progress);
        // Opacity fades from 1.0 to 0.25
        const a = 1 - (0.75 * progress);

        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
        ctx.fillText(char, cell.x, cell.y);
      });

      lastWaveD = waveD;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleMouseClick);
      cancelAnimationFrame(animationFrameId);
    };
  }, [decayTime, radius, spinnerType, waveInterval]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-0"
      aria-hidden="true"
    />
  );
}