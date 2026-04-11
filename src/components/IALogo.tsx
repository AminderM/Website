import React from 'react';

interface IALogoProps {
  className?: string;
  size?: number;
}

const IALogo: React.FC<IALogoProps> = ({ className = '', size = 38 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 80 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="Integra AI"
  >
    <defs>
      <linearGradient id="ia-gradient" x1="40" y1="6" x2="40" y2="74" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#EF4444" />
        <stop offset="100%" stopColor="#7f1d1d" />
      </linearGradient>
    </defs>
    <text
      x="40"
      y="68"
      textAnchor="middle"
      fontFamily="'Arial Black', 'Arial', sans-serif"
      fontWeight="900"
      fontSize="68"
      letterSpacing="-2"
      fill="url(#ia-gradient)"
    >
      IA
    </text>
  </svg>
);

export default IALogo;
