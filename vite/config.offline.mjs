import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Offline build: `npm run build:offline` -> dist-offline/
 *
 * Goal: the folder can be copied anywhere and opened by double-clicking
 * index.html (file:// URL, opaque "null" origin), with no server at all.
 *
 * Differences from config.prod.mjs (the online build), and why:
 *
 *  - Chromium refuses to load `<script type="module" src="...">` from a
 *    file:// page ("Access to script ... from origin 'null' has been blocked
 *    by CORS policy"), because module scripts are always fetched in CORS
 *    mode. Classic scripts are not. So the app is emitted as ONE classic IIFE
 *    bundle (no code splitting, no dynamic-import chunks, no modulepreload)
 *    and the HTML tag is rewritten to a plain deferred classic script.
 *
 *  - Phaser's loader is told (at runtime, see src/game/offline.ts) to use
 *    HTML5 <audio> / <img> element loading instead of XHR, since XHR/fetch of
 *    file:// URLs is also blocked from a null origin. That part lives in app
 *    code because it is a runtime decision; this config only sets the
 *    __OFFLINE_BUILD__ flag that enables it.
 *
 * Images and audio remain separate files: they live in public/ and are copied
 * verbatim to dist-offline/assets/..., and nothing here inlines them.
 */
const classicScriptHtml = () => ({
    name: 'offline-classic-script-html',
    enforce: 'post',
    transformIndexHtml: {
        order: 'post',
        handler(html) {
            return html
                // <script type="module" crossorigin src=...> -> <script defer src=...>
                .replace(/<script\s+type="module"\s+crossorigin\s+src=/g, '<script defer src=')
                .replace(/<script\s+type="module"\s+src=/g, '<script defer src=')
                // CSS <link crossorigin> is harmless for stylesheets but drop it
                // anyway so no request from this page is made in CORS mode.
                .replace(/(<link rel="stylesheet")\s+crossorigin/g, '$1');
        },
    },
    generateBundle(_opts, bundle) {
        // Fail the build loudly if anything would still need an ES-module load.
        for (const file of Object.values(bundle)) {
            if (file.type === 'asset' && file.fileName.endsWith('.html')) {
                const src = String(file.source);
                if (/type="module"|modulepreload/.test(src)) {
                    this.error(`offline build: ${file.fileName} still references an ES module script`);
                }
            }
        }
    },
});

export default defineConfig({
    base: './',
    define: {
        __OFFLINE_BUILD__: 'true',
    },
    plugins: [react(), classicScriptHtml()],
    logLevel: 'warning',
    build: {
        outDir: 'dist-offline',
        emptyOutDir: true,
        modulePreload: false,
        cssCodeSplit: false,
        rollupOptions: {
            output: {
                format: 'iife',
                inlineDynamicImports: true,
                entryFileNames: 'assets/index.js',
                assetFileNames: 'assets/[name][extname]',
            },
        },
        minify: 'terser',
        terserOptions: {
            compress: { passes: 2 },
            mangle: true,
            format: { comments: false },
        },
    },
});
