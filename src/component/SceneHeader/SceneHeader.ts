import { GameObjects, Scene } from "phaser";

import { Button } from "../Button/Button";

export interface SceneHeaderConfig {
    title: string;
    subtitle?: string;
    onBack: () => void;
}

/** Shared top bar (title + back button) used by module scenes. */
export class SceneHeader {
    private bar: GameObjects.Graphics;
    private titleText: GameObjects.Text;
    private subtitleText?: GameObjects.Text;
    private backButton: Button;

    constructor(scene: Scene, config: SceneHeaderConfig) {
        this.bar = scene.add.graphics().setDepth(20);

        this.titleText = scene.add
            .text(0, 0, config.title, {
                fontFamily: "Arial Black",
                fontSize: 22,
                color: "#ffffff",
            })
            .setOrigin(0, 0.5)
            .setDepth(21);

        if (config.subtitle) {
            this.subtitleText = scene.add
                .text(0, 0, config.subtitle, {
                    fontFamily: "Arial",
                    fontSize: 14,
                    color: "#d8e8ff",
                })
                .setOrigin(0, 0.5)
                .setDepth(21);
        }

        this.backButton = new Button(scene, {
            width: 130,
            height: 44,
            text: "← Kembali",
            fillColor: 0x14356e,
            strokeColor: 0xffffff,
            strokeAlpha: 0.3,
            borderRadius: 14,
            fontSize: 15,
            hoverAnimation: "popup",
            hoverScale: 1.05,
            hoverOffsetY: 3,
        });
        this.backButton.view.setDepth(21);
        this.backButton.on("pointerdown", () => config.onBack());
    }

    layout(width: number, height: number) {
        const paddingX = Math.max(12, width * 0.012);
        const paddingTop = Math.max(10, height * 0.012);
        const barHeight = Math.max(58, height * 0.088);
        const radius = Math.min(60, barHeight * 0.6);
        const innerPaddingX = Math.max(20, width * 0.014);
        const barCenterY = paddingTop + barHeight / 2;

        this.bar.clear();
        this.bar.fillStyle(0x0d4fa3, 0.9);
        this.bar.lineStyle(2, 0xffffff, 0.22);
        this.bar.fillRoundedRect(
            paddingX,
            paddingTop,
            width - paddingX * 2,
            barHeight,
            radius,
        );
        this.bar.strokeRoundedRect(
            paddingX,
            paddingTop,
            width - paddingX * 2,
            barHeight,
            radius,
        );

        const backButtonWidth = 130;
        this.backButton.setPosition(
            paddingX + innerPaddingX + backButtonWidth / 2,
            barCenterY,
        );

        const textX = paddingX + innerPaddingX + backButtonWidth + 24;
        if (this.subtitleText) {
            this.titleText.setPosition(textX, barCenterY - 12);
            this.subtitleText.setPosition(textX, barCenterY + 12);
        } else {
            this.titleText.setPosition(textX, barCenterY);
        }
    }
}
