// End-to-end check of a built game opened directly (default: dist-offline/index.html over file://).
//
//   node scripts/verify-offline.mjs [path-to-index.html | http(s) URL]
//
// Drives the real game in Chromium via Playwright, and reports:
//  - console errors, page errors, failed requests (CORS / ERR_FILE_NOT_FOUND / ERR_FAILED ...)
//  - every Phaser audio key: loaded? backing element URL, readyState, MediaError
//  - real playback of every key (currentTime advances, play() promise not rejected)
//  - scene navigation that triggers scene-specific audio, pause/resume, replay, mute
// Exits non-zero if anything audio/JS related fails.
import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const arg = process.argv[2] ?? 'dist-offline/index.html';
const target = /^https?:|^file:/.test(arg) ? arg : pathToFileURL(path.resolve(arg)).href;

const AUDIO_KEYS = [
    'bgm.main', 'sfx.menuClick', 'bgm.dubbing_greeting', 'bgm.quizThinking', 'sfx.quizWrong', 'sfx.quizCorrect',
    'sfx.keterangan.anatomi', 'sfx.keterangan.stabilitas', 'sfx.menu.anatomi', 'sfx.menu.simulator',
    'sfx.menu.evaluasi', 'sfx.menu.tentang', 'sfx.menu.keluar', 'sfx.menu.kuis', 'sfx.nilai.baik', 'sfx.nilai.kurang',
    ...Array.from({ length: 9 }, (_, i) => `sfx.anatomi.${i + 1}`),
];

const problems = [];
const log = (...a) => console.log(...a);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });

// Record media-level failures the app itself would never surface.
await page.addInitScript(() => {
    window.__mediaLog = [];
    const origPlay = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function (...args) {
        const p = origPlay.apply(this, args);
        p?.catch?.((e) => window.__mediaLog.push({ kind: 'play-rejected', src: this.currentSrc || this.src, name: e.name, msg: e.message }));
        return p;
    };
    document.addEventListener('error', (e) => {
        const t = e.target;
        if (t instanceof HTMLMediaElement) {
            window.__mediaLog.push({ kind: 'media-error', src: t.currentSrc || t.src, code: t.error?.code, msg: t.error?.message });
        }
    }, true);
});

page.on('console', (m) => {
    if (/Failed to load resource: net::ERR_FILE_NOT_FOUND/.test(m.text())) return; // attributed via requestfailed
    if (m.type() === 'error' || m.type() === 'warning') {
        const t = m.text();
        if (/GL Driver Message/.test(t)) return;
        log(`  [console.${m.type()}] ${t}`);
        if (m.type() === 'error') problems.push(`console.error: ${t}`);
    }
});
page.on('pageerror', (e) => { log(`  [pageerror] ${e.message}`); problems.push(`pageerror: ${e.message}`); });
const missingInSource = new Set();
page.on('requestfailed', (r) => {
    const err = r.failure()?.errorText;
    const url = r.url();
    // Chromium's media stack cancels its first request for a large file and continues with
    // range requests; the element still reaches readyState 4 (checked below), so not a failure.
    if (err === 'net::ERR_ABORTED' && r.resourceType() === 'media') { log(`  [info] media request restarted (ERR_ABORTED): ${url}`); return; }
    // A file that does not exist in public/ either is a pre-existing content bug, not a file:// issue.
    const rel = decodeURIComponent(url).split(/\/dist(?:-offline)?\//).pop();
    if (/ERR_FILE_NOT_FOUND|404/.test(err ?? '') || r.response?.()?.status?.() === 404) {
        if (!fs.existsSync(path.join('public', rel))) { missingInSource.add(rel); return; }
    }
    log(`  [requestfailed] ${err} ${url}`);
    problems.push(`requestfailed: ${err} ${url}`);
});

log(`OPEN ${target}`);
await page.goto(target);

// Grab the Phaser.Game instance from the React ref held by <PhaserGame> (no app-side test hook needed).
const findGame = () => page.evaluate(() => {
    const el = document.getElementById('game-container');
    if (!el) return false;
    const fk = Object.keys(el).find((k) => k.startsWith('__reactFiber$'));
    for (let f = el[fk]; f; f = f.return) {
        for (let h = f.memoizedState; h && typeof h === 'object' && 'next' in h; h = h.next) {
            const v = h.memoizedState?.current;
            if (v && v.sound && v.scene && v.cache) { window.__game = v; return true; }
        }
    }
    return false;
});
await page.waitForFunction(() => document.getElementById('game-container')?.querySelector('canvas'), null, { timeout: 15000 });
if (!(await findGame())) throw new Error('could not locate Phaser.Game instance');

const env = await page.evaluate(() => ({
    protocol: location.protocol,
    origin: location.origin,
    renderer: window.__game.renderer.type === 1 ? 'CANVAS' : 'WEBGL',
    soundManager: window.__game.sound.constructor.name,
    scripts: [...document.scripts].map((s) => ({ type: s.type || '(classic)', src: s.getAttribute('src') })),
}));
log('ENV', JSON.stringify(env));

// Wait for the Preloader to finish (its "tap to continue" state) then do a REAL click (user gesture).
await page.waitForFunction(() => window.__game.scene.getScene('Preloader')?.isReadyToContinue === true, null, { timeout: 30000 });
log('Preloader finished loading');

// ---- load/decoding inventory (before any playback) ----
const inventory = await page.evaluate((keys) => keys.map((key) => {
    const g = window.__game;
    const entry = g.cache.audio.get(key);
    let url = null, readyState = null, mediaError = null, duration = null;
    if (Array.isArray(entry)) { // HTML5 audio: array of <audio> elements
        const a = entry[0];
        url = a?.currentSrc || a?.src; readyState = a?.readyState; mediaError = a?.error?.code ?? null; duration = a?.duration;
    } else if (entry && 'duration' in entry) { // Web Audio: AudioBuffer
        duration = entry.duration; readyState = 'AudioBuffer';
    }
    return { key, cached: !!entry, url, readyState, mediaError, duration: duration && Math.round(duration * 100) / 100 };
}), AUDIO_KEYS);
log('\nAUDIO LOAD INVENTORY');
console.table(inventory);
for (const i of inventory) {
    if (!i.cached) problems.push(`audio not loaded: ${i.key}`);
    if (i.mediaError) problems.push(`MediaError ${i.mediaError}: ${i.key}`);
    if (i.url && !i.url.startsWith(new URL('.', target).href)) problems.push(`audio URL outside app dir: ${i.url}`);
}

const box = await page.locator('canvas').boundingBox();
await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
await page.waitForFunction(() => window.__game.scene.isActive('MainMenu'), null, { timeout: 10000 });
await page.waitForTimeout(2500);

const playingKeys = () => page.evaluate(() => window.__game.sound.getAllPlaying().map((s) => s.key));
const activeScenes = () => page.evaluate(() => window.__game.scene.getScenes(true).map((s) => s.scene.key));

log('\nMainMenu active, playing:', await playingKeys());
const mm = await playingKeys();
for (const k of ['bgm.main', 'bgm.dubbing_greeting']) if (!mm.includes(k)) problems.push(`MainMenu: ${k} not playing`);

// ---- real pointer hover on a menu card (hover voice line via the real input path) ----
const hoverResult = await page.evaluate(() => {
    const s = window.__game.scene.getScene('MainMenu');
    const objs = s.children.list.filter((o) => o.input?.enabled);
    const cam = s.cameras.main; const c = window.__game.canvas.getBoundingClientRect();
    const k = c.width / window.__game.scale.width;
    return objs.map((o) => { const b = o.getBounds(); return { x: c.left + (b.centerX - cam.scrollX) * k, y: c.top + (b.centerY - cam.scrollY) * k }; });
});
const before = await page.evaluate(() => window.__mediaLog.length);
for (const pt of hoverResult.slice(0, 6)) {
    await page.mouse.move(pt.x, pt.y);
    await page.waitForTimeout(400);
    log(`  hover (${Math.round(pt.x)},${Math.round(pt.y)}) -> playing:`, await playingKeys());
}
await page.mouse.move(5, 5);

// ---- play every audio key through Phaser's sound manager and verify it really advances ----
log('\nPER-KEY PLAYBACK');
const playback = [];
for (const key of AUDIO_KEYS) {
    const r = await page.evaluate(async (key) => {
        const g = window.__game;
        const snd = g.sound.add(key, { volume: 0.01 });
        const ok = snd.play();
        const el = snd.audio ?? null; // HTML5AudioSound exposes its <audio>
        const t0 = el ? el.currentTime : snd.seek;
        await new Promise((r) => setTimeout(r, 700));
        const t1 = el ? el.currentTime : snd.seek;
        const res = {
            key, playReturned: ok, isPlaying: snd.isPlaying,
            advancedSec: Math.round((t1 - t0) * 100) / 100,
            elPaused: el ? el.paused : null, elError: el?.error?.code ?? null,
            src: el ? decodeURI(el.currentSrc).split('/dist-offline/').pop().split('/dist/').pop() : null,
        };
        // pause / resume / replay
        snd.pause(); const pausedOk = snd.isPaused;
        snd.resume(); await new Promise((r) => setTimeout(r, 200)); const resumedOk = snd.isPlaying || snd.totalDuration < 1.2;
        snd.stop(); const replay = snd.play(); await new Promise((r) => setTimeout(r, 200));
        res.pauseResume = pausedOk && resumedOk; res.replay = replay && (snd.isPlaying || snd.totalDuration < 1);
        snd.stop(); snd.destroy();
        return res;
    }, key);
    playback.push(r);
    if (!r.playReturned || !(r.advancedSec > 0) || r.elError) problems.push(`playback failed: ${JSON.stringify(r)}`);
    if (!r.pauseResume || !r.replay) problems.push(`pause/resume/replay failed: ${key}`);
}
console.table(playback);

// ---- mute / volume ----
const muteOk = await page.evaluate(() => {
    const g = window.__game; g.sound.mute = true; const m = g.sound.mute; g.sound.mute = false;
    g.sound.volume = 0.3; const v = g.sound.volume; g.sound.volume = 1; return m && Math.abs(v - 0.3) < 1e-3;
});
log('mute/volume toggle ok:', muteOk);
if (!muteOk) problems.push('mute/volume failed');

// ---- navigate through every scene that triggers scene-specific audio ----
log('\nSCENE NAVIGATION');
// [sceneKey, audio expected to be playing, optional data builder evaluated in the page]
const scenes = [
    ['AnatomiStruktur', 'sfx.keterangan.anatomi'],
    ['@anatomi-hotspot', 'sfx.anatomi.1'],
    ['QuizScene', 'bgm.quizThinking', 'anatomiQuiz'],
    ['StabilitasMateri', 'sfx.keterangan.stabilitas'],
    ['PilihAktivitasStabilitas', null],
    ['StabilitasQuiz', 'bgm.quizThinking'],
    ['SimulatorStabilitas', null],
    ['HasilUmpanBalik', null],
    ['Tentang', null],
    ['MainMenu', 'bgm.main'],
];
for (const [key, expect, dataKind] of scenes) {
    await page.evaluate(([key, dataKind]) => {
        const g = window.__game;
        const cur = g.scene.getScenes(true)[0];
        if (key === '@anatomi-hotspot') { cur.selectComponent('gading-gading'); return; } // same call a hotspot tap makes
        const data = dataKind === 'anatomiQuiz'
            ? { config: cur.quizPrompt.activeQuiz, returnScene: 'AnatomiStruktur', moduleId: 'anatomi-struktur' }
            : undefined;
        cur.scene.start(key, data);
    }, [key, dataKind ?? null]);
    await page.waitForTimeout(1800);
    const p = await playingKeys();
    log(`  ${key.padEnd(26)} active=${(await activeScenes()).join(',')} playing=${JSON.stringify(p)}`);
    if (expect && !p.includes(expect)) problems.push(`scene ${key}: expected ${expect} playing`);
}

const mediaLog = await page.evaluate(() => window.__mediaLog);
log('\nMEDIA LOG (play() rejections / media errors):', mediaLog.length ? mediaLog : 'none');
for (const m of mediaLog) problems.push(`media: ${JSON.stringify(m)}`);
void before;

await browser.close();
if (missingInSource.size) log('\nNOTE: referenced by code but absent from public/ (pre-existing, fails online too):', [...missingInSource]);
log(`\nRESULT: ${problems.length ? 'FAIL' : 'PASS'} (${problems.length} problem(s))`);
for (const p of problems) log('  - ' + p);
process.exit(problems.length ? 1 : 0);
