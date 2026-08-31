import { GameObjects, Scene } from "phaser";

/** "Jendela Informasi" — shows the material spec text for a clicked hull component. */
export class InfoWindow {
    private scene: Scene;
    private container: GameObjects.Container;
    private bg: GameObjects.Graphics;
    private accentStripe: GameObjects.Graphics;
    private titleText: GameObjects.Text;
    private bodyText: GameObjects.Text;
    private closeButton: GameObjects.Text;

    private readonly width = 340;
    private readonly paddingX = 24;

    constructor(scene: Scene) {
        this.scene = scene;

        this.container = scene.add.container(0, 0).setDepth(40);
        this.bg = scene.add.graphics();
        this.accentStripe = scene.add.graphics();

        this.titleText = scene.add
            .text(-this.width / 2 + this.paddingX, 0, "", {
                fontFamily: "Arial Black",
                fontSize: 17,
                color: "#1d4b97",
            })
            .setOrigin(0, 0.5);

        this.bodyText = scene.add.text(
            -this.width / 2 + this.paddingX,
            0,
            "",
            {
                fontFamily: "Arial",
                fontSize: 14,
                color: "#28466d",
                wordWrap: { width: this.width - this.paddingX * 2 },
                lineSpacing: 6,
            },
        );

        this.closeButton = scene.add
            .text(this.width / 2 - 18, 0, "×", {
                fontFamily: "Arial Black",
                fontSize: 20,
                color: "#7d8da8",
            })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });
        this.closeButton.on("pointerdown", () => this.hide());

        this.container.add([
            this.bg,
            this.accentStripe,
            this.titleText,
            this.bodyText,
            this.closeButton,
        ]);
        this.container.setVisible(false);
        this.container.setAlpha(0);
    }

    get view() {
        return this.container;
    }

    show(title: string, body: string, accentColor: number) {
        this.titleText.setText(title);
        this.titleText.setColor(`#${accentColor.toString(16).padStart(6, "0")}`);
        this.bodyText.setText(body);
        this.redraw(accentColor);

        this.scene.tweens.killTweensOf(this.container);
        this.container.setVisible(true);
        this.scene.tweens.add({
            targets: this.container,
            alpha: 1,
            duration: 180,
            ease: "Quad.Out",
        });
    }

    hide() {
        this.scene.tweens.killTweensOf(this.container);
        this.scene.tweens.add({
            targets: this.container,
            alpha: 0,
            duration: 140,
            ease: "Quad.Out",
            onComplete: () => {
                this.container.setVisible(false);
            },
        });
    }

    layout(x: number, y: number, scale: number) {
        this.container.setPosition(x, y);
        this.container.setScale(scale);
    }

    private redraw(accentColor: number) {
        const topPadding = 22;
        const bottomPadding = 24;
        const titleHeight = 22;
        const titleToBodyGap = 12;

        const contentHeight = titleHeight + titleToBodyGap + this.bodyText.height;
        const height = Math.max(
            110,
            topPadding + contentHeight + bottomPadding,
        );
        const top = -height / 2;

        this.titleText.setPosition(
            -this.width / 2 + this.paddingX,
            top + topPadding + titleHeight / 2,
        );
        this.bodyText.setPosition(
            -this.width / 2 + this.paddingX,
            top + topPadding + titleHeight + titleToBodyGap,
        );
        this.closeButton.setPosition(this.width / 2 - 18, top + 18);

        const radius = 18;

        this.bg.clear();
        this.bg.fillStyle(0xffffff, 0.96);
        this.bg.fillRoundedRect(-this.width / 2, top, this.width, height, radius);
        this.bg.lineStyle(2, accentColor, 0.9);
        this.bg.strokeRoundedRect(-this.width / 2, top, this.width, height, radius);

        this.accentStripe.clear();
        this.accentStripe.fillStyle(accentColor, 1);
        this.accentStripe.fillRoundedRect(-this.width / 2, top, 6, height, {
            tl: radius,
            bl: radius,
            tr: 0,
            br: 0,
        });
    }
}
