import { GameObjects, Scale, Scene } from "phaser";
import { BgmToggleButton } from "../../../component/Button/BgmToggleButton";
import { ButtonImage } from "../../../component/Button/ButtonImage";
import { ExitButton } from "../../../component/Button/ExitButton";
import { initBgm, isBgmEnabled, toggleBgm } from "../../BgmManager";
import { EventBus } from "../../EventBus";
import { SFX_KEYS, playSfx } from "../../SfxManager";
import { isModuleUnlocked, ModuleId } from "../../ModuleProgress";
import { CharacterPanel } from "./CharacterPanel";
import { MenuCard } from "./MenuCard";
import { ModalExit } from "./ModalExit";

const MENU_MODULES: ModuleId[] = [
    "anatomi-struktur",
    "simulator-stabilitas",
    "hasil-umpan-balik",
];

export class MainMenu extends Scene {
    private background!: GameObjects.Image;
    private logo!: GameObjects.Image;
    private welcomeCard!: GameObjects.Graphics;
    private welcomeTitle!: GameObjects.Text;
    private welcomeSubtitle!: GameObjects.Text;

    private menuCards: MenuCard[] = [];
    private characterPanel!: CharacterPanel;
    private bottomInfoBar!: GameObjects.Image;
    private exitModal!: ModalExit;
    private exitButton!: ExitButton;
    private bgmToggleButton!: BgmToggleButton;

    private bottomButtons: ButtonImage[] = [];
    private hasPlayedIntro = false;

    // The logo's layout position (updated on every resize) plus a small
    // side-to-side sway offset animated continuously on top of it.
    private logoBaseX = 0;
    private logoBaseY = 0;
    private logoSwayOffset = 0;

    constructor() {
        super("MainMenu");
    }

    create() {
        this.background = this.add.image(0, 0, "background.home");

        this.logo = this.add.image(0, 0, "logo");

        this.welcomeCard = this.add.graphics();

        this.welcomeTitle = this.add
            .text(0, 0, "Selamat Datang, Taruna!", {
                fontFamily: "Arial Black",
                fontSize: 34,
                color: "#143a84",
            })
            .setOrigin(0, 0.5);

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
            .setOrigin(0, 0.5);

        this.menuCards = [
            new MenuCard(this, {
                texture: "home.card.anatomi",
                locked: !isModuleUnlocked("anatomi-struktur"),
                onSelect: () => {
                    playSfx(this, SFX_KEYS.click);
                    this.scene.start("AnatomiStruktur");
                },
            }),
            new MenuCard(this, {
                texture: "home.card.stabilitas",
                locked: !isModuleUnlocked("simulator-stabilitas"),
                onSelect: () => {
                    playSfx(this, SFX_KEYS.click);
                    this.scene.start("SimulatorStabilitas");
                },
            }),
            new MenuCard(this, {
                texture: "home.card.hasil",
                locked: !isModuleUnlocked("hasil-umpan-balik"),
                onSelect: () => {
                    playSfx(this, SFX_KEYS.click);
                    this.scene.start("HasilUmpanBalik");
                },
            }),
        ];

        this.characterPanel = new CharacterPanel(this);

        this.bottomInfoBar = this.add.image(0, 0, "home.bar.info");

        this.exitButton = new ExitButton(this, {
            size: 40,
            onClick: () => {
                playSfx(this, SFX_KEYS.click);
                this.exitModal.open();
            },
        });

        this.bgmToggleButton = new BgmToggleButton(this, {
            height: 44,
            initialEnabled: isBgmEnabled(),
            onToggle: () => {
                playSfx(this, SFX_KEYS.click);
                return toggleBgm();
            },
        });
        initBgm(this);

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

        this.bottomButtons[0].on("pointerdown", () => {
            playSfx(this, SFX_KEYS.click);
            playSfx(this, SFX_KEYS.indianSong);
        });
        this.bottomButtons[1].on("pointerdown", () =>
            playSfx(this, SFX_KEYS.click),
        );

        this.exitModal = new ModalExit(this, () =>
            this.scene.start("Preloader"),
        );

        this.refreshModuleLocks();
        this.layout(this.scale.width, this.scale.height);
        this.scale.on(Scale.Events.RESIZE, this.handleResize, this);

        this.startLogoSwayAnimation();
        this.playIntroAnimation();

        EventBus.emit("current-scene-ready", this);

        this.events.on("wake", () => this.refreshModuleLocks());

        this.events.once("shutdown", () => {
            this.scale.off(Scale.Events.RESIZE, this.handleResize, this);
        });
    }

    private handleResize(gameSize: Phaser.Structs.Size) {
        this.layout(gameSize.width, gameSize.height);
    }

    private updateLogoPosition() {
        this.logo.setPosition(this.logoBaseX + this.logoSwayOffset, this.logoBaseY);
    }

    private startLogoSwayAnimation() {
        const swayAmplitude = 16;

        this.tweens.add({
            targets: this,
            logoSwayOffset: { from: -swayAmplitude, to: swayAmplitude },
            duration: 2400,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut",
            onUpdate: () => this.updateLogoPosition(),
        });
    }

    private refreshModuleLocks() {
        this.menuCards.forEach((card, index) => {
            card.setLocked(!isModuleUnlocked(MENU_MODULES[index]));
        });
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
        > = [this.welcomeCard, this.welcomeTitle, this.welcomeSubtitle];

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
        // Shared height for the exit button and the BGM switch, so they're
        // proportioned to match each other exactly.
        const headerButtonHeight = Math.max(52, Math.min(68, height * 0.04));

        const cardsZoneLeft = Math.max(headerPaddingX, width * 0.01);
        // Reference zone used only to size the "normal" card grid before the
        // 1.2x enlargement below — the actual right edge is derived from the
        // final (bigger) card block further down, so it never overlaps the
        // character column.
        const cardsZoneWidthRef = width * 0.64 - cardsZoneLeft;

        // Left column stacks top-to-bottom: logo, then the welcome card
        // directly beneath it (same left edge), then the menu grid — matching
        // the sketch layout instead of floating the welcome text beside the logo.
        const logoMaxWidth = Math.min(width * 0.5, 660);
        const logoScale = logoMaxWidth / this.logo.width;
        const logoHeight = this.logo.height * logoScale;
        const logoTop = topEdgePaddingY;

        const welcomeCardGap = Math.max(10, height * 0.015);
        const welcomeCardTop = logoTop + logoHeight + welcomeCardGap;
        // Just an estimate for reserving vertical space — the welcome card is
        // actually sized to hug its text further down, once font sizes are known.
        // Kept slightly generous (rather than pixel-exact) since the margin
        // below it also has to absorb the menu cards' hover pop-out.
        const welcomeCardEstimatedHeight = Math.max(80, height * 0.09);

        // Cards (and the character column) are sized to fit the vertical band
        // that's actually free — below the welcome card, above the bottom bar —
        // rather than a flat % of window height, so shrinking the welcome card
        // directly reclaims room for the content below it.
        const bottomBarHeight = Math.max(45, height * 0.2);
        const bottomBarTopY = height - 60 - bottomBarHeight / 2;

        // Extra breathing room so a card's hover pop-out (scales up and lifts
        // slightly) doesn't collide with the welcome card above it.
        const welcomeCardToGridGap = Math.max(34, height * 0.045);
        const bandTop =
            welcomeCardTop + welcomeCardEstimatedHeight + welcomeCardToGridGap;
        const bandBottom = bottomBarTopY - 28;
        const availableBandHeight = Math.max(220, bandBottom - bandTop);

        const cardGapX = Math.max(22, width * 0.014);
        const cardGapY = Math.max(18, height * 0.02);
        const cardAspect = 9 / 20;
        const gridColumns = 2;
        const gridRows = Math.ceil(this.menuCards.length / gridColumns);

        const targetCardWidth = Math.min(
            460,
            (cardsZoneWidthRef - cardGapX * (gridColumns - 1)) / gridColumns,
        );
        let cardWidth = targetCardWidth;
        let cardHeight = cardWidth * cardAspect;

        const maxGridHeight =
            (availableBandHeight - cardGapY * (gridRows - 1)) / gridRows;
        if (cardHeight > maxGridHeight) {
            cardHeight = maxGridHeight;
            cardWidth = cardHeight / cardAspect;
        }

        // Menu cards enlarged ~1.2x, then re-clamped so the bigger cards still
        // fit the vertical band above the bottom bar.
        const cardSizeBoost = 1.2;
        cardWidth *= cardSizeBoost;
        cardHeight *= cardSizeBoost;
        if (cardHeight > maxGridHeight) {
            cardHeight = maxGridHeight;
            cardWidth = cardHeight / cardAspect;
        }

        const cardScale = cardWidth / 460;
        const cardsBlockWidth =
            cardWidth * gridColumns + cardGapX * (gridColumns - 1);
        const cardsBlockHeight =
            cardHeight * gridRows + cardGapY * (gridRows - 1);
        const cardsBlockLeft =
            cardsZoneLeft +
            Math.max(0, (cardsZoneWidthRef - cardsBlockWidth) / 2);
        const cardsBlockCenterX = cardsBlockLeft + cardsBlockWidth / 2;
        const cardsBlockTop = bandTop;

        const rightColumnMargin = 15;
        const rightColumnLeft =
            Math.max(width * 0.64, cardsBlockLeft + cardsBlockWidth) +
            Math.max(16, width * 0.015);
        const rightColumnWidth = width - rightColumnLeft - rightColumnMargin;
        const rightColumnCenterX = rightColumnLeft + rightColumnWidth / 2;

        // Exit button and BGM switch float at the top-right corner directly
        // on the background now that there's no bar behind them, sized to
        // match each other via headerButtonHeight.
        const headerButtonCenterY = topEdgePaddingY + headerButtonHeight / 2;
        let currentRightX = width - topEdgePaddingX;

        this.exitButton.setSize(headerButtonHeight);
        this.exitButton.setPosition(
            currentRightX - headerButtonHeight / 2,
            headerButtonCenterY,
        );
        currentRightX -= headerButtonHeight;

        const bgmButtonGap = Math.max(10, width * 0.008);
        this.bgmToggleButton.setSize(headerButtonHeight);
        currentRightX -= bgmButtonGap;
        this.bgmToggleButton.setPosition(
            currentRightX - this.bgmToggleButton.width / 2,
            headerButtonCenterY,
        );

        // Centered over the menu grid's width, like the welcome card below it.
        this.logoBaseX = cardsBlockCenterX;
        this.logoBaseY = logoTop + logoHeight / 2;
        this.updateLogoPosition();
        this.logo.setDisplaySize(logoMaxWidth, logoHeight);

        // Size fonts first so the card can shrink-wrap to the actual text
        // extent instead of a fixed width/height.
        this.welcomeTitle.setFontSize(Math.max(20, 26 * cardScale));
        this.welcomeSubtitle.setFontSize(Math.max(13, 15 * cardScale));
        this.welcomeSubtitle.setWordWrapWidth(0);

        const welcomeCardPaddingX = Math.max(20, 22 * cardScale);
        const welcomeCardPaddingY = Math.max(14, 16 * cardScale);
        const welcomeTextGap = Math.max(6, 8 * cardScale);
        const welcomeCardRadius = 18;

        const welcomeContentWidth = Math.max(
            this.welcomeTitle.width,
            this.welcomeSubtitle.width,
        );
        // Just wide enough for the text, but never wider than the menu grid
        // it's centered over.
        const welcomeCardWidth = Math.min(
            welcomeContentWidth + welcomeCardPaddingX * 2,
            cardsBlockWidth,
        );
        const welcomeCardHeight =
            welcomeCardPaddingY * 2 +
            this.welcomeTitle.height +
            welcomeTextGap +
            this.welcomeSubtitle.height;
        const welcomeCardX = cardsBlockCenterX - welcomeCardWidth / 2;

        this.welcomeCard.clear();
        this.welcomeCard.fillStyle(0xffffff, 0.92);
        this.welcomeCard.fillRoundedRect(
            welcomeCardX,
            welcomeCardTop,
            welcomeCardWidth,
            welcomeCardHeight,
            welcomeCardRadius,
        );
        this.welcomeCard.lineStyle(2, 0x2f68d8, 0.9);
        this.welcomeCard.strokeRoundedRect(
            welcomeCardX,
            welcomeCardTop,
            welcomeCardWidth,
            welcomeCardHeight,
            welcomeCardRadius,
        );

        const welcomeTextX = welcomeCardX + welcomeCardPaddingX;

        this.welcomeTitle.setPosition(
            welcomeTextX,
            welcomeCardTop + welcomeCardPaddingY + this.welcomeTitle.height / 2,
        );

        this.welcomeSubtitle.setPosition(
            welcomeTextX,
            welcomeCardTop +
                welcomeCardPaddingY +
                this.welcomeTitle.height +
                welcomeTextGap +
                this.welcomeSubtitle.height / 2,
        );

        this.menuCards.forEach((card, index) => {
            const column = index % gridColumns;
            const row = Math.floor(index / gridColumns);
            const cardX =
                cardsBlockLeft +
                cardWidth / 2 +
                column * (cardWidth + cardGapX);
            const cardY =
                cardsBlockTop + cardHeight / 2 + row * (cardHeight + cardGapY);
            card.layout(cardX, cardY, cardWidth, cardHeight);
        });

        this.characterPanel.layout(
            rightColumnCenterX - 150,
            logoTop + 130,
            cardsBlockTop + cardsBlockHeight - logoTop - 160,
            rightColumnWidth - rightColumnMargin - 160,
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
