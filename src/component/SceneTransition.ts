import { GameObjects, Scene } from "phaser";

interface SlideStyle {
    dx: number;
    dy: number;
}

// Varied per-group entrance directions (down, up, right, left) cycling in
// order, so a scene's components don't all animate in as one uniform block.
const STYLES: SlideStyle[] = [
    { dx: 0, dy: -36 },
    { dx: 0, dy: 36 },
    { dx: -36, dy: 0 },
    { dx: 36, dy: 0 },
];

/**
 * Records everything added to `root` while `build` runs as one animatable
 * group. Call once per logical component (a header, a card, a panel) around
 * its `this.buildX()` call in `create()`, collecting into a `groups` array
 * that's then handed to playSceneEnter/playSceneExit — this only reads
 * `root.list`'s length before/after, so it needs no changes inside the
 * build method itself (nested `root.add(...)` calls are all captured).
 */
export function trackGroup(root: GameObjects.Container, groups: GameObjects.GameObject[][], build: () => void) {
    const start = root.list.length;
    build();
    const added = root.list.slice(start) as GameObjects.GameObject[];
    if (added.length > 0) {
        groups.push(added);
    }
}

/**
 * Fades + slides each tracked group into place with a staggered delay and a
 * direction that cycles per group — every component gets its own entrance
 * instead of the whole scene rising in as one block.
 */
export function playSceneEnter(scene: Scene, groups: GameObjects.GameObject[][]) {
    groups.forEach((group, index) => {
        if (group.length === 0) return;
        const style = STYLES[index % STYLES.length];

        group.forEach((obj) => {
            const g = obj as unknown as { x: number; y: number; alpha: number };
            g.x += style.dx;
            g.y += style.dy;
            g.alpha = 0;
        });

        scene.tweens.add({
            targets: group,
            x: `-=${style.dx}`,
            y: `-=${style.dy}`,
            alpha: 1,
            duration: 450,
            delay: index * 70,
            ease: "Back.Out",
        });
    });
}

/**
 * The reverse of playSceneEnter — each group fades/slides back out (the
 * same direction it arrived from) before `onComplete` (typically a
 * `scene.start(...)` call) fires, once every group's tween has finished.
 */
export function playSceneExit(scene: Scene, groups: GameObjects.GameObject[][], onComplete: () => void) {
    let maxEnd = 0;

    groups.forEach((group, index) => {
        if (group.length === 0) return;
        const style = STYLES[index % STYLES.length];
        const duration = 260;
        const delay = index * 40;

        scene.tweens.add({
            targets: group,
            x: `+=${style.dx}`,
            y: `+=${style.dy}`,
            alpha: 0,
            duration,
            delay,
            ease: "Quad.In",
        });

        maxEnd = Math.max(maxEnd, delay + duration);
    });

    scene.time.delayedCall(maxEnd, onComplete);
}
