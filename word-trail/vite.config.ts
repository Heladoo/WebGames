import { defineConfig, type Plugin } from 'vite';

// The public address is needed for link previews (absolute og:image URLs),
// the canonical link and the sitemap. Set SITE_URL in Vercel once you have a
// custom domain; until then Vercel's own production URL is used automatically.
function siteUrl() {
  const raw = process.env.SITE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL || 'http://localhost:5173';
  const withProto = /^https?:\/\//.test(raw) ? raw : `https://${raw}`;
  return withProto.replace(/\/+$/, '');
}

function seo(): Plugin {
  const url = siteUrl();
  return {
    name: 'word-trail-seo',
    transformIndexHtml: { order: 'pre', handler: (html) => html.replaceAll('%SITE_URL%', url) },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: `User-agent: *\nAllow: /\nDisallow: /stats.html\nDisallow: /api/\n\nSitemap: ${url}/sitemap.xml\n`,
      });
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${url}/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>\n</urlset>\n`,
      });
    },
  };
}

export default defineConfig({
  base: '/',
  plugins: [seo()],
  // never inline fonts as data: URIs: the strict Content-Security-Policy (font-src 'self') would refuse them
  build: { target: 'es2020', assetsInlineLimit: 0 },
});
