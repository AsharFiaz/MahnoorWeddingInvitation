import { defineConfig, loadEnv } from 'vite';
import { WEDDING } from './src/config/wedding.js';

/* %SITE_URL% in index.html becomes VITE_SITE_URL (the deployed origin, no
   trailing slash) so the sharing image has an absolute address. Unset, the
   tags fall back to a root-relative path. */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const siteUrl = (env.VITE_SITE_URL || '').replace(/\/+$/, '');
  return {
    server: { host: '127.0.0.1', port: 5173 },
    build: { target: 'es2020', sourcemap: false, assetsInlineLimit: 0 },
    plugins: [{
      name: 'site-url',
      transformIndexHtml(html) {
        let out = html.replaceAll('%SITE_URL%', siteUrl);
        /* share.image 'none': text-only preview, no image tags at all */
        if (WEDDING.share.image === 'none') out = out.replace(/^.*(og:image|twitter:image|twitter:card).*\n/gm, '');
        return out;
      },
    }],
  };
});
