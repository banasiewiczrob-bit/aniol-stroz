import { useCallback, useEffect, useRef, useState } from 'react';

export function useSingleNavigationPress(cooldownMs = 900) {
  const [navigationLocked, setNavigationLocked] = useState(false);
  const lockRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const runGuarded = useCallback(
    async (action: () => void | Promise<void>) => {
      if (lockRef.current) return;

      lockRef.current = true;
      setNavigationLocked(true);

      try {
        await action();
      } finally {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          lockRef.current = false;
          setNavigationLocked(false);
        }, cooldownMs);
      }
    },
    [cooldownMs]
  );

  return { navigationLocked, runGuarded };
}
