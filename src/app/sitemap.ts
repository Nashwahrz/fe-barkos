import type { MetadataRoute } from 'next';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

interface ProductListItem {
  id: number | string;
  updated_at?: string;
}

async function getProductEntries(): Promise<MetadataRoute.Sitemap> {
  try {
    const res = await fetch(`${API_URL}/products?per_page=100`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];

    const json = await res.json();
    const products: ProductListItem[] = json.data?.data ?? json.data ?? [];

    return products.map((product) => ({
      url: `${APP_URL}/products/${product.id}`,
      lastModified: product.updated_at ? new Date(product.updated_at) : new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.7,
    }));
  } catch (error) {
    console.error('Error building sitemap product entries:', error);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: `${APP_URL}/`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${APP_URL}/products`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${APP_URL}/auth/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${APP_URL}/auth/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${APP_URL}/seller/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  const productEntries = await getProductEntries();

  return [...staticEntries, ...productEntries];
}
