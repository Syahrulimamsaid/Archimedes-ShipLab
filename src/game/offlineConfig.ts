import { CANVAS } from "phaser";

// Single place where the offline (file://) build differs from the online build
// at runtime. `__OFFLINE_BUILD__` is only defined by vite/config.offline.mjs;
// in dev and in the normal online build it is undefined, so this is a no-op.
declare const __OFFLINE_BUILD__: boolean | undefined;

export const IS_OFFLINE_BUILD =
    typeof __OFFLINE_BUILD__ !== "undefined" && __OFFLINE_BUILD__ === true;

/**
 * Why the offline build needs different Phaser settings:
 *
 * A page opened from file:// has an opaque ("null") origin. Chromium blocks
 * every XMLHttpRequest/fetch to a file:// URL from such a page ("Cross origin
 * requests are only supported for protocol schemes: ... http, https").
 * Phaser's defaults use XHR for:
 *   - images  (loader.imageLoadType "XHR": blob -> object URL), and
 *   - audio   (Web Audio: XHR arraybuffer -> AudioContext.decodeAudioData).
 * Plain <img>/<audio> element loads are NOT subject to that rule, so:
 *   - loader.imageLoadType = "HTMLImageElement"  -> <img src="assets/...">
 *   - audio.disableWebAudio = true               -> HTML5AudioSoundManager,
 *     every clip is an <audio src="assets/..."> element.
 *
 * File-sourced images are cross-origin to a null-origin page, so they are
 * "tainted": WebGL refuses to upload them as textures (SecurityError), while
 * the Canvas renderer can still draw them. Hence the Canvas renderer here.
 */
export function withOfflineOverrides(
    config: Phaser.Types.Core.GameConfig,
): Phaser.Types.Core.GameConfig {
    if (!IS_OFFLINE_BUILD) {
        return config;
    }

    return {
        ...config,
        type: CANVAS,
        loader: { ...config.loader, imageLoadType: "HTMLImageElement" },
        audio: { ...config.audio, disableWebAudio: true },
    };
}
