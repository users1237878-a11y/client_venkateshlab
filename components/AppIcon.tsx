import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

/**
 * Super slick, high-contrast professional logo for VENKATESH Library
 * Displays the stylized 'V' book brand icon with rich gradient fills
 */
export const AppIcon: React.FC<IconProps> = ({ className = '', size = 32 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none shadow-xl rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-blue-500/10 ${className}`}
      id="venkatesh-app-icon"
    >
      {/* Background with deep space metallic gradient & radial gloss */}
      <rect width="100" height="100" rx="26" fill="url(#bgGrad)" />
      
      {/* Futuristic concentric circuit line grid in background for "Lab" feel */}
      <circle cx="50" cy="50" r="32" stroke="rgba(99, 102, 241, 0.08)" strokeWidth="1" />
      <circle cx="50" cy="50" r="41" stroke="rgba(59, 130, 246, 0.06)" strokeWidth="1" />
      <line x1="15" y1="50" x2="85" y2="50" stroke="rgba(99, 102, 241, 0.04)" strokeWidth="1" />
      <line x1="50" y1="15" x2="50" y2="85" stroke="rgba(99, 102, 241, 0.04)" strokeWidth="1" />

      {/* Ambient Inner Shadow / Dual Glow Border */}
      <rect x="1.5" y="1.5" width="97" height="97" rx="24.5" stroke="url(#borderGrad)" strokeWidth="2.5" strokeOpacity="0.85" />
      <rect x="3.5" y="3.5" width="93" height="93" rx="22.5" stroke="rgba(255, 255, 255, 0.06)" strokeWidth="1" />
      
      {/* Outer abstract tech circular ring with dashes */}
      <circle cx="50" cy="50" r="37.5" stroke="url(#accentGrad)" strokeWidth="1.5" strokeDasharray="5 9" strokeOpacity="0.6" />

      {/* Styled Book/Leaf layout that doubles as a "V" */}
      <g transform="translate(10, 10)">
        {/* Drop shadow for the main V icon */}
        <filter id="shadow" x="0" y="0" width="80" height="80">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000000" floodOpacity="0.45" />
        </filter>

        <g filter="url(#shadow)">
          {/* Left Page (V Side A - Luxurious Crimson to Amber Gold) */}
          <path
            d="M40 22 C23 22, 16 29, 12 59 C20 56, 33 57, 40 50 Z"
            fill="url(#goldGrad)"
          />
          {/* Deep shading underlay to give 3D depth */}
          <path
            d="M40 22 C30 26, 22 34, 18 56 C24 54, 34 54, 40 50 Z"
            fill="rgba(0,0,0,0.18)"
          />

          {/* Right Page (V Side B - Electric Indigo to Royal Blue) */}
          <path
            d="M40 22 C57 22, 64 29, 68 59 C60 56, 47 57, 40 50 Z"
            fill="url(#blueGrad)"
          />
          {/* Deep shading underlay to give 3D depth */}
          <path
            d="M40 22 C50 26, 58 34, 62 56 C56 54, 46 54, 40 50 Z"
            fill="rgba(0,0,0,0.18)"
          />

          {/* Dynamic Center Bookmark / Sword of Knowledge */}
          <path
            d="M40 17 L44 51 L40 57 L36 51 Z"
            fill="url(#pearlGrad)"
          />
        </g>

        {/* Orbit atom lines representing 'Study Lab' in high-definition */}
        <ellipse cx="40" cy="38" rx="29" ry="9" stroke="url(#goldGrad)" strokeWidth="1.25" transform="rotate(-28 40 38)" opacity="0.4" />
        <ellipse cx="40" cy="38" rx="29" ry="9" stroke="url(#blueGrad)" strokeWidth="1.25" transform="rotate(28 40 38)" opacity="0.4" />

        {/* Glowing wisdom sparkle stars */}
        <path d="M22 28 L23.5 31.5 L27 33 L23.5 34.5 L22 38 L20.5 34.5 L17 33 L20.5 31.5 Z" fill="#FDE047" opacity="0.8" />
        <path d="M58 28 L59.5 31.5 L63 33 L59.5 34.5 L58 38 L56.5 34.5 L53 33 L56.5 31.5 Z" fill="#67E8F9" opacity="0.8" />

        {/* Glowing Node of Wisdom */}
        <circle cx="40" cy="22" r="4.5" fill="#FFFFFF" />
        <circle cx="40" cy="22" r="9" stroke="#FFFFFF" strokeWidth="1" strokeOpacity="0.5" className="animate-ping" />
      </g>

      {/* High-Gloss Diagonal Glass Reflection Light glint */}
      <path
        d="M-10 20 L40 -30 L55 -30 L5 20 Z"
        fill="rgba(255, 255, 255, 0.08)"
        transform="translate(10, 10)"
        opacity="0.8"
      />

      {/* Gradients Definitions */}
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#070A13" />
          <stop offset="40%" stopColor="#0C1322" />
          <stop offset="100%" stopColor="#1B253B" />
        </linearGradient>

        <linearGradient id="borderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="35%" stopColor="#3B82F6" />
          <stop offset="70%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>

        <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#93C5FD" />
          <stop offset="40%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>

        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="40%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>

        <linearGradient id="pearlGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#E2E8F0" />
        </linearGradient>

        <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="50%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
      </defs>
    </svg>
  );
};

/**
 * Minimalist, ultra-sleek, professional corporate logo for Atheron Labs
 */
export const AtheronLogo: React.FC<IconProps> = ({ className = '', size = 48 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none transition-all duration-300 hover:rotate-6 ${className}`}
      id="atheron-labs-logo"
    >
      {/* Outer Hexagon / Flask framework backplate */}
      <path
        d="M50 6 L88 28 L88 72 L50 94 L12 72 L12 28 Z"
        fill="url(#atheronBgGrad)"
        stroke="url(#atheronGrad)"
        strokeWidth="3"
        strokeLinejoin="round"
        strokeOpacity="0.9"
      />

      {/* Dynamic Grid nodes inside background */}
      <circle cx="50" cy="22" r="1.5" fill="rgba(255, 255, 255, 0.15)" />
      <circle cx="28" cy="34" r="1.5" fill="rgba(255, 255, 255, 0.15)" />
      <circle cx="72" cy="34" r="1.5" fill="rgba(255, 255, 255, 0.15)" />
      <circle cx="28" cy="66" r="1.5" fill="rgba(255, 255, 255, 0.15)" />
      <circle cx="72" cy="66" r="1.5" fill="rgba(255, 255, 255, 0.15)" />
      <line x1="28" y1="34" x2="50" y2="22" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      <line x1="72" y1="34" x2="50" y2="22" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />

      {/* Inner geometric 'A' resembling laboratory glassware & structural synthesis */}
      <path
        d="M50 16 L78 68 L61 68 L50 47 L39 68 L22 68 Z"
        fill="url(#atheronGradInner)"
        className="drop-shadow-[0_4px_8px_rgba(96,165,250,0.35)]"
      />

      {/* Horizontal Bridge / Light reflection of the 'A' */}
      <path
        d="M37 54 L63 54"
        stroke="#FFF"
        strokeWidth="3"
        strokeLinecap="round"
        strokeOpacity="0.95"
      />

      {/* High-Contrast Core Glow Node */}
      <circle cx="50" cy="47" r="3.5" fill="#FFF" className="animate-pulse" />
      <circle cx="50" cy="47" r="7.5" stroke="#FFF" strokeWidth="1" strokeOpacity="0.4" />

      {/* Futuristic Orbit Particles */}
      <circle cx="50" cy="16" r="4" fill="#FFF" className="drop-shadow-[0_0_4px_#FFF]" />
      <circle cx="32" cy="60" r="3.5" fill="#10B981" />
      <circle cx="68" cy="60" r="3.5" fill="#3B82F6" />

      {/* Rotating Ring representing laboratory synthesis */}
      <circle cx="50" cy="54" r="28" stroke="url(#orbitGrad)" strokeWidth="1.25" strokeDasharray="4 8" strokeOpacity="0.8" />

      {/* Glossy Overlay */}
      <path
        d="M50 6 L88 28 L50 50 Z"
        fill="rgba(255, 255, 255, 0.05)"
      />

      <defs>
        <linearGradient id="atheronBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0B0F19" />
          <stop offset="100%" stopColor="#151D30" />
        </linearGradient>

        <linearGradient id="atheronGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FB7185" />
          <stop offset="30%" stopColor="#818CF8" />
          <stop offset="70%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>

        <linearGradient id="atheronGradInner" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="50%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>

        <linearGradient id="orbitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F472B6" />
          <stop offset="50%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#34D399" />
        </linearGradient>
      </defs>
    </svg>
  );
};

