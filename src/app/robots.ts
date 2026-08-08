import type { MetadataRoute } from 'next';

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/+$/, '');

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/seller/dashboard', '/seller/orders', '/seller/offers', '/orders', '/profile', '/chat'],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}
