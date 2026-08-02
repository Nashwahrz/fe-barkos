'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getParentRoute } from '@/lib/navigationHierarchy';

// Makes the hardware/browser back button follow the app's page hierarchy
// (e.g. product detail -> product list -> home) instead of raw click history.
// On the home page, back is left alone so it exits the site/app as usual.
export function useHierarchicalBackButton() {
  const pathname = usePathname();
  const router = useRouter();

  // Keep a "guard" history entry on top of every non-home page so a single
  // back press can be intercepted before it actually leaves the page.
  useEffect(() => {
    if (pathname === '/') return;
    window.history.pushState({ __backGuard: true }, '', pathname);
  }, [pathname]);

  useEffect(() => {
    const handlePopState = () => {
      const currentPath = window.location.pathname;
      if (currentPath === '/') return; // let the browser exit the site normally

      const parent = getParentRoute(currentPath) ?? '/';
      // Re-arm the guard so the *next* back press is also intercepted.
      window.history.pushState({ __backGuard: true }, '', currentPath);
      router.replace(parent);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [router]);
}
