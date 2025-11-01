import React from 'react';

const SecurityIllustration: React.FC = () => (
  <svg viewBox="0 0 200 200" className="h-full w-full">
    <defs>
      <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#10B981" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>
    </defs>
    <path
      d="M100 20 L100 20 C120 20, 140 30, 140 50 L140 120 C140 150, 120 170, 100 180 C80 170, 60 150, 60 120 L60 50 C60 30, 80 20, 100 20 Z"
      fill="url(#shieldGradient)"
    />
    <circle
      cx="100"
      cy="100"
      r="15"
      fill="none"
      stroke="white"
      strokeWidth="3"
    />
    <rect x="90" y="100" width="20" height="25" rx="3" fill="white" />
    <circle cx="100" cy="110" r="3" fill="url(#shieldGradient)" />
    <line
      x1="100"
      y1="113"
      x2="100"
      y2="118"
      stroke="url(#shieldGradient)"
      strokeWidth="2"
    />
  </svg>
);

export default SecurityIllustration;