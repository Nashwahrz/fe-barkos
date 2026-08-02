'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getParentRoute } from '@/lib/navigationHierarchy';

// Makes the hardware/browser back button follow the app's page hierarchy
// (e.g. product detail -> product list -> home) instead of raw click history.
// On the home page, back is left alone so it exits the site/app as usual.
export function useHierarchicalBackButton() {
  const pathname = usePathname();
  const router = useRouter();
  // Tracks the pathname a guard entry has already been armed for, so the
  // pathname-change effect below and the popstate handler never both push
  // a guard for the same landing — that double-push is what previously
  // desynced the history stack and made the back button exit the app.
  const guardedPathRef = useRef<string | null>(null);

  // Keep a "guard" history entry on top of every non-home page so a single
  // back press can be intercepted before it actually leaves the page.
  useEffect(() => {
    if (pathname === '/') return;
    if (guardedPathRef.current === pathname) return;
    guardedPathRef.current = pathname;
    window.history.pushState({ __backGuard: true }, '', pathname);
  }, [pathname]);

  useEffect(() => {
    const handlePopState = () => {
      const currentPath = window.location.pathname;
      if (currentPath === '/') return; // let the browser exit the site normally

      const parent = getParentRoute(currentPath) ?? '/';
      // Re-arm the guard so the *next* back press is also intercepted, unless
      // the parent is home — home intentionally has no guard so the
      // following back press exits normally.
      guardedPathRef.current = parent;
      if (parent !== '/') {
        window.history.pushState({ __backGuard: true }, '', parent);
      }
      router.replace(parent);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [router]);
}
