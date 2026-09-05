import { GameObjects, Scene } from "phaser";

export interface MenuCardConfig {
    texture: string;
    onSelect: () => void;
}

export class MenuCard {
    private scene: Scene;
    private card: GameObjects.Image;

    constructor(scene: Scene, config: MenuCardConfig) {
        this.scene = scene;

        this.card = scene.add
            .image(0, 0, config.texture)
            .setDepth(10)
            .setInteractive({ useHandCursor: true });

        this.card.on("pointerdown", () => config.onSelect());
        this.card.on("pointerover", () => this.showPopup());
        this.card.on("pointerout", () => this.hidePopup());
    }

    get view() {
        return this.card;
    }

    layout(x: number, y: number, width: number, height: number) {
        this.card.setPosition(x, y);
        this.card.setDisplaySize(width, height);
        this.card.setData("baseY", y);
        this.card.setData("baseWidth", width);
        this.card.setData("baseHeight", height);
    }

    playIntroAnimation(delay: number) {
        const baseY = this.card.getData("baseY") as number;
        const baseWidth = this.card.getData("baseWidth") as number;
        const baseHeight = this.card.getData("baseHeight") as number;

        this.card.setAlpha(0);
        this.card.setY(baseY + 18);
        this.card.setDisplaySize(baseWidth * 0.96, baseHeight * 0.96);

        this.scene.tweens.add({
            targets: this.card,
            alpha: 1,
            y: baseY,
            displayWidth: baseWidth,
            displayHeight: baseHeight,
            duration: 500,
            delay,
            ease: "Back.Out",
        });
    }

    private showPopup() {
        const baseY = this.card.getData("baseY") as number;
        const baseWidth = this.card.getData("baseWidth") as number;
        const baseHeight = this.card.getData("baseHeight") as number;

        this.scene.tweens.killTweensOf(this.card);
        this.scene.tweens.add({
            targets: this.card,
            displayWidth: baseWidth * 1.06,
            displayHeight: baseHeight * 1.06,
            y: baseY - 12,
            duration: 180,
            ease: "Quad.Out",
        });
    }

    private hidePopup() {
        const baseY = this.card.getData("baseY") as number;
        const baseWidth = this.card.getData("baseWidth") as number;
        const baseHeight = this.card.getData("baseHeight") as number;

        this.scene.tweens.killTweensOf(this.card);
        this.scene.tweens.add({
            targets: this.card,
            displayWidth: baseWidth,
            displayHeight: baseHeight,
            y: baseY,
            duration: 180,
            ease: "Quad.Out",
        });
    }
}
