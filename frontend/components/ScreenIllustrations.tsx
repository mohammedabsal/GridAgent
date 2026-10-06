import React from 'react';

export type IllustrationKind =
  | 'dashboard'
  | 'simulation'
  | 'workloads'
  | 'energy'
  | 'impact'
  | 'safety'
  | 'empty'
  | 'error';

interface ScreenIllustrationProps {
  kind: IllustrationKind;
  className?: string;
}

/**
 * Lightweight inline SVG spot illustrations matching the landing
 * design system (emerald/teal on soft tinted backgrounds).
 */
export const ScreenIllustration: React.FC<ScreenIllustrationProps> = ({
  kind,
  className = 'h-28 w-28',
}) => {
  const common = {
    className,
    viewBox: '0 0 120 120',
    fill: 'none' as const,
    role: 'img' as const,
    'aria-hidden': true,
  };

  if (kind === 'dashboard') {
    return (
      <svg {...common}>
        <rect x="8" y="8" width="104" height="104" rx="24" fill="#ECFDF5" />
        <rect x="24" y="30" width="72" height="10" rx="5" fill="#A7F3D0" />
        <rect x="24" y="48" width="46" height="42" rx="10" fill="#FFF" stroke="#6EE7B7" strokeWidth="2" />
        <rect x="76" y="48" width="20" height="42" rx="8" fill="#10B981" opacity="0.85" />
        <rect x="76" y="66" width="20" height="24" rx="8" fill="#047857" opacity="0.35" />
        <circle cx="47" cy="69" r="9" fill="#D1FAE5" stroke="#10B981" strokeWidth="2" />
        <path d="M42 69l3.5 3.5L52 66" stroke="#059669" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (kind === 'simulation') {
    return (
      <svg {...common}>
        <rect x="8" y="8" width="104" height="104" rx="24" fill="#EFF6FF" />
        <rect x="22" y="34" width="76" height="52" rx="12" fill="#FFF" stroke="#6EE7B7" strokeWidth="2" />
        <path d="M28 68 L44 54 L56 62 L70 42 L82 50 L92 36" stroke="#10B981" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="70" cy="42" r="4.5" fill="#10B981" stroke="#FFF" strokeWidth="2" />
        <circle cx="30" cy="94" r="3" fill="#10B981" />
        <circle cx="60" cy="94" r="3" fill="#A7F3D0" />
        <circle cx="90" cy="94" r="3" fill="#A7F3D0" />
      </svg>
    );
  }

  if (kind === 'workloads') {
    return (
      <svg {...common}>
        <rect x="8" y="8" width="104" height="104" rx="24" fill="#ECFDF5" />
        <rect x="26" y="28" width="68" height="18" rx="9" fill="#FFF" stroke="#6EE7B7" strokeWidth="2" />
        <rect x="26" y="51" width="68" height="18" rx="9" fill="#FFF" stroke="#A7F3D0" strokeWidth="2" />
        <rect x="26" y="74" width="48" height="18" rx="9" fill="#D1FAE5" />
        <circle cx="36" cy="37" r="4" fill="#10B981" />
        <rect x="46" y="34" width="30" height="6" rx="3" fill="#A7F3D0" />
        <circle cx="36" cy="60" r="4" fill="#34D399" />
        <rect x="46" y="57" width="22" height="6" rx="3" fill="#A7F3D0" />
      </svg>
    );
  }

  if (kind === 'energy') {
    return (
      <svg {...common}>
        <rect x="8" y="8" width="104" height="104" rx="24" fill="#FEFCE8" />
        <circle cx="60" cy="52" r="18" fill="#FDE68A" stroke="#F59E0B" strokeWidth="2.5" />
        <path d="M60 24v6 M60 74v6 M32 52h6 M82 52h6" stroke="#F59E0B" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M30 90h60" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M38 90v-8a12 12 0 0124 0v8" fill="#D1FAE5" stroke="#10B981" strokeWidth="2" />
      </svg>
    );
  }

  if (kind === 'impact') {
    return (
      <svg {...common}>
        <rect x="8" y="8" width="104" height="104" rx="24" fill="#ECFDF5" />
        <rect x="26" y="62" width="12" height="28" rx="4" fill="#A7F3D0" />
        <rect x="42" y="52" width="12" height="38" rx="4" fill="#6EE7B7" />
        <rect x="58" y="40" width="12" height="50" rx="4" fill="#10B981" />
        <rect x="74" y="30" width="12" height="60" rx="4" fill="#047857" />
      </svg>
    );
  }

  if (kind === 'safety') {
    return (
      <svg {...common}>
        <rect x="8" y="8" width="104" height="104" rx="24" fill="#EFF6FF" />
        <path d="M60 24l24 9v20c0 16-10 27-24 33-14-6-24-17-24-33V33l24-9z" fill="#FFF" stroke="#10B981" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M52 62l6 6 12-13" stroke="#059669" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (kind === 'error') {
    return (
      <svg {...common}>
        <rect x="8" y="8" width="104" height="104" rx="24" fill="#FEF2F2" />
        <circle cx="60" cy="60" r="26" fill="#FFF" stroke="#FCA5A5" strokeWidth="2.5" />
        <path d="M60 46v14" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" />
        <circle cx="60" cy="70" r="2.6" fill="#EF4444" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <rect x="8" y="8" width="104" height="104" rx="24" fill="#F0FDF4" />
      <rect x="32" y="38" width="56" height="44" rx="10" fill="#FFF" stroke="#A7F3D0" strokeWidth="2" strokeDasharray="5 4" />
      <circle cx="60" cy="56" r="9" fill="#D1FAE5" />
      <path d="M48 74h24" stroke="#6EE7B7" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
};

export default ScreenIllustration;

interface PageHeroArtProps {
  kind: IllustrationKind;
  eyebrow: string;
  title: string;
  description: string;
}

/** Small header band with illustration — used atop each app screen. */
export const PageHeroArt: React.FC<PageHeroArtProps> = ({
  kind,
  eyebrow,
  title,
  description,
}) => (
  <div className="flex items-center gap-4 rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50 to-teal-50/60 p-4 sm:p-5">
    <ScreenIllustration kind={kind} className="h-16 w-16 shrink-0 sm:h-20 sm:w-20" />
    <div className="min-w-0">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-700">
        {eyebrow}
      </p>
      <h2 className="truncate text-base font-extrabold tracking-tight text-[#0d3f3a] sm:text-lg">
        {title}
      </h2>
      <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-slate-500 sm:text-[13px]">
        {description}
      </p>
    </div>
  </div>
);

