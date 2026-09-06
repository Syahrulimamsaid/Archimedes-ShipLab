import { Scene } from "phaser";

export const SFX_KEYS = {
    click: "sfx.menuClick",
    quizWrong: "sfx.quizWrong",
    quizCorrect: "sfx.quizCorrect",
} as const;

/** Plays a one-shot sound effect by key. Scene.sound is a shared reference
 * to the game's global sound manager, so this is safe to call even right
 * before a scene.start() navigation — the clip keeps playing regardless of
 * the originating scene's lifecycle. */
export function playSfx(scene: Scene, key: string, volume = 0.7) {
    scene.sound.play(key, { volume });
}
