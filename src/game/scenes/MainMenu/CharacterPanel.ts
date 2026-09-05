import { GameObjects, Scene } from "phaser";

const CHARACTER_ASPECT = 1536 / 1024;
const SIZE_BOOST = 1.3;

export class CharacterPanel {
    private readonly characterWidthRef = 340;
    private readonly characterHeightRef = this.characterWidthRef * CHARACTER_ASPECT;

    private scene: Scene;
    private character: GameObjects.Image;

    constructor(scene: Scene) {
        this.scene = scene;
        this.character = scene.add.image(0, 0, "character");
    }

    layout(centerX: number, top: number, targetHeight: number, maxWidth: number) {
        const heightScale = targetHeight / this.characterHeightRef;
        const widthScale = maxWidth / this.characterWidthRef;
        const scale = Math.min(heightScale, widthScale);

        const characterWidth = this.characterWidthRef * scale * SIZE_BOOST;
        const characterHeight = this.characterHeightRef * scale * SIZE_BOOST;

        this.character.setPosition(centerX, top + characterHeight / 2);
        this.character.setDisplaySize(characterWidth, characterHeight);
    }

    playIntroAnimation(baseDelay: number) {
        const item = this.character;
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
            delay: baseDelay,
            ease: "Back.Out",
        });
    }
}
