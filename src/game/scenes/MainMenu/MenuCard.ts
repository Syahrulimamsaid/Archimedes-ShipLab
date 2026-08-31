import { GameObjects, Scene } from "phaser";

export type InfoPanelSide = "left" | "right";

export interface MenuCardConfig {
    texture: string;
    accentColor: number;
    infoTitle: string;
    infoDescription: string;
    infoRequirement: string;
    infoMeta: string;
    // Which side the hover detail panel opens on — first card opens left
    // (away from its neighbor), second card opens right.
    infoPanelSide: InfoPanelSide;
    onSelect: () => void;
}

export class MenuCard {
    private scene: Scene;
    private card: GameObjects.Image;
    private infoPanel: GameObjects.Container;
    private infoPanelSide: InfoPanelSide;

    constructor(scene: Scene, config: MenuCardConfig) {
        this.scene = scene;
        this.infoPanelSide = config.infoPanelSide;

        this.card = scene.add
            .image(0, 0, config.texture)
            .setDepth(10)
            .setInteractive({ useHandCursor: true });

        this.infoPanel = this.createInfoPanel(
            config.infoTitle,
            config.infoDescription,
            config.infoRequirement,
            config.infoMeta,
            config.accentColor,
        );
        this.infoPanel.setDepth(30);
        this.infoPanel.setVisible(false);
        this.infoPanel.setAlpha(0);

        this.card.on("pointerdown", () => config.onSelect());
        this.card.on("pointerover", () => {
            this.showInfoPanel();
            this.showPopup();
        });
        this.card.on("pointerout", () => {
            this.hideInfoPanel();
            this.hidePopup();
        });
    }

    get view() {
        return this.card;
    }

    layout(
        x: number,
        y: number,
        width: number,
        height: number,
        infoPanelScale: number,
        infoPanelPadding: number,
    ) {
        this.card.setPosition(x, y);
        this.card.setDisplaySize(width, height);
        this.card.setData("baseY", y);
        this.card.setData("baseWidth", width);
        this.card.setData("baseHeight", height);

        const infoPanelHalfWidth = 150 * infoPanelScale;
        const infoPanelX =
            this.infoPanelSide === "left"
                ? x - width / 2 - infoPanelPadding - infoPanelHalfWidth
                : x + width / 2 + infoPanelPadding + infoPanelHalfWidth;

        this.infoPanel.setPosition(infoPanelX, y);
        this.infoPanel.setScale(infoPanelScale);
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

    private showInfoPanel() {
        this.scene.tweens.killTweensOf(this.infoPanel);
        this.infoPanel.setVisible(true);

        this.scene.tweens.add({
            targets: this.infoPanel,
            alpha: 1,
            duration: 160,
            ease: "Quad.Out",
        });
    }

    private hideInfoPanel() {
        this.scene.tweens.killTweensOf(this.infoPanel);

        this.scene.tweens.add({
            targets: this.infoPanel,
            alpha: 0,
            duration: 140,
            ease: "Quad.Out",
            onComplete: () => {
                this.infoPanel.setVisible(false);
            },
        });
    }

    private createInfoPanel(
        title: string,
        desc: string,
        requirement: string,
        meta: string,
        accentColor: number,
    ) {
        const panelWidth = 300;
        const panelHeight = 288;
        const radius = 20;
        const paddingX = 22;
        const accentHex = `#${accentColor.toString(16).padStart(6, "0")}`;
        const halfW = panelWidth / 2;
        const halfH = panelHeight / 2;

        const panel = this.scene.add.container(0, 0);

        const shadow = this.scene.add.graphics();
        shadow.fillStyle(0x061530, 0.28);
        shadow.fillRoundedRect(-halfW + 4, -halfH + 8, panelWidth, panelHeight, radius);

        const bg = this.scene.add.graphics();
        bg.fillStyle(0xffffff, 0.93);
        bg.fillRoundedRect(-halfW, -halfH, panelWidth, panelHeight, radius);
        bg.lineStyle(2, accentColor, 0.9);
        bg.strokeRoundedRect(-halfW, -halfH, panelWidth, panelHeight, radius);

        const accentStripe = this.scene.add.graphics();
        accentStripe.fillStyle(accentColor, 1);
        accentStripe.fillRoundedRect(-halfW, -halfH, 7, panelHeight, {
            tl: radius,
            bl: radius,
            tr: 0,
            br: 0,
        });

        const titleText = this.scene.add
            .text(-halfW + paddingX, -halfH + 30, title, {
                fontFamily: "Arial Black",
                fontSize: 18,
                color: accentHex,
            })
            .setOrigin(0, 0.5);

        const divider = this.scene.add.graphics();
        divider.lineStyle(1, 0xffffff, 0.16);
        divider.lineBetween(
            -halfW + paddingX,
            -halfH + 50,
            halfW - paddingX,
            -halfH + 50,
        );

        const descText = this.scene.add.text(-halfW + paddingX, -halfH + 66, desc, {
            fontFamily: "Arial",
            fontSize: 13,
            color: "#1b1d1f",
            wordWrap: { width: panelWidth - paddingX * 2 },
            lineSpacing: 6,
        });

        const reqText = this.scene.add.text(
            -halfW + paddingX,
            -halfH + 66 + descText.height + 18,
            requirement,
            {
                fontFamily: "Arial",
                fontSize: 13,
                color: "#2a67bd",
                wordWrap: { width: panelWidth - paddingX * 2 },
                lineSpacing: 6,
            },
        );

        const metaBg = this.scene.add.graphics();
        metaBg.fillStyle(accentColor, 1);
        metaBg.fillRoundedRect(
            -halfW + paddingX,
            halfH - 56,
            panelWidth - paddingX * 2,
            36,
            10,
        );

        const metaText = this.scene.add
            .text(0, halfH - 38, meta.replace("\n", " • "), {
                fontFamily: "Arial Black",
                fontSize: 12,
                color: "#ffffff",
                align: "center",
            })
            .setOrigin(0.5);

        panel.add([
            shadow,
            bg,
            accentStripe,
            titleText,
            divider,
            descText,
            reqText,
            metaBg,
            metaText,
        ]);

        return panel;
    }
}
