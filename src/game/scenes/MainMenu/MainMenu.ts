import { GameObjects, Scale, Scene } from "phaser";
import { ButtonImage } from '../../../component/Button/ButtonImage';
import { EventBus } from '../../EventBus';
import { MenuCard } from './MenuCard';
import { ModalExit } from './ModalExit';
import { ProfileCard } from './ProfileCard';

export class MainMenu extends Scene {
    private background!: GameObjects.Image;
    private topBar!: GameObjects.Graphics;
    private logo!: GameObjects.Image;
    private welcomeTitle!: GameObjects.Text;
    private welcomeSubtitle!: GameObjects.Text;

    private menuCards: MenuCard[] = [];
    private profileCard!: ProfileCard;
    private bottomInfoBar!: GameObjects.Image;
    private exitModal!: ModalExit;

    private topButtons: ButtonImage[] = [];
    private bottomButtons: ButtonImage[] = [];
    private hasPlayedIntro = false;

    constructor() {
        super("MainMenu");
    }

    create() {
        this.background = this.add.image(0, 0, "background.home");
        this.topBar = this.add.graphics();
        this.logo = this.add.image(0, 0, "logo").setOrigin(0, 0.5).setDepth(20);

        this.welcomeTitle = this.add
            .text(0, 0, "Selamat Datang, Taruna!", {
                fontFamily: "Arial Black",
                fontSize: 34,
                color: "#143a84",
            })
            .setOrigin(0.5);

        this.welcomeSubtitle = this.add
            .text(
                0,
                0,
                "Pilih modul untuk memulai pembelajaran interaktifmu.",
                {
                    fontFamily: "Arial",
                    fontSize: 18,
                    color: "#244f89",
                },
            )
            .setOrigin(0.5);

        this.menuCards = [
            new MenuCard(this, {
                texture: "home.card.anatomi",
                accentColor: 0x2f68d8,
                infoTitle: "DESKRIPSI MODUL",
                infoDescription:
                    "Kompetensi Dasar:\nMemahami bagian utama kapal niaga, dimensi pokok, bentuk profil, dasar bangun kapal, kulit kapal, sekat, dan pintu kedap air.",
                infoRequirement: "Prasyarat:\nTidak ada",
                infoMeta: "Waktu: ± 45 menit\nLevel: Dasar",
                infoPanelSide: "left",
                onSelect: () => this.scene.start("AnatomiStruktur"),
            }),
            new MenuCard(this, {
                texture: "home.card.stabilitas",
                accentColor: 0x4aa96c,
                infoTitle: "DESKRIPSI MODUL",
                infoDescription:
                    "Kompetensi Dasar:\nMenghitung dan menganalisis stabilitas kapal meliputi efek pemuatan, pergeseran beban, titik GM, dan momen penegak.",
                infoRequirement: "Prasyarat:\nTidak ada",
                infoMeta: "Waktu: ± 60 menit\nLevel: Menengah",
                infoPanelSide: "right",
                onSelect: () => this.scene.start("SimulatorStabilitas"),
            }),
        ];

        this.profileCard = new ProfileCard(this);

        this.bottomInfoBar = this.add.image(0, 0, "home.bar.info");

        const exitButton = new ButtonImage(this, {
            texture: "home.btn.exit",
            width: 52,
            height: 52,
            hoverAnimation: "popup",
            hoverScale: 1.04,
            hoverOffsetY: 6,
        });

        exitButton.on("pointerdown", () => this.exitModal.open());

        this.topButtons = [exitButton];

        this.bottomButtons = [
            new ButtonImage(this, {
                texture: "home.btn.panduan",
                width: 350,
                height: 120,
                hoverAnimation: "popup",
                hoverScale: 1.03,
                hoverOffsetY: 4,
            }),
            new ButtonImage(this, {
                texture: "home.btn.tentang",
                width: 350,
                height: 120,
                hoverAnimation: "popup",
                hoverScale: 1.03,
                hoverOffsetY: 4,
            }),
        ];

        this.exitModal = new ModalExit(this, () =>
            this.scene.start("Preloader"),
        );

        this.layout(this.scale.width, this.scale.height);
        this.scale.on(Scale.Events.RESIZE, this.handleResize, this);

        this.playIntroAnimation();

        EventBus.emit("current-scene-ready", this);

        this.events.once("shutdown", () => {
            this.scale.off(Scale.Events.RESIZE, this.handleResize, this);
        });
    }

    moveLogo(callback: ({ x, y }: { x: number; y: number }) => void) {
        if (callback) {
            callback({
                x: Math.floor(this.logo.x),
                y: Math.floor(this.logo.y),
            });
        }
    }

    private handleResize(gameSize: Phaser.Structs.Size) {
        this.layout(gameSize.width, gameSize.height);
    }

    private playIntroAnimation() {
        if (this.hasPlayedIntro) {
            return;
        }

        this.hasPlayedIntro = true;

        const animatedItems: Array<
            GameObjects.GameObject & {
                alpha: number;
                y: number;
                scaleX: number;
                scaleY: number;
            }
        > = [this.logo, this.welcomeTitle, this.welcomeSubtitle];

        animatedItems.forEach((item, index) => {
            item.alpha = 0;
            item.y += 18;
            item.scaleX *= 0.96;
            item.scaleY *= 0.96;

            this.tweens.add({
                targets: item,
                alpha: 1,
                y: item.y - 18,
                scaleX: item.scaleX / 0.96,
                scaleY: item.scaleY / 0.96,
                duration: 500,
                delay: index * 80,
                ease: "Back.Out",
            });
        });

        this.profileCard.playIntroAnimation(3 * 80);

        this.menuCards.forEach((card, index) => {
            card.playIntroAnimation((index + 3) * 80);
        });
    }

    private layout(width: number, height: number) {
        const centerX = width / 2;
        const centerY = height / 2;

        this.background.setPosition(centerX, centerY);
        this.background.setDisplaySize(width, height);

        const headerPaddingX = Math.max(12, width * 0.012);
        const headerPaddingTop = Math.max(10, height * 0.012);
        const headerInnerPaddingX = Math.max(20, width * 0.014);
        const headerHeight = Math.max(58, height * 0.088);
        const headerRadius = Math.min(60, headerHeight * 0.6);
        const headerWidth = width - headerPaddingX * 2;

        this.topBar.clear();
        this.topBar.fillStyle(0x0d4fa3, 0.88);
        this.topBar.lineStyle(2, 0xffffff, 0.22);
        this.topBar.fillRoundedRect(
            headerPaddingX,
            headerPaddingTop,
            headerWidth,
            headerHeight,
            headerRadius,
        );
        this.topBar.strokeRoundedRect(
            headerPaddingX,
            headerPaddingTop,
            headerWidth,
            headerHeight,
            headerRadius,
        );

        // Cards (and the profile column) are sized to fit the vertical band that's
        // actually free — below the header/welcome text, above the bottom bar —
        // rather than a flat % of window height, so shrinking the header/welcome
        // text directly reclaims room for the content below it.
        const contentTop =
            headerPaddingTop + headerHeight + Math.max(16, height * 0.02);
        const welcomeTitleY = contentTop + 24;
        const welcomeSubtitleY = contentTop + 52;
        const bottomBarHeight = Math.max(45, height * 0.2);
        const bottomBarTopY = height - 60 - bottomBarHeight / 2;

        const bandTop = welcomeSubtitleY + 22;
        const bandBottom = bottomBarTopY - 28;
        const availableBandHeight = Math.max(220, bandBottom - bandTop);

        const cardsZoneLeft = Math.max(headerPaddingX, width * 0.03);
        const cardsZoneRight = width * 0.78;
        const cardsZoneWidth = cardsZoneRight - cardsZoneLeft;
        const cardGap = Math.max(24, width * 0.016);
        const cardAspect = 1536 / 1024; // real card artwork aspect ratio (h / w)

        let cardWidth = (cardsZoneWidth - cardGap) / 2;
        let cardHeight = cardWidth * cardAspect;

        if (cardHeight > availableBandHeight) {
            cardHeight = availableBandHeight;
            cardWidth = cardHeight / cardAspect;
        }

        const cardScale = cardWidth / 420;
        const cardsBlockWidth = cardWidth * 2 + cardGap;
        const cardsBlockLeft =
            cardsZoneLeft + (cardsZoneWidth - cardsBlockWidth) / 2;
        const cardsBlockCenterX = cardsBlockLeft + cardsBlockWidth / 2;
        const cardY = bandTop + availableBandHeight / 2;
        const anatomiX = cardsBlockLeft + cardWidth / 2;
        const stabilitasX = anatomiX + cardWidth + cardGap;

        const rightColumnMargin = 15;
        const rightColumnLeft = cardsZoneRight + Math.max(16, width * 0.015);
        const rightColumnWidth = width - rightColumnLeft - rightColumnMargin;
        const rightColumnCenterX = rightColumnLeft + rightColumnWidth / 2;
        const rightScale = Math.min(
            width / 1500,
            height / 960,
            1.15,
            (rightColumnWidth - rightColumnMargin) / this.profileCard.width,
            availableBandHeight / this.profileCard.totalHeight,
        );

        this.logo.setPosition(
            headerPaddingX + headerInnerPaddingX,
            headerPaddingTop + headerHeight / 2 + 4,
        );
        this.logo.setDisplaySize(180 * cardScale, 65 * cardScale);

        const topButtonSize = Math.max(42, Math.min(52, headerHeight * 0.62));
        let currentRightX = width - headerPaddingX - headerInnerPaddingX;

        this.topButtons
            .slice()
            .reverse()
            .forEach((button) => {
                const buttonWidth = topButtonSize;
                const buttonHeight = topButtonSize;
                const buttonCenterX = currentRightX - buttonWidth / 2;
                const buttonCenterY = headerPaddingTop + headerHeight / 2 + 2;

                button.setPosition(buttonCenterX, buttonCenterY);
                button.setSize(buttonWidth, buttonHeight);

                currentRightX -= buttonWidth;
            });

        this.welcomeTitle.setPosition(cardsBlockCenterX, welcomeTitleY);
        this.welcomeTitle.setFontSize(Math.max(26, 36 * cardScale));

        this.welcomeSubtitle.setPosition(cardsBlockCenterX, welcomeSubtitleY);
        this.welcomeSubtitle.setFontSize(Math.max(15, 19 * cardScale));
        this.welcomeSubtitle.setWordWrapWidth(cardsBlockWidth * 0.94);

        // Hover panels open outward, away from the neighboring card, offset by a
        // small padding, instead of overlaying the artwork: the first card's panel
        // opens to its left, the second card's panel opens to its right.
        const infoPanelScale = Math.max(0.78, cardScale * 0.85);
        const infoPanelPadding = 5;

        this.menuCards[0].layout(
            anatomiX,
            cardY,
            cardWidth,
            cardHeight,
            infoPanelScale,
            infoPanelPadding,
        );
        this.menuCards[1].layout(
            stabilitasX,
            cardY,
            cardWidth,
            cardHeight,
            infoPanelScale,
            infoPanelPadding,
        );

        this.profileCard.layout(rightColumnCenterX, bandTop, rightScale);

        this.bottomInfoBar.setPosition(width * 0.47, height - 60);
        this.bottomInfoBar.setDisplaySize(
            Math.min(width * 0.35, 640),
            Math.max(45, height * 0.2),
        );

        const bottomButtonScale = Math.max(0.82, cardScale * 0.92);
        const bottomButtonWidth = 350 * bottomButtonScale;
        const bottomButtonHeight = 120 * bottomButtonScale;

        this.bottomButtons[0].setPosition(150, height - 60);
        this.bottomButtons[0].setSize(bottomButtonWidth, bottomButtonHeight);
        this.bottomButtons[1].setPosition(width - 150, height - 60);
        this.bottomButtons[1].setSize(bottomButtonWidth, bottomButtonHeight);

        this.exitModal.layout(centerX, centerY, width, height);
    }
}
