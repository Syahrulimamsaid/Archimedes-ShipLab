import { GameObjects, Scene } from "phaser";

import { Button } from "../../../component/Button/Button";

export interface QuizModalConfig {
    title: string;
    message: string;
    badgeNote: string;
}

/**
 * Placeholder for the "Kuis SOP Darurat Kebocoran" triggered when the
 * watertight door is manipulated. The actual quiz questions/scoring and
 * badge-unlock persistence aren't wired up yet — this just proves out the
 * trigger point described in the spec.
 */
export class QuizModal {
    private scene: Scene;
    private container: GameObjects.Container;

    constructor(scene: Scene, config: QuizModalConfig) {
        this.scene = scene;

        const overlay = scene.add
            .rectangle(0, 0, 100, 100, 0x081a33, 0.55)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: false });
        const panelBg = scene.add
            .rectangle(0, 0, 460, 280, 0xffffff, 0.98)
            .setStrokeStyle(3, 0xd39d1f, 1)
            .setOrigin(0.5);
        const title = scene.add
            .text(0, -96, config.title, {
                fontFamily: "Arial Black",
                fontSize: 22,
                color: "#143a84",
                align: "center",
                wordWrap: { width: 400 },
            })
            .setOrigin(0.5);
        const message = scene.add
            .text(0, -20, config.message, {
                fontFamily: "Arial",
                fontSize: 16,
                color: "#28466d",
                align: "center",
                wordWrap: { width: 400 },
                lineSpacing: 6,
            })
            .setOrigin(0.5);
        const badgeNote = scene.add
            .text(0, 56, config.badgeNote, {
                fontFamily: "Arial Black",
                fontSize: 14,
                color: "#a06a12",
                align: "center",
                wordWrap: { width: 380 },
                lineSpacing: 4,
            })
            .setOrigin(0.5);
        const closeButton = new Button(scene, {
            width: 140,
            height: 46,
            text: "Tutup",
            fillColor: 0x2f68d8,
            strokeColor: 0xffffff,
            strokeAlpha: 0.24,
            borderRadius: 16,
            hoverAnimation: "popup",
            hoverScale: 1.08,
            hoverOffsetY: 4,
        });

        closeButton.setPosition(0, 112);
        closeButton.on("pointerdown", () => this.close());

        overlay.on(
            "pointerdown",
            (
                _pointer: Phaser.Input.Pointer,
                _localX: number,
                _localY: number,
                event: Phaser.Types.Input.EventData,
            ) => {
                event.stopPropagation();
            },
        );

        this.container = scene.add
            .container(0, 0, [
                overlay,
                panelBg,
                title,
                message,
                badgeNote,
                closeButton.view,
            ])
            .setDepth(100);
        this.container.setData("overlay", overlay);
        this.container.setVisible(false);
    }

    get view() {
        return this.container;
    }

    open() {
        this.container.setVisible(true);
        this.container.alpha = 0;
        this.container.setScale(0.96);

        this.scene.tweens.killTweensOf(this.container);
        this.scene.tweens.add({
            targets: this.container,
            alpha: 1,
            scaleX: 1,
            scaleY: 1,
            duration: 180,
            ease: "Quad.Out",
        });
    }

    close() {
        this.scene.tweens.killTweensOf(this.container);
        this.scene.tweens.add({
            targets: this.container,
            alpha: 0,
            scaleX: 0.96,
            scaleY: 0.96,
            duration: 160,
            ease: "Quad.Out",
            onComplete: () => {
                this.container.setVisible(false);
            },
        });
    }

    layout(centerX: number, centerY: number, width: number, height: number) {
        this.container.setPosition(centerX, centerY);
        this.container.setSize(width, height);

        const overlay = this.container.getData(
            "overlay",
        ) as GameObjects.Rectangle;
        overlay.setSize(width, height);
    }
}
