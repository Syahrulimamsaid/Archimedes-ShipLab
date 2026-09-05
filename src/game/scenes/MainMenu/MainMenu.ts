import { GameObjects, Scale, Scene } from "phaser";
import { ButtonImage } from '../../../component/Button/ButtonImage';
import { EventBus } from '../../EventBus';
import { CharacterPanel } from './CharacterPanel';
import { MenuCard } from './MenuCard';
import { ModalExit } from './ModalExit';

export class MainMenu extends Scene {
    private background!: GameObjects.Image;
    private welcomeTitle!: GameObjects.Text;
    private welcomeSubtitle!: GameObjects.Text;

    private menuCards: MenuCard[] = [];
    private characterPanel!: CharacterPanel;
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
                onSelect: () => this.scene.start("AnatomiStruktur"),
            }),
            new MenuCard(this, {
                texture: "home.card.stabilitas",
                onSelect: () => this.scene.start("SimulatorStabilitas"),
            }),
            new MenuCard(this, {
                texture: "home.card.hasil",
                onSelect: () => this.scene.start("HasilUmpanBalik"),
            }),
        ];

        this.characterPanel = new CharacterPanel(this);

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
        > = [this.welcomeTitle, this.welcomeSubtitle];

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

        this.characterPanel.playIntroAnimation(3 * 80);

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
        // No top bar anymore — just a small top-right padding for the
        // floating exit button, and a flat top margin for the content below.
        const topEdgePaddingX = Math.max(16, width * 0.015);
        const topEdgePaddingY = Math.max(20, height * 0.03);
        const topButtonSize = Math.max(42, Math.min(52, height * 0.05));

        // Cards (and the character column) are sized to fit the vertical band
        // that's actually free — below the welcome text, above the bottom bar —
        // rather than a flat % of window height, so shrinking the welcome text
        // directly reclaims room for the content below it.
        const contentTop = topEdgePaddingY + topButtonSize + Math.max(16, height * 0.02);
        const welcomeTitleY = contentTop + 60;
        const welcomeSubtitleY = contentTop + 90;
        const bottomBarHeight = Math.max(45, height * 0.2);
        const bottomBarTopY = height - 60 - bottomBarHeight / 2;

        const bandTop = welcomeSubtitleY + 60;
        const bandBottom = bottomBarTopY - 28;
        const availableBandHeight = Math.max(220, bandBottom - bandTop);

        const cardsZoneLeft = Math.max(headerPaddingX, width * 0.03);
        const cardsZoneRight = width * 0.78;
        const cardsZoneWidth = cardsZoneRight - cardsZoneLeft;
        const cardGap = Math.max(24, width * 0.016);
        const cardAspect = 1536 / 1024; // real card artwork aspect ratio (h / w)
        const cardCount = this.menuCards.length;

        let cardWidth = (cardsZoneWidth - cardGap * (cardCount - 1)) / cardCount;
        let cardHeight = cardWidth * cardAspect;

        if (cardHeight > availableBandHeight) {
            cardHeight = availableBandHeight;
            cardWidth = cardHeight / cardAspect;
        }

        const cardScale = cardWidth / 420;
        const cardsBlockWidth = cardWidth * cardCount + cardGap * (cardCount - 1);
        const cardsBlockLeft =
            cardsZoneLeft + (cardsZoneWidth - cardsBlockWidth) / 2;
        const cardsBlockCenterX = cardsBlockLeft + cardsBlockWidth / 2;
        // Cards sit right below the welcome text (top-aligned) rather than
        // centered in the whole band, so leftover vertical space collects
        // below them instead of splitting evenly above/below.
        const cardY = bandTop + cardHeight / 2;

        const rightColumnMargin = 15;
        const rightColumnLeft = cardsZoneRight + Math.max(16, width * 0.015);
        const rightColumnWidth = width - rightColumnLeft - rightColumnMargin;
        const rightColumnCenterX = rightColumnLeft + rightColumnWidth / 2;

        // Exit button floats at the top-right corner directly on the
        // background now that there's no bar behind it.
        let currentRightX = width - topEdgePaddingX;

        this.topButtons
            .slice()
            .reverse()
            .forEach((button) => {
                const buttonWidth = topButtonSize;
                const buttonHeight = topButtonSize;
                const buttonCenterX = currentRightX - buttonWidth / 2;
                const buttonCenterY = topEdgePaddingY + buttonHeight / 2;

                button.setPosition(buttonCenterX, buttonCenterY);
                button.setSize(buttonWidth, buttonHeight);

                currentRightX -= buttonWidth;
            });

        this.welcomeTitle.setPosition(cardsBlockCenterX, welcomeTitleY);
        this.welcomeTitle.setFontSize(Math.max(26, 36 * cardScale));

        this.welcomeSubtitle.setPosition(cardsBlockCenterX, welcomeSubtitleY);
        this.welcomeSubtitle.setFontSize(Math.max(15, 19 * cardScale));
        this.welcomeSubtitle.setWordWrapWidth(cardsBlockWidth * 0.94);

        this.menuCards.forEach((card, index) => {
            const cardX = cardsBlockLeft + cardWidth / 2 + index * (cardWidth + cardGap);
            card.layout(cardX, cardY, cardWidth, cardHeight);
        });

        // The logo sits on the same row as the welcome title; the character's
        // height is tied directly to the cards' height so it lines up with
        // them top-to-bottom instead of floating at its own scale.
        this.characterPanel.layoutLogo(rightColumnCenterX, welcomeTitleY, rightColumnWidth - rightColumnMargin);
        this.characterPanel.layoutCharacter(
            rightColumnCenterX,
            cardY - cardHeight / 2,
            cardHeight,
            rightColumnWidth - rightColumnMargin,
        );

        this.bottomInfoBar.setPosition(width * 0.47, height - 60);
        this.bottomInfoBar.setDisplaySize(
            Math.min(width * 0.35, 640),
            Math.max(40, height * 0.18),
        );

        const bottomButtonScale = Math.max(0.82, cardScale * 0.92);
        const bottomButtonWidth = 350 * bottomButtonScale;
        const bottomButtonHeight = 120 * bottomButtonScale;

        this.bottomButtons[0].setPosition(180, height - 60);
        this.bottomButtons[0].setSize(bottomButtonWidth, bottomButtonHeight);
        this.bottomButtons[1].setPosition(width - 180, height - 60);
        this.bottomButtons[1].setSize(bottomButtonWidth, bottomButtonHeight);

        this.exitModal.layout(centerX, centerY, width, height);
    }
}
