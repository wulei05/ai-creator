'use client';

import { useEffect, useRef } from 'react';

export function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W = 0, H = 0;
    let animId: number;

    const resize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    const DIST_SQ = 110 * 110; // avoid sqrt per pair
    const particles = Array.from({ length: 40 }, () => {
      const a = Math.random() * 0.4 + 0.1;
      return {
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        r: Math.random() * 1.5 + 0.5,
        color: Math.random() > 0.6
          ? `rgba(245,158,11,${a})`
          : Math.random() > 0.5
            ? `rgba(103,232,249,${a * 0.6})`
            : `rgba(255,255,255,${a * 0.4})`,
      };
    });

    const draw = () => {
      if (document.hidden) { animId = requestAnimationFrame(draw); return; }

      ctx.clearRect(0, 0, W, H);

      // Batch all connection lines into a single path → one stroke() call
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(245,158,11,0.05)';
      ctx.lineWidth = 0.5;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;

        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const dx = p.x - q.x, dy = p.y - q.y;
          if (dx * dx + dy * dy < DIST_SQ) {
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
          }
        }
      }
      ctx.stroke();

      // Draw particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      }

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
      style={{ opacity: 0.6, willChange: 'transform', transform: 'translateZ(0)' }}
    />
  );
}
