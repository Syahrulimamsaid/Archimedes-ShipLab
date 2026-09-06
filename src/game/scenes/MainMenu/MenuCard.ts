import { GameObjects, Scene } from "phaser";

export interface MenuCardConfig {
    texture: string;
    onSelect: () => void;
    locked?: boolean;
}

export class MenuCard {
    private scene: Scene;
    private card: GameObjects.Image;
    private lockOverlay: GameObjects.Graphics;
    private lockIcon: GameObjects.Graphics;
    private locked: boolean;

    constructor(scene: Scene, config: MenuCardConfig) {
        this.scene = scene;
        this.locked = config.locked ?? false;

        this.card = scene.add
            .image(0, 0, config.texture)
            .setDepth(10)
            .setInteractive({ useHandCursor: !this.locked });

        this.lockOverlay = scene.add.graphics().setDepth(11);
        this.lockIcon = scene.add.graphics().setDepth(12);

        this.card.on("pointerdown", () => {
            if (!this.locked) {
                config.onSelect();
            }
        });
        this.card.on("pointerover", () => {
            if (!this.locked) {
                this.showPopup();
            }
        });
        this.card.on("pointerout", () => {
            if (!this.locked) {
                this.hidePopup();
            }
        });
    }

    get view() {
        return [this.card, this.lockOverlay, this.lockIcon];
    }

    setLocked(locked: boolean) {
        this.locked = locked;
        this.card.setInteractive({ useHandCursor: !locked });
        const baseWidth = this.card.getData("baseWidth") as number | undefined;
        const baseHeight = this.card.getData("baseHeight") as number | undefined;
        const baseX = this.card.x;
        const baseY = this.card.getData("baseY") as number | undefined;

        if (baseWidth && baseHeight && baseY !== undefined) {
            this.drawLockState(baseX, baseY, baseWidth, baseHeight);
        }
    }

    layout(x: number, y: number, width: number, height: number) {
        this.card.setPosition(x, y);
        this.card.setDisplaySize(width, height);
        this.card.setData("baseY", y);
        this.card.setData("baseWidth", width);
        this.card.setData("baseHeight", height);
        this.drawLockState(x, y, width, height);
    }

    playIntroAnimation(delay: number) {
        const baseY = this.card.getData("baseY") as number;
        const baseWidth = this.card.getData("baseWidth") as number;
        const baseHeight = this.card.getData("baseHeight") as number;

        this.card.setAlpha(0);
        this.lockOverlay.setAlpha(0);
        this.lockIcon.setAlpha(0);
        this.card.setY(baseY + 18);
        this.card.setDisplaySize(baseWidth * 0.96, baseHeight * 0.96);
        this.drawLockState(this.card.x, this.card.y, this.card.displayWidth, this.card.displayHeight);

        this.scene.tweens.add({
            targets: [this.card, this.lockOverlay, this.lockIcon],
            alpha: 1,
            duration: 500,
            delay,
            ease: "Back.Out",
        });

        this.scene.tweens.add({
            targets: this.card,
            y: baseY,
            displayWidth: baseWidth,
            displayHeight: baseHeight,
            duration: 500,
            delay,
            ease: "Back.Out",
            onUpdate: () => {
                this.drawLockState(this.card.x, this.card.y, this.card.displayWidth, this.card.displayHeight);
            },
        });
    }

    private drawLockState(x: number, y: number, width: number, height: number) {
        this.lockOverlay.clear();
        this.lockIcon.clear();

        if (!this.locked) {
            return;
        }

        const left = x - width / 2;
        const top = y - height / 2;
        const overlayRadius = 36;

        this.lockOverlay.fillStyle(0x000000, 0.2);
        this.lockOverlay.fillRoundedRect(left, top, width, height, overlayRadius);

        const iconCenterX = x;
        const iconCenterY = y;
        const iconScale = Math.min(width, height);
        const bodyWidth = iconScale * 0.2;
        const bodyHeight = iconScale * 0.15;
        const bodyLeft = iconCenterX - bodyWidth / 2;
        const bodyTop = iconCenterY - bodyHeight / 2 + iconScale * 0.035;
        const shackleRadius = bodyWidth * 0.32;
        const shackleCenterY = bodyTop - bodyHeight * 0.12;

        this.lockIcon.lineStyle(Math.max(3, iconScale * 0.012), 0xffffff, 0.92);
        this.lockIcon.strokeRoundedRect(bodyLeft, bodyTop, bodyWidth, bodyHeight, bodyWidth * 0.12);
        this.lockIcon.beginPath();
        this.lockIcon.arc(iconCenterX, shackleCenterY, shackleRadius, Math.PI, 0, false);
        this.lockIcon.strokePath();
        this.lockIcon.fillStyle(0xffffff, 0.92);
        this.lockIcon.fillCircle(iconCenterX, bodyTop + bodyHeight * 0.48, Math.max(4, iconScale * 0.012));
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
            onUpdate: () => {
                this.drawLockState(this.card.x, this.card.y, this.card.displayWidth, this.card.displayHeight);
            },
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
            onUpdate: () => {
                this.drawLockState(this.card.x, this.card.y, this.card.displayWidth, this.card.displayHeight);
            },
        });
    }
}
