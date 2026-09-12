'use client';

import { useEffect, useRef } from 'react';

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
  rotation: number;
  vRot: number;
  shape: 'circle' | 'square' | 'sparkle';
};

type ParticleEffectProps = {
  active: boolean;
  type?: 'confetti' | 'xp_burst' | 'gold_burst' | 'slash';
  x?: number;
  y?: number;
  onComplete?: () => void;
};

const PALETTES = {
  confetti: ['#fbbf24', '#f43f5e', '#60a5fa', '#34d399', '#a78bfa', '#f59e0b', '#ec4899', '#ffffff'],
  xp_burst: ['#60a5fa', '#38bdf8', '#818cf8', '#c084fc', '#ffffff'],
  gold_burst: ['#fbbf24', '#f59e0b', '#d97706', '#fef08a', '#ffffff'],
  slash: ['#f43f5e', '#fb7185', '#fda4af', '#facc15', '#ffffff'],
};

export default function ParticleEffect({ active, type = 'confetti', x, y, onComplete }: ParticleEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = (canvas.width = window.innerWidth);
    const height = (canvas.height = window.innerHeight);

    const originX = x ?? width / 2;
    const originY = y ?? height / 2;

    const count = type === 'confetti' ? 120 : type === 'slash' ? 60 : 45;
    const colors = PALETTES[type] || PALETTES.confetti;

    const particles: Particle[] = [];

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = type === 'confetti' ? Math.random() * 8 + 4 : Math.random() * 6 + 2;

      particles.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed * (type === 'confetti' ? (Math.random() - 0.5) * 2 : 1),
        vy: (Math.sin(angle) * speed) - (type === 'confetti' ? Math.random() * 6 + 2 : 0),
        color: colors[Math.floor(Math.random() * colors.length)],
        size: type === 'confetti' ? Math.random() * 6 + 3 : Math.random() * 4 + 2,
        alpha: 1,
        life: 0,
        maxLife: type === 'confetti' ? Math.random() * 50 + 60 : Math.random() * 30 + 30,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.2,
        shape: type === 'confetti' ? (Math.random() > 0.5 ? 'square' : 'circle') : 'sparkle',
      });
    }

    let animationFrameId: number;

    function render() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let aliveCount = 0;

      for (const p of particles) {
        p.life++;
        if (p.life < p.maxLife) {
          aliveCount++;
          p.x += p.vx;
          p.y += p.vy;

          if (type === 'confetti') {
            p.vy += 0.15; // Gravity
            p.vx *= 0.99;
          } else {
            p.vx *= 0.94;
            p.vy *= 0.94;
          }

          p.rotation += p.vRot;
          p.alpha = Math.max(0, 1 - p.life / p.maxLife);

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;

          if (p.shape === 'circle') {
            ctx.beginPath();
            ctx.arc(0, 0, p.size, 0, Math.PI * 2);
            ctx.fill();
          } else if (p.shape === 'square') {
            ctx.fillRect(-p.size, -p.size / 2, p.size * 2, p.size);
          } else {
            // Sparkle 4-point star
            ctx.beginPath();
            ctx.moveTo(0, -p.size * 1.5);
            ctx.lineTo(p.size * 0.5, -p.size * 0.5);
            ctx.lineTo(p.size * 1.5, 0);
            ctx.lineTo(p.size * 0.5, p.size * 0.5);
            ctx.lineTo(0, p.size * 1.5);
            ctx.lineTo(-p.size * 0.5, p.size * 0.5);
            ctx.lineTo(-p.size * 1.5, 0);
            ctx.lineTo(-p.size * 0.5, -p.size * 0.5);
            ctx.closePath();
            ctx.fill();
          }

          ctx.restore();
        }
      }

      if (aliveCount > 0) {
        animationFrameId = requestAnimationFrame(render);
      } else {
        if (onComplete) onComplete();
      }
    }

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [active, type, x, y, onComplete]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50 w-full h-full"
      style={{ pointerEvents: 'none' }}
    />
  );
}
