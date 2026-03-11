import { useCallback, useEffect, useRef } from 'react';
import type { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent, ScrollView } from 'react-native';

type ScrollAnchorOptions = {
  offset?: number;
  animated?: boolean;
  waitForLayout?: boolean;
  onlyIfNeeded?: boolean;
  topMargin?: number;
  bottomMargin?: number;
};

type PendingScroll<Name extends string> = {
  name: Name;
  offset: number;
  animated: boolean;
  onlyIfNeeded: boolean;
  topMargin: number;
  bottomMargin: number;
};

export function useScrollAnchors<Name extends string = string>() {
  const scrollRef = useRef<ScrollView | null>(null);
  const anchorsRef = useRef<Partial<Record<Name, number>>>({});
  const pendingScrollRef = useRef<PendingScroll<Name> | null>(null);
  const frameRef = useRef<number | null>(null);
  const scrollYRef = useRef(0);
  const viewportHeightRef = useRef(0);

  const cancelScheduledScroll = useCallback(() => {
    if (frameRef.current == null) return;
    cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      cancelScheduledScroll();
      pendingScrollRef.current = null;
    };
  }, [cancelScheduledScroll]);

  const scheduleScroll = useCallback(
    (targetY: number, animated: boolean) => {
      cancelScheduledScroll();
      frameRef.current = requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ y: Math.max(0, targetY), animated });
        frameRef.current = null;
      });
    },
    [cancelScheduledScroll],
  );

  const shouldScrollToTarget = useCallback((targetY: number, topMargin: number, bottomMargin: number) => {
    const viewportHeight = viewportHeightRef.current;
    if (viewportHeight <= 0) {
      return true;
    }

    const visibleTop = scrollYRef.current + topMargin;
    const visibleBottom = scrollYRef.current + viewportHeight - bottomMargin;
    return targetY < visibleTop || targetY > visibleBottom;
  }, []);

  const scrollToAnchor = useCallback(
    (name: Name, options: ScrollAnchorOptions = {}) => {
      const {
        offset = 0,
        animated = true,
        waitForLayout = true,
        onlyIfNeeded = false,
        topMargin = 12,
        bottomMargin = 160,
      } = options;
      const anchorY = anchorsRef.current[name];

      if (typeof anchorY === 'number') {
        pendingScrollRef.current = null;
        const targetY = anchorY - offset;
        if (!onlyIfNeeded || shouldScrollToTarget(targetY, topMargin, bottomMargin)) {
          scheduleScroll(targetY, animated);
        }
        return true;
      }

      if (waitForLayout) {
        pendingScrollRef.current = { name, offset, animated, onlyIfNeeded, topMargin, bottomMargin };
      }

      return false;
    },
    [scheduleScroll, shouldScrollToTarget],
  );

  const setAnchor = useCallback(
    (name: Name) => (event: LayoutChangeEvent) => {
      const y = event.nativeEvent.layout.y;
      anchorsRef.current[name] = y;

      const pending = pendingScrollRef.current;
      if (!pending || pending.name !== name) return;

      pendingScrollRef.current = null;
      const targetY = y - pending.offset;
      if (!pending.onlyIfNeeded || shouldScrollToTarget(targetY, pending.topMargin, pending.bottomMargin)) {
        scheduleScroll(targetY, pending.animated);
      }
    },
    [scheduleScroll, shouldScrollToTarget],
  );

  const clearPendingScroll = useCallback((name?: Name) => {
    if (!name || pendingScrollRef.current?.name === name) {
      pendingScrollRef.current = null;
    }
  }, []);

  const scrollToTop = useCallback(
    (animated = true) => {
      scheduleScroll(0, animated);
    },
    [scheduleScroll],
  );

  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollYRef.current = event.nativeEvent.contentOffset.y;
  }, []);

  const onViewportLayout = useCallback((event: LayoutChangeEvent) => {
    viewportHeightRef.current = event.nativeEvent.layout.height;
  }, []);

  return {
    scrollRef,
    setAnchor,
    scrollToAnchor,
    clearPendingScroll,
    scrollToTop,
    onScroll,
    onViewportLayout,
  };
}
