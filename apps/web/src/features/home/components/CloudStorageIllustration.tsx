import React from 'react';

const CloudStorageIllustration: React.FC = () => (
  <svg viewBox="0 0 400 300" className="h-full w-full" aria-hidden="true">
    <defs>
      <linearGradient id="cloudGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3B82F6" />
        <stop offset="100%" stopColor="#8B5CF6" />
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    <circle cx="100" cy="80" r="40" fill="url(#cloudGradient)" opacity="0.1" />
    <circle cx="320" cy="200" r="60" fill="url(#cloudGradient)" opacity="0.1" />
    <path
      d="M200 120 C230 120, 260 140, 260 170 C280 170, 300 190, 300 210 C300 230, 280 250, 260 250 L140 250 C120 250, 100 230, 100 210 C100 190, 120 170, 140 170 C140 140, 170 120, 200 120 Z"
      fill="url(#cloudGradient)"
      filter="url(#glow)"
    />
    <rect
      x="50"
      y="50"
      width="30"
      height="40"
      rx="5"
      fill="#EF4444"
      opacity="0.8"
    />
    <rect
      x="320"
      y="60"
      width="30"
      height="40"
      rx="5"
      fill="#10B981"
      opacity="0.8"
    />
    <rect
      x="80"
      y="200"
      width="30"
      height="40"
      rx="5"
      fill="#F59E0B"
      opacity="0.8"
    />
    <rect
      x="300"
      y="140"
      width="30"
      height="40"
      rx="5"
      fill="#8B5CF6"
      opacity="0.8"
    />
    <path
      d="M170 180 L170 160 M160 170 L170 160 L180 170"
      stroke="white"
      strokeWidth="3"
      fill="none"
    />
    <path
      d="M230 180 L230 160 M220 170 L230 160 L240 170"
      stroke="white"
      strokeWidth="3"
      fill="none"
    />
  </svg>
);

export default CloudStorageIllustration;