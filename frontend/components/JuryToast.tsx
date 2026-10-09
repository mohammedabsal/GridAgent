import React, { useEffect, useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';

interface Props {
  message: string | null;
  note: string | null;
  onDismiss: () => void;
}

export const JuryToast: React.FC<Props> = ({ message, note, onDismiss }) => {
  const text = message ?? note;
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (text) {
      setVisible(true);
      const t = setTimeout(() => setVisible(false), 4200);
      return () => clearTimeout(t);
    }
    setVisible(false);
  }, [text]);
  if (!text) return null;
  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-[60] -translate-x-1/2">
      <div
        className={`pointer-events-auto flex max-w-[92vw] items-center gap-2.5 rounded-full border border-emerald-300 bg-white/95 py-2 pl-3 pr-2 shadow-xl shadow-emerald-600/15 backdrop-blur transition-all duration-300 ${
          visible ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
        }`}
      >
        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
        <span className="truncate font-mono text-xs font-medium text-[#0d3f3a]">{text}</span>
        <button
          onClick={onDismiss}
          aria-label="Dismiss notification"
          className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
