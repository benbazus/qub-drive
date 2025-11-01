import React from 'react';

const CollaborationIllustration: React.FC = () => (
  <svg viewBox="0 0 300 200" className="h-full w-full">
    <defs>
      <linearGradient id="userGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3B82F6" />
        <stop offset="100%" stopColor="#1D4ED8" />
      </linearGradient>
    </defs>
    <circle cx="80" cy="80" r="20" fill="url(#userGradient)" />
    <circle cx="150" cy="80" r="20" fill="url(#userGradient)" />
    <circle cx="220" cy="80" r="20" fill="url(#userGradient)" />
    <line x1="100" y1="80" x2="130" y2="80" stroke="#8B5CF6" strokeWidth="3" />
    <line x1="170" y1="80" x2="200" y2="80" stroke="#8B5CF6" strokeWidth="3" />
    <rect x="125" y="130" width="50" height="40" rx="5" fill="#F59E0B" />
    <line x1="135" y1="145" x2="165" y2="145" stroke="white" strokeWidth="2" />
    <line x1="135" y1="155" x2="155" y2="155" stroke="white" strokeWidth="2" />
  </svg>
);

export default CollaborationIllustration;