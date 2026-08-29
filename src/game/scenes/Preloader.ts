import { GameObjects, Scene, Scale } from "phaser";

export class Preloader extends Scene
{
    private background!: GameObjects.Image;
    private logo!: GameObjects.Image;
    private progressFrame!: Phaser.GameObjects.Graphics;
    private progressFill!: Phaser.GameObjects.Graphics;
    private progressText!: GameObjects.Text;
    private continueText!: GameObjects.Text;
    private isReadyToContinue = false;
    private progressValue = 0;
    private hasPlayedIntro = false;
    private progressIntroScale = 1;

    constructor() {
        super("Preloader");
    }

    init() {
        this.background = this.add.image(0, 0, "background");
        this.logo = this.add.image(0, 0, "logo").setDepth(20);

        this.progressFrame = this.add.graphics();
        this.progressFill = this.add.graphics();

        this.progressText = this.add
            .text(0, 0, "0% Memuat Konten", {
                fontFamily: "Arial",
                fontSize: 28,
                color: "#d4f0ff",
                fontStyle: "bold",
            })
            .setOrigin(0.5);

        this.continueText = this.add
            .text(0, 0, "Klik di mana saja untuk lanjut", {
                fontFamily: "Arial",
                fontSize: 22,
                color: "#ffffff",
                stroke: "#0b4f7a",
                strokeThickness: 4,
            })
            .setOrigin(0.5)
            .setAlpha(0);

        this.layout(this.scale.width, this.scale.height);
        this.scale.on(Scale.Events.RESIZE, this.handleResize, this);

        this.load.on("progress", (progress: number) => {
            const percent = Math.round(progress * 100);

            this.progressValue = progress;
            this.progressText.setText(`${percent}% Memuat Konten`);
            this.layout(this.scale.width, this.scale.height);
        });

        this.load.once("complete", () => {
            this.isReadyToContinue = true;
            this.progressValue = 1;
            this.progressText.setText("100% Memuat Konten");
            this.layout(this.scale.width, this.scale.height);

            this.tweens.add({
                targets: this.continueText,
                alpha: 1,
                duration: 400,
                ease: "Power2",
            });
        });
    }

    preload() {
        this.load.setPath("assets");

        this.load.image("star", "star.png");
    }

    create() {
        this.playIntroAnimation();

        this.input.once("pointerdown", () => {
            if (this.isReadyToContinue) {
                this.scene.start("MainMenu");
            }
        });

        this.events.once("shutdown", () => {
            this.scale.off(Scale.Events.RESIZE, this.handleResize, this);
        });
    }

    private handleResize(gameSize: Phaser.Structs.Size) {
        this.layout(gameSize.width, gameSize.height);
    }

    private playIntroAnimation() {
        if (this.hasPlayedIntro) {
            return;
        }

        this.hasPlayedIntro = true;

        const logoFinalScaleX = this.logo.scaleX;
        const logoFinalScaleY = this.logo.scaleY;

        this.logo.setAlpha(0);
        this.logo.setScale(logoFinalScaleX * 0.82, logoFinalScaleY * 0.82);
        this.logo.setAngle(-4);

        this.progressFrame.setAlpha(0);
        this.progressFill.setAlpha(0);
        this.progressIntroScale = 0.9;

        this.progressText.setAlpha(0);
        this.progressText.setScale(0.88);
        this.progressText.setAngle(2);

        this.continueText.setAlpha(0);
        this.continueText.setScale(0.9);
        this.continueText.setAngle(-2);

        this.tweens.add({
            targets: this.logo,
            alpha: 1,
            scaleX: logoFinalScaleX,
            scaleY: logoFinalScaleY,
            angle: 0,
            duration: 1000,
            ease: 'Back.Out',
            delay: 0
        });

        this.tweens.add({
            targets: this,
            progressIntroScale: 1,
            duration: 1000,
            ease: 'Back.Out',
            delay: 100,
            onStart: () => {
                this.progressFrame.setAlpha(1);
                this.progressFill.setAlpha(1);
            },
            onUpdate: () => {
                this.layout(this.scale.width, this.scale.height);
            }
        });

        this.tweens.add({
            targets: this.progressText,
            alpha: 1,
            scaleX: 1,
            scaleY: 1,
            angle: 0,
            duration: 1000,
            ease: 'Back.Out',
            delay: 200
        });

        this.tweens.add({
            targets: this.continueText,
            alpha: this.isReadyToContinue ? 1 : 0,
            scaleX: 1,
            scaleY: 1,
            angle: 0,
            duration: 1000,
            ease: 'Back.Out',
            delay: 300
        });
    }

    private layout(width: number, height: number) {
        const centerX = width / 2;
        const centerY = height / 2;
        const frameWidth = Math.min(width * 0.62, 680) * this.progressIntroScale;
        const frameHeight = 38 * this.progressIntroScale;
        const cornerRadius = frameHeight / 2;
        const innerPadding = 3;
        const fillWidth = Math.max(
            0,
            (frameWidth - innerPadding * 2) * this.progressValue,
        );
        const barX = centerX - frameWidth / 2;
        const barY = centerY + 40;
        const centerWindowWidth = Math.min(width * 0.48, 760);
        const centerWindowHeight = Math.min(height * 0.34, 320);
        const logoMaxWidth = centerWindowWidth * 0.92;
        const logoMaxHeight = centerWindowHeight * 0.78;

        this.background.setPosition(centerX, centerY);
        this.background.setDisplaySize(width, height);

        this.logo.setPosition(centerX, centerY - 120);
        this.logo.setDisplaySize(logoMaxWidth, logoMaxHeight);

        this.progressFrame.clear();
        this.progressFrame.lineStyle(3, 0x2c8fb8, 1);
        this.progressFrame.fillStyle(0xffffff, 0.92);
        this.progressFrame.fillRoundedRect(
            barX,
            barY,
            frameWidth,
            frameHeight,
            cornerRadius,
        );
        this.progressFrame.strokeRoundedRect(
            barX,
            barY,
            frameWidth,
            frameHeight,
            cornerRadius,
        );

        this.progressFill.clear();
        if (fillWidth > 0) {
            this.progressFill.fillStyle(0x5ba9e1, 1);
            this.progressFill.fillRoundedRect(
                barX + innerPadding,
                barY + innerPadding,
                fillWidth,
                frameHeight - innerPadding * 2,
                Math.max(8, cornerRadius - innerPadding),
            );
        }

        this.progressText.setPosition(centerX, barY + frameHeight + 42);
        this.continueText.setPosition(centerX, barY + frameHeight + 90);
    }
}
