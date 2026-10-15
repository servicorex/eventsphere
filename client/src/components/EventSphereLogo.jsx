import React from 'react';

export default function EventSphereLogo({ size = 36, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect width="48" height="48" rx="12" fill="url(#logo_gradient)" />
      {/* Calendar Header bar */}
      <rect x="10" y="11" width="28" height="26" rx="4" fill="#FFFFFF" fillOpacity="0.95" />
      <path d="M10 17H38V14C38 12.8954 37.1046 12 36 12H12C10.8954 12 10 12.8954 10 14V17Z" fill="#1D4ED8" />
      {/* Calendar pegs */}
      <rect x="15" y="9" width="3" height="5" rx="1.5" fill="#93C5FD" />
      <rect x="30" y="9" width="3" height="5" rx="1.5" fill="#93C5FD" />
      {/* Sphere ring / orbital accent */}
      <circle cx="24" cy="27" r="4.5" fill="#2563EB" />
      <circle cx="28" cy="23" r="2" fill="#60A5FA" />
      <path
        d="M14 30C16 33 21 34 26 33C31 32 35 29 36 26"
        stroke="#1E3A8A"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <defs>
        <linearGradient id="logo_gradient" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1E3A8A" />
          <stop offset="1" stopColor="#3B82F6" />
        </linearGradient>
      </defs>
    </svg>
  );
}
