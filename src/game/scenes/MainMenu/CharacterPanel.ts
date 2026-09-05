import { GameObjects, Scene } from "phaser";

// Real artwork aspect ratios (height / width), so both images scale without
// distortion regardless of the size they're laid out at.
const ICON_ASPECT = 768 / 2048; // assets/logo.png — wide banner
const CHARACTER_ASPECT = 1536 / 1024; // assets/character.png — tall portrait

/**
 * Replaces the old profile/score/badge stack in MainMenu's right column:
 * the Archimedes-ShipLab logo (aligned with the "Selamat Datang, Taruna!"
 * row) and, independently below it, a character portrait sized to match
 * the menu cards' height exactly.
 */
export class CharacterPanel {
    private readonly iconWidthRef = 260;
    private readonly iconHeightRef = this.iconWidthRef * ICON_ASPECT;
    private readonly characterWidthRef = 340;
    private readonly characterHeightRef =
        this.characterWidthRef * CHARACTER_ASPECT;

    private scene: Scene;
    private icon: GameObjects.Image;
    private character: GameObjects.Image;

    constructor(scene: Scene) {
        this.scene = scene;
        this.icon = scene.add.image(0, 0, "logo");
        this.character = scene.add.image(0, 0, "character");
    }

    /**
     * Centers the logo on `centerY` (the same row as the welcome title),
     * sized to fit `maxWidth`.
     */
    layoutLogo(centerX: number, centerY: number, maxWidth: number) {
        const scale = Math.min(1, maxWidth / this.iconWidthRef);
        const iconWidth = this.iconWidthRef * scale;
        const iconHeight = this.iconHeightRef * scale;

        this.icon.setPosition(centerX, centerY);
        this.icon.setDisplaySize(iconWidth * 1.3, iconHeight* 1.3);
    }

    /**
     * Sizes the character to exactly `targetHeight` tall and positions its
     * top at `top`, so it lines up with the menu cards top-to-bottom,
     * clamped so it never overflows `maxWidth`.
     */
    layoutCharacter(
        centerX: number,
        top: number,
        targetHeight: number,
        maxWidth: number,
    ) {
        const heightScale = targetHeight / this.characterHeightRef;
        const widthScale = maxWidth / this.characterWidthRef;
        const scale = Math.min(heightScale, widthScale);

        const characterWidth = this.characterWidthRef * scale;
        const characterHeight = this.characterHeightRef * scale;

        this.character.setPosition(centerX, top + (characterHeight * 1.2) / 2);
        this.character.setDisplaySize(
            characterWidth * 1.3,
            characterHeight * 1.3,
        );
    }

    playIntroAnimation(baseDelay: number) {
        const items: Array<
            GameObjects.GameObject & {
                alpha: number;
                y: number;
                scaleX: number;
                scaleY: number;
            }
        > = [this.icon, this.character];

        items.forEach((item, index) => {
            item.alpha = 0;
            item.y += 18;
            item.scaleX *= 0.96;
            item.scaleY *= 0.96;

            this.scene.tweens.add({
                targets: item,
                alpha: 1,
                y: item.y - 18,
                scaleX: item.scaleX / 0.96,
                scaleY: item.scaleY / 0.96,
                duration: 500,
                delay: baseDelay + index * 80,
                ease: "Back.Out",
            });
        });
    }
}
