import React from 'react';

export function HomeSticker() {
  return (
    <svg viewBox="0 0 320 240" className="w-full h-full" role="img" aria-label="Salon tools illustration">
      <defs>
        <linearGradient id="heroBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef3c7" />
          <stop offset="100%" stopColor="#fde68a" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="320" height="240" rx="24" fill="url(#heroBg)" />
      <circle cx="68" cy="60" r="22" fill="#ffffff" opacity="0.7" />
      <circle cx="250" cy="176" r="18" fill="#ffffff" opacity="0.7" />
      <rect x="38" y="106" width="244" height="88" rx="16" fill="#ffffff" />
      <rect x="54" y="122" width="74" height="56" rx="10" fill="#111827" opacity="0.92" />
      <rect x="140" y="122" width="60" height="12" rx="6" fill="#f59e0b" />
      <rect x="140" y="142" width="118" height="10" rx="5" fill="#e5e7eb" />
      <rect x="140" y="160" width="92" height="10" rx="5" fill="#e5e7eb" />
      <path d="M88 52l14 14m-14 0l14-14" stroke="#111827" strokeWidth="4" strokeLinecap="round" />
      <circle cx="214" cy="56" r="14" fill="#111827" />
      <path d="M214 42v28M200 56h28" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

export function AuthSticker() {
  return (
    <svg viewBox="0 0 280 220" className="w-full h-full" role="img" aria-label="Beauty care illustration">
      <defs>
        <linearGradient id="authBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef9c3" />
          <stop offset="100%" stopColor="#fde68a" />
        </linearGradient>
      </defs>
      <rect width="280" height="220" rx="22" fill="url(#authBg)" />
      <rect x="30" y="30" width="220" height="160" rx="18" fill="#fff" />
      <circle cx="88" cy="86" r="26" fill="#111827" />
      <circle cx="88" cy="86" r="14" fill="#f59e0b" />
      <rect x="126" y="68" width="98" height="12" rx="6" fill="#f59e0b" />
      <rect x="126" y="92" width="74" height="10" rx="5" fill="#d1d5db" />
      <rect x="56" y="132" width="168" height="16" rx="8" fill="#111827" />
      <circle cx="58" cy="44" r="10" fill="#fff" opacity="0.65" />
      <circle cx="232" cy="176" r="12" fill="#fff" opacity="0.75" />
    </svg>
  );
}

export function EmptyStateSticker() {
  return (
    <svg viewBox="0 0 260 200" className="w-full h-full" role="img" aria-label="Empty services illustration">
      <rect width="260" height="200" rx="20" fill="#f9fafb" />
      <rect x="40" y="40" width="180" height="120" rx="14" fill="#ffffff" stroke="#e5e7eb" />
      <rect x="56" y="58" width="72" height="58" rx="10" fill="#111827" opacity="0.95" />
      <rect x="138" y="64" width="66" height="10" rx="5" fill="#f59e0b" />
      <rect x="138" y="82" width="50" height="8" rx="4" fill="#e5e7eb" />
      <rect x="138" y="96" width="42" height="8" rx="4" fill="#e5e7eb" />
      <rect x="56" y="126" width="148" height="12" rx="6" fill="#e5e7eb" />
    </svg>
  );
}
