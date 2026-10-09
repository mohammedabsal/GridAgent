import { useEffect, useRef, useState } from 'react';

/** Animates a number from 0 → target with ease-out when mounted / target changes. */
export function useCountUp(target: number, durationMs = 1200, decimals = 1): string {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>(0);
  useEffect(() => {
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(target * eased);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, durationMs]);
  return value.toFixed(decimals);
}
