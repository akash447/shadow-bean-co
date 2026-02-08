/**
 * Shadow Bean Co - Sitemap Generator
 * ==============================================
 * Run at build time to generate sitemap.xml.
 * Add to package.json: "build": "tsx scripts/generate-sitemap.ts && tsc -b && vite build"
 * ==============================================
 */

import { writeFileSync } from 'fs';
import { resolve } from 'path';

const SITE_URL = 'https://shadowbeanco.net';
const TODAY = new Date().toISOString().split('T')[0];

interface SitemapEntry {
    url: string;
    lastmod?: string;
    changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
    priority?: number;
}

// Static pages
const staticPages: SitemapEntry[] = [
    { url: '/', changefreq: 'weekly', priority: 1.0 },
    { url: '/shop', changefreq: 'daily', priority: 0.9 },
    { url: '/about', changefreq: 'monthly', priority: 0.7 },
];

function generateSitemap(entries: SitemapEntry[]): string {
    const urls = entries.map(entry => `
  <url>
    <loc>${SITE_URL}${entry.url}</loc>
    <lastmod>${entry.lastmod || TODAY}</lastmod>
    <changefreq>${entry.changefreq || 'weekly'}</changefreq>
    <priority>${entry.priority || 0.5}</priority>
  </url>`).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls}
</urlset>`;
}

// Generate and write
const sitemap = generateSitemap(staticPages);
const outputPath = resolve(__dirname, '../public/sitemap.xml');
writeFileSync(outputPath, sitemap, 'utf-8');
console.log(`✓ Sitemap generated: ${outputPath} (${staticPages.length} URLs)`);
