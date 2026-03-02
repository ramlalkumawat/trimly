import { useEffect, useState } from 'react';

// Shows loader only when a request remains in progress for a minimum delay.
export default function useDelayedLoading(isLoading, delay = 300) {
  const [showLoader, setShowLoader] = useState(false);

  useEffect(() => {
    let timeoutId;

    if (isLoading) {
      timeoutId = window.setTimeout(() => setShowLoader(true), delay);
    } else {
      setShowLoader(false);
    }

    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [delay, isLoading]);

  return showLoader;
}
