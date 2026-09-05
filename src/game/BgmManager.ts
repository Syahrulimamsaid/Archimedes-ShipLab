import { Scene } from "phaser";

// Phaser's sound manager is shared globally across all scenes (Scene.sound
// is just a reference to game.sound), so a module-level singleton here
// keeps the music playing continuously as the player navigates between
// scenes instead of restarting it every time a scene is (re)created.
const BGM_KEY = "bgm.main";
const TARGET_VOLUME = 0.5;
const FADE_DURATION = 500;

let sound: Phaser.Sound.BaseSound | null = null;
let enabled = true;
// Whichever scene most recently called initBgm — used only to host the
// volume fade tween (BaseSound itself has no tween manager of its own).
let activeScene: Scene | null = null;

/** Starts the looping BGM (fading in) if it isn't already playing. Safe to
 * call every time a scene starts — it won't create duplicate sound
 * instances or re-trigger the fade if already playing. */
export function initBgm(scene: Scene) {
    activeScene = scene;

    if (!sound) {
        sound = scene.sound.add(BGM_KEY, { loop: true, volume: 0 });
    }

    if (enabled && !sound.isPlaying) {
        sound.play();
        fadeVolume(TARGET_VOLUME);
    }
}

/** Flips the enabled state and smoothly fades playback in/out accordingly
 * (rather than an abrupt play/pause). Returns the new enabled state. */
export function toggleBgm(): boolean {
    enabled = !enabled;

    if (sound) {
        if (enabled) {
            if (sound.isPaused) {
                sound.resume();
            } else if (!sound.isPlaying) {
                sound.play();
            }
            fadeVolume(TARGET_VOLUME);
        } else if (sound.isPlaying) {
            fadeVolume(0, () => sound?.pause());
        }
    }

    return enabled;
}

export function isBgmEnabled() {
    return enabled;
}

function fadeVolume(target: number, onComplete?: () => void) {
    if (!sound || !activeScene) {
        return;
    }

    activeScene.tweens.killTweensOf(sound);
    activeScene.tweens.add({
        targets: sound,
        volume: target,
        duration: FADE_DURATION,
        ease: "Sine.InOut",
        onComplete,
    });
}
