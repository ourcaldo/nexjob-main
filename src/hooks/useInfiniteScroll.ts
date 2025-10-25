import { useState, useEffect, useCallback } from 'react';

interface UseInfiniteScrollOptions {
  threshold?: number;
  rootMargin?: string;
}

export const useInfiniteScroll = (
  callback: () => void,
  options: UseInfiniteScrollOptions = {}
) => {
  const { threshold = 1.0, rootMargin = '100px' } = options;
  const [isFetching, setIsFetching] = useState(false);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && !isFetching) {
        setIsFetching(true);
        callback();
      }
    },
    [callback, isFetching]
  );

  useEffect(() => {
    if (!targetElement) return;

    const observer = new IntersectionObserver(handleObserver, {
      threshold,
      rootMargin,
    });

    observer.observe(targetElement);

    return () => {
      if (targetElement) {
        observer.unobserve(targetElement);
      }
    };
  }, [targetElement, handleObserver, threshold, rootMargin]);

  const setTarget = useCallback((element: HTMLElement | null) => {
    setTargetElement(element);
  }, []);

  const resetFetching = useCallback(() => {
    setIsFetching(false);
  }, []);

  return { isFetching, setTarget, resetFetching };
};