import React from 'react';
import { ScreenIllustration } from './ScreenIllustrations';

interface Props {
  title?: string;
  hint?: string;
}

export const JuryEmptyState: React.FC<Props> = ({
  title = 'All clear ✓',
  hint = 'Nothing here needs your attention right now.',
}) => (
  <div className="flex flex-col items-center justify-center px-5 py-6 text-center">
    <ScreenIllustration kind="empty" className="h-16 w-16" />
    <div className="mt-2 text-xs font-bold text-[#0d3f3a]">{title}</div>
    <div className="mt-0.5 text-[11px] text-slate-500">{hint}</div>
  </div>
);
