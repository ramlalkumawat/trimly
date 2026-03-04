import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Ensures each route change starts from top in admin dashboard pages.
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [pathname]);

  return null;
}
