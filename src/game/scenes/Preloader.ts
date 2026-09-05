import { GameObjects, Scene, Scale } from "phaser";

// The actual asset loading (everything in Boot.ts) already finishes before
// this scene even starts — Phaser only calls create() once loading is
// done. So the progress bar here has nothing real to time itself against;
// without an artificial pace it would just snap straight to 100%. This is
// the minimum time the bar animation takes before "tap to continue" can
// appear, regardless of how fast (or slow) real loading actually was.
const MIN_LOAD_DURATION = 2000;

export class Preloader extends Scene {
    private background!: GameObjects.Image;
    private logo!: GameObjects.Image;
    private progressFrame!: Phaser.GameObjects.Graphics;
    private progressFill!: Phaser.GameObjects.Graphics;
    private progressText!: GameObjects.Text;
    private continueText!: GameObjects.Text;
    private touchButton!: GameObjects.Image;
    private isReadyToContinue = false;
    private progressValue = 0;
    private hasPlayedIntro = false;
    private progressIntroScale = 1;
    private realLoadComplete = false;
    private minDurationElapsed = false;

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

        this.touchButton = this.add
            .image(0, 0, "btn.touch")
            .setOrigin(0.5)
            .setAlpha(0);

        this.layout(this.scale.width, this.scale.height);
        this.scale.on(Scale.Events.RESIZE, this.handleResize, this);

        this.load.once("complete", () => {
            this.realLoadComplete = true;
            this.tryFinishLoading();
        });
    }

    preload() {
        this.load.setPath("assets");

        this.load.image("star", "star.png");
    }

    create() {
        this.playIntroAnimation();
        this.playProgressAnimation();

        this.input.once("pointerdown", () => {
            if (this.isReadyToContinue) {
                // Fullscreen requires a user gesture, so it must be requested
                // here (inside the click handler), not later in MainMenu.
                if (this.scale.fullscreen.available && !this.scale.isFullscreen) {
                    this.scale.startFullscreen();
                }
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

    /** Drives the visible fill from 0 to 100% over MIN_LOAD_DURATION, in two
     * stages — a quick ramp up to 92% followed by a slower final push — the
     * same "fast, then a final crawl" pace real download bars tend to have,
     * rather than one flat linear sweep. */
    private playProgressAnimation() {
        this.tweens.add({
            targets: this,
            progressValue: 0.92,
            duration: MIN_LOAD_DURATION * 0.65,
            ease: "Cubic.Out",
            onUpdate: () => this.updateProgressDisplay(),
            onComplete: () => {
                this.tweens.add({
                    targets: this,
                    progressValue: 1,
                    duration: MIN_LOAD_DURATION * 0.35,
                    ease: "Sine.In",
                    onUpdate: () => this.updateProgressDisplay(),
                    onComplete: () => {
                        this.minDurationElapsed = true;
                        this.tryFinishLoading();
                    },
                });
            },
        });
    }

    private updateProgressDisplay() {
        const percent = Math.round(this.progressValue * 100);
        this.progressText.setText(`${percent}% Memuat Konten`);
        this.layout(this.scale.width, this.scale.height);
    }

    /** Only reveals "tap to continue" once both the paced bar animation has
     * finished AND assets are actually loaded — whichever takes longer. */
    private tryFinishLoading() {
        if (!this.minDurationElapsed || !this.realLoadComplete || this.isReadyToContinue) {
            return;
        }

        this.isReadyToContinue = true;
        this.progressValue = 1;
        this.progressText.setText("100% Memuat Konten");
        this.layout(this.scale.width, this.scale.height);

        this.tweens.add({
            targets: [this.progressText, this.progressFrame, this.progressFill],
            alpha: 0,
            duration: 240,
            ease: "Power2",
        });

        this.tweens.add({
            targets: this.continueText,
            alpha: 1,
            duration: 300,
            ease: "Power2",
        });

        this.tweens.add({
            targets: this.touchButton,
            alpha: 1,
            duration: 300,
            ease: "Power2",
            onComplete: () => {
                this.touchButton.setData("baseY", this.touchButton.y);
                this.tweens.add({
                    targets: this.touchButton,
                    y: this.touchButton.y - 6,
                    duration: 650,
                    ease: "Sine.InOut",
                    yoyo: true,
                    repeat: -1,
                });
            },
        });
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

        this.tweens.add({
            targets: this.logo,
            alpha: 1,
            scaleX: logoFinalScaleX,
            scaleY: logoFinalScaleY,
            angle: 0,
            duration: 1000,
            ease: "Back.Out",
            delay: 0,
        });

        this.tweens.add({
            targets: this,
            progressIntroScale: 1,
            duration: 1000,
            ease: "Back.Out",
            delay: 100,
            onStart: () => {
                this.progressFrame.setAlpha(1);
                this.progressFill.setAlpha(1);
            },
            onUpdate: () => {
                this.layout(this.scale.width, this.scale.height);
            },
        });
    }

    private layout(width: number, height: number) {
        const centerX = width / 2;
        const centerY = height / 2;
        const frameWidth =
            Math.min(width * 0.62, 680) * this.progressIntroScale;
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

        const touchButtonSizeW = 250;
        const touchButtonSizeH = 270;
        const touchButtonGap = 32;
        const continueTextGap = 28;

        const touchBaseY =
            barY + frameHeight + touchButtonGap + touchButtonSizeW / 2;
        const currentTouchAlpha = this.touchButton.alpha;
        const isTouchAnimating = this.tweens.isTweening(this.touchButton);

        if (!isTouchAnimating || currentTouchAlpha <= 0) {
            this.touchButton.setPosition(centerX, touchBaseY);
        } else {
            const animatedOffsetY =
                this.touchButton.y -
                ((this.touchButton.getData("baseY") as number) ?? touchBaseY);
            this.touchButton.setPosition(centerX, touchBaseY + animatedOffsetY);
        }

        this.touchButton.setData("baseY", touchBaseY);
        this.touchButton.setDisplaySize(touchButtonSizeW, touchButtonSizeH);

        this.continueText.setPosition(
            centerX,
            touchBaseY + touchButtonSizeW / 2 + continueTextGap,
        );
    }
}
