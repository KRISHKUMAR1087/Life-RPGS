'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { CATEGORIES } from '@/lib/rpg';

type StatRadarChartProps = {
  stats: {
    strength: number;
    intellect: number;
    vitality: number;
    charisma: number;
    dexterity: number;
  };
  size?: number;
};

export default function StatRadarChart({ stats, size = 280 }: StatRadarChartProps) {
  const center = size / 2;
  const radius = (size / 2) * 0.72;

  const statEntries = useMemo(
    () => [
      { key: 'strength', label: 'STR', full: 'Strength', val: stats.strength, color: '#f43f5e' },
      { key: 'intellect', label: 'INT', full: 'Intellect', val: stats.intellect, color: '#60a5fa' },
      { key: 'vitality', label: 'VIT', full: 'Vitality', val: stats.vitality, color: '#34d399' },
      { key: 'charisma', label: 'CHA', full: 'Charisma', val: stats.charisma, color: '#fbbf24' },
      { key: 'dexterity', label: 'DEX', full: 'Dexterity', val: stats.dexterity, color: '#a78bfa' },
    ],
    [stats]
  );

  const maxVal = useMemo(() => {
    const highest = Math.max(...statEntries.map((s) => s.val));
    return Math.max(highest, 15);
  }, [statEntries]);

  // Compute angles & coordinates
  const total = statEntries.length;
  const points = statEntries.map((stat, i) => {
    const angle = (Math.PI * 2 * i) / total - Math.PI / 2;
    const normalized = Math.min(1, Math.max(0.15, stat.val / maxVal));
    const r = normalized * radius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);

    const labelR = radius + 24;
    const labelX = center + labelR * Math.cos(angle);
    const labelY = center + labelR * Math.sin(angle);

    return { ...stat, x, y, labelX, labelY, angle };
  });

  const polygonPath = points.map((p) => `${p.x},${p.y}`).join(' ');

  // Concentric polygon grids
  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  return (
    <div className="relative flex flex-col items-center justify-center p-2">
      <svg width={size} height={size} className="overflow-visible select-none">
        <defs>
          <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.35" />
            <stop offset="60%" stopColor="#60a5fa" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.05" />
          </radialGradient>
          <linearGradient id="polyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#60a5fa" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.4" />
          </linearGradient>
          <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Background Grid webs */}
        {gridLevels.map((lvl) => {
          const gridPoints = Array.from({ length: total }).map((_, i) => {
            const angle = (Math.PI * 2 * i) / total - Math.PI / 2;
            const r = lvl * radius;
            return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
          });
          return (
            <polygon
              key={lvl}
              points={gridPoints.join(' ')}
              fill={lvl === 1.0 ? 'rgba(255, 255, 255, 0.02)' : 'none'}
              stroke="rgba(255, 255, 255, 0.12)"
              strokeWidth="1"
              strokeDasharray={lvl < 1.0 ? '3 3' : undefined}
            />
          );
        })}

        {/* Spokes from center to outer ring */}
        {Array.from({ length: total }).map((_, i) => {
          const angle = (Math.PI * 2 * i) / total - Math.PI / 2;
          const x = center + radius * Math.cos(angle);
          const y = center + radius * Math.sin(angle);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="rgba(255, 255, 255, 0.12)"
              strokeWidth="1"
            />
          );
        })}

        {/* Glowing Radar Stat Polygon */}
        <motion.polygon
          points={polygonPath}
          fill="url(#polyGradient)"
          stroke="#fbbf24"
          strokeWidth="2.5"
          filter="url(#glowFilter)"
          initial={{ opacity: 0, scale: 0.5, transformOrigin: `${center}px ${center}px` }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        />

        {/* Stat Vertex Dots */}
        {points.map((p) => (
          <g key={p.key}>
            <circle cx={p.x} cy={p.y} r="6" fill={p.color} className="animate-pulse" opacity="0.4" />
            <circle
              cx={p.x}
              cy={p.y}
              r="3.5"
              fill="#ffffff"
              stroke={p.color}
              strokeWidth="2"
            />
          </g>
        ))}

        {/* Outer Label Badges */}
        {points.map((p) => (
          <g key={`lbl-${p.key}`}>
            <text
              x={p.labelX}
              y={p.labelY - 5}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-[11px] font-heading font-extrabold fill-ink-200 tracking-wider"
              style={{ fill: p.color }}
            >
              {p.label}
            </text>
            <text
              x={p.labelX}
              y={p.labelY + 8}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-[10px] font-bold fill-ink-400 tabular-nums"
            >
              {p.val} pts
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
