import React, { useEffect, useRef, useState } from 'react';

/**
 * Detects whether the user has requested reduced motion at the OS/browser level.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return reduced;
}

/**
 * Smoothly interpolates a numeric value when it changes (e.g., 700 -> 390 gCO2/kWh)
 * using requestAnimationFrame and a cubic-out easing curve (default 850ms).
 * Respects `prefers-reduced-motion`.
 */
export function useAnimatedNumber(
  targetValue: number,
  durationMs = 850
): number {
  const reducedMotion = usePrefersReducedMotion();
  const [displayValue, setDisplayValue] = useState<number>(targetValue);
  const currentRef = useRef<number>(targetValue);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (reducedMotion || !Number.isFinite(targetValue)) {
      currentRef.current = targetValue;
      setDisplayValue(targetValue);
      return;
    }

    const startValue = currentRef.current;
    const delta = targetValue - startValue;
    if (Math.abs(delta) < 0.05) {
      currentRef.current = targetValue;
      setDisplayValue(targetValue);
      return;
    }

    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      // Cubic ease-out: 1 - (1 - t)^3
      const eased = 1 - Math.pow(1 - progress, 3);
      const nextVal = startValue + delta * eased;
      currentRef.current = nextVal;
      setDisplayValue(nextVal);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        currentRef.current = targetValue;
        setDisplayValue(targetValue);
      }
    };

    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }
    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [targetValue, durationMs, reducedMotion]);

  return displayValue;
}

interface AnimatedNumberProps {
  value: number;
  decimals?: number;
  durationMs?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  decimals = 0,
  durationMs = 850,
  prefix = '',
  suffix = '',
  className,
}) => {
  const animated = useAnimatedNumber(value, durationMs);
  const formatted =
    decimals > 0 ? animated.toFixed(decimals) : String(Math.round(animated));
  return (
    <span className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
};

export interface JudgeSceneSpec {
  scene: number;
  title: string;
  subtitle: string;
  focusTarget: 'twin' | 'timeline' | 'decision' | 'safety' | 'impact';
}

export const JUDGE_MODE_SCENES: JudgeSceneSpec[] = [
  {
    scene: 1,
    title: 'Your workload needs to run.',
    subtitle: 'AI Model Training (150 kWh, SLA 20:00) enters the Digital Twin at 15:00.',
    focusTarget: 'twin',
  },
  {
    scene: 2,
    title: 'The grid is carbon-intensive right now.',
    subtitle: 'At 15:00, grid carbon intensity is high (700 gCO₂/kWh) with low renewable share.',
    focusTarget: 'twin',
  },
  {
    scene: 3,
    title: "Let's see what happens if we wait.",
    subtitle: 'Digital Twin simulates future execution windows across the 24-hour energy timeline.',
    focusTarget: 'timeline',
  },
  {
    scene: 4,
    title: 'Cleaner window appears.',
    subtitle: 'At 17:00, solar generation surges and grid carbon drops to 390 gCO₂/kWh.',
    focusTarget: 'timeline',
  },
  {
    scene: 5,
    title: 'AI Recommendation: WAIT UNTIL 17:00',
    subtitle: 'Reasoning engine locks onto 17:00 as the lowest-carbon window before the 20:00 deadline.',
    focusTarget: 'decision',
  },
  {
    scene: 6,
    title: 'Safety Check: ✓ SAFE TO WAIT',
    subtitle: 'Execution governance verifies SLA deadline compliance and policy guardrails.',
    focusTarget: 'safety',
  },
  {
    scene: 7,
    title: 'Workload moves from 15:00 → 17:00',
    subtitle: 'Scheduler shifts execution from the high-carbon peak into the 17:00 clean window.',
    focusTarget: 'timeline',
  },
  {
    scene: 8,
    title: 'Digital Twin transitions to cleaner state.',
    subtitle: 'At 17:00, renewable flow increases to 43.3% and compute nodes execute on cleaner power.',
    focusTarget: 'twin',
  },
  {
    scene: 9,
    title: 'Result: 44.3% LESS CARBON',
    subtitle: 'Workload emissions drop from 105.0 kg CO₂ to 58.5 kg CO₂ (-46.5 kg saved).',
    focusTarget: 'impact',
  },
  {
    scene: 10,
    title: 'SAME WORKLOAD. SAME OUTPUT. CLEANER ELECTRICITY.',
    subtitle: 'Completed on time before the 20:00 deadline with 44.3% lower carbon footprint.',
    focusTarget: 'impact',
  },
];

