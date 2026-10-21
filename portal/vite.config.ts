import { defineConfig, type Plugin } from 'vite';
import { COMING_SOON, GAMES, SITE } from './src/games';

// The public address is needed for link previews (absolute og:image URLs),
// the canonical link and the sitemap. Set SITE_URL in Vercel once you have a
// custom domain; until then Vercel's own production URL is used automatically.
function siteUrl() {
  const raw = process.env.SITE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL || 'http://localhost:5173';
  const withProto = /^https?:\/\//.test(raw) ? raw : `https://${raw}`;
  return withProto.replace(/\/+$/, '');
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

const infoIcon = `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path d="M12 10.5v7" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"/><circle cx="12" cy="6.4" r="2.1" fill="currentColor"/></svg>`;
const ideaIcon = `<svg viewBox="0 0 24 24" width="48" height="48" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V17h5v-1.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/></svg>`;
const giftIcon = `<svg viewBox="0 0 24 24" width="56" height="56" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="18" height="13" rx="2"/><path d="M12 8v13M3 12h18M12 8c-2-4-6-4-6-1.5S10 8 12 8zm0 0c2-4 6-4 6-1.5S14 8 12 8z"/></svg>`;

/** The shelf, written into the page at build time so it works (and is indexed) without JavaScript. */
export function tilesMarkup() {
  const games = GAMES.map(
    (g) => `<li class="cell"><a class="box" href="${esc(g.url)}" target="_blank" rel="noopener" data-game="${esc(g.id)}">
      <img src="/games/${esc(g.id)}.jpg" alt="${esc(g.alt)}" width="640" height="480" loading="eager" decoding="async" />
      <span class="box-name">${esc(g.name)}</span>${g.isNew ? '<span class="badge">חדש</span>' : ''}</a>
      <button type="button" class="info" aria-label="על ${esc(g.name)}" aria-describedby="tip-${esc(g.id)}"><span class="info-dot">${infoIcon}</span></button>
      <span class="tip" role="tooltip" id="tip-${esc(g.id)}">${esc(g.about)}</span></li>`,
  );
  const idea = `<li class="cell"><button type="button" class="box idea-box" data-open-idea>
      <span class="idea-circle">${ideaIcon}</span><span class="box-name">יש לי רעיון!</span><span class="box-sub">ספרו לנו איזה משחק לבנות</span></button></li>`;
  const soon = Array.from({ length: COMING_SOON }, () => `<li class="cell"><div class="box soon-box">
      <span class="soon-icon">${giftIcon}</span><span class="box-name">בקרוב</span><span class="box-sub">משחק חדש בדרך</span></div></li>`);
  return [...games, idea, ...soon].join('\n');
}

function jsonLd(url: string) {
  const data = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        name: SITE.name,
        alternateName: SITE.nameEn,
        url: `${url}/`,
        description: SITE.description,
        inLanguage: 'he',
      },
      {
        '@type': 'ItemList',
        name: 'המשחקים של משחקי דורותי',
        itemListElement: GAMES.map((g, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          item: {
            '@type': 'VideoGame',
            name: g.name,
            url: g.url,
            image: `${url}/games/${g.id}.jpg`,
            description: g.about,
            genre: g.genre,
            gamePlatform: ['Web browser', 'Mobile', 'Tablet'],
            playMode: 'SinglePlayer',
            isFamilyFriendly: true,
            typicalAgeRange: '4-99',
            ...(g.inLanguage ? { inLanguage: g.inLanguage } : {}),
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'ILS' },
          },
        })),
      },
    ],
  };
  return JSON.stringify(data, null, 2).replace(/</g, '\\u003c');
}

function portal(): Plugin {
  const url = siteUrl();
  return {
    name: 'dorothy-games-portal',
    transformIndexHtml: {
      order: 'pre',
      handler: (html) =>
        html
          .replace('<!--GAMES-->', tilesMarkup())
          .replace('<!--FACTS-->', SITE.facts.map(esc).join(' · '))
          .replace('<!--JSONLD-->', jsonLd(url))
          .replaceAll('%DESCRIPTION%', esc(SITE.description))
          .replaceAll('%SITE_URL%', url),
    },
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
  plugins: [portal()],
  // never inline fonts as data: URIs: the strict Content-Security-Policy (font-src 'self') would refuse them
  build: { target: 'es2020', assetsInlineLimit: 0 },
});
