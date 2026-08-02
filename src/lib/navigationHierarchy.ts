
// Logical parent of each route, used to override the mobile/browser back button
// so it follows the app's page hierarchy instead of raw browser history.
const PARENT_ROUTES: { pattern: RegExp; parent: string }[] = [
  { pattern: /^\/products\/[^/]+$/, parent: '/products' },
  { pattern: /^\/orders\/[^/]+$/, parent: '/orders' },
  { pattern: /^\/chat\/[^/]+$/, parent: '/chat' },
  { pattern: /^\/seller\/(products|orders|offers|promotions)$/, parent: '/seller/dashboard' },
  { pattern: /^\/admin\/(products|categories|promotions|reports|settings|transactions|users)$/, parent: '/admin/dashboard' },
];

// Everything else (top-level sections like /products, /orders, /profile, /chat,
// /offers, /seller/dashboard, /admin/dashboard, /seller/register, /auth/*) falls
// back to home.
export function getParentRoute(pathname: string): string | null {
  if (pathname === '/') return null;
  const match = PARENT_ROUTES.find(({ pattern }) => pattern.test(pathname));
  return match ? match.parent : '/';
}
