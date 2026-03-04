import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Scroll helper: on route/hash change, move viewport to target section or page top.
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    // If URL has hash (e.g. #faq), scroll to that element.
    if (hash) {
      const target = document.querySelector(hash);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }

    // Default navigation behavior: start page from top.
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [pathname, hash]);

  return null;
}
