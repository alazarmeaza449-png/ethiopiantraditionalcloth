import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';

interface TibebBorderProps {
  className?: string;
  tone?: 'gold' | 'emerald' | 'obsidian';
}

export const TibebBorder: React.FC<TibebBorderProps> = ({
  className = '',
  tone = 'gold',
}) => {
  const strokeColor =
    tone === 'gold'
      ? '#C59B27'
      : tone === 'emerald'
      ? '#164A3B'
      : '#1A1817';

  return (
    <div
      className={`w-full overflow-hidden select-none pointer-events-none ${className}`}
      aria-hidden="true"
    >
      <svg
        className="w-full h-3.5"
        preserveAspectRatio="none"
        viewBox="0 0 1200 14"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <pattern
          id={`tibeb-pattern-${tone}`}
          x="0"
          y="0"
          width="28"
          height="14"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M0 7L7 1L14 7L7 13L0 7Z"
            stroke={strokeColor}
            strokeWidth="1.1"
            strokeOpacity="0.65"
          />
          <path
            d="M14 7L21 1L28 7L21 13L14 7Z"
            stroke={strokeColor}
            strokeWidth="1.1"
            strokeOpacity="0.35"
          />
          <rect x="6" y="6" width="2" height="2" fill={strokeColor} fillOpacity="0.75" />
          <rect x="20" y="6" width="2" height="2" fill={strokeColor} fillOpacity="0.4" />
        </pattern>
        <rect width="1200" height="14" fill={`url(#tibeb-pattern-${tone})`} />
      </svg>
    </div>
  );
};

interface LuxuryImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  fallbackTitle?: string;
}

export const LuxuryImage: React.FC<LuxuryImageProps> = ({
  src,
  alt,
  className = '',
  style,
  fallbackTitle,
}) => {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#F3EFE8] via-[#FAF8F5] to-[#E6DEC8] text-[#6B655E] p-6 text-center ${className}`}
      >
        <Sparkles className="w-6 h-6 text-[#C59B27] mb-2" strokeWidth={1.5} />
        <span className="font-serif text-base text-[#1A1817] font-medium">
          {fallbackTitle || alt}
        </span>
        <span className="text-xs text-[#6B655E] mt-1">Ethiopian Traditional Cloth Atelier</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      style={style}
      className={className}
    />
  );
};
