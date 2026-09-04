import { GameObjects, Scene } from "phaser";

/**
 * Fades and drops `target` in from slightly above its resting position —
 * call once after `target`'s final position/scale (e.g. from a resize-aware
 * `layout()`) has already been set, since this reads that position as the
 * animation's end point.
 */
export function playSceneEnter(scene: Scene, target: GameObjects.Container) {
    const restingY = target.y;
    target.setAlpha(0);
    target.y = restingY - 40;
    scene.tweens.add({
        targets: target,
        alpha: 1,
        y: restingY,
        duration: 450,
        ease: "Back.Out",
    });
}

/**
 * Fades and drops `target` out, then invokes `onComplete` (typically a
 * `scene.start(...)` call) once the tween finishes.
 */
export function playSceneExit(scene: Scene, target: GameObjects.Container, onComplete: () => void) {
    scene.tweens.add({
        targets: target,
        alpha: 0,
        y: target.y + 40,
        duration: 250,
        ease: "Cubic.In",
        onComplete,
    });
}
