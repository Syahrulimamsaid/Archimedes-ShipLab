import { GameObjects, Scale, Scene } from "phaser";

import { playSceneEnter, playSceneExit } from "../../../component/SceneTransition";
import { ModuleHeader } from "../../../component/ModuleHeader/ModuleHeader";
import { EventBus } from "../../EventBus";
import { createAwardCard } from "./AwardCard";
import { createChecklistCard } from "./ChecklistCard";
import { createHeroFeedbackCard } from "./HeroFeedbackCard";
import { ReflectionCard } from "./ReflectionCard";
import { createScoreCard } from "./ScoreCard";
import { createTipsAndRepeatRow } from "./TipsAndRepeatRow";

// Authored at a fixed reference resolution and uniformly scaled to fit the
// window, same approach as the other module scenes.
const DESIGN_WIDTH = 1536;
const DESIGN_HEIGHT = 1060;
const MARGIN = 40;
const LEFT_COLUMN_WIDTH = 560;
const RIGHT_COLUMN_X = MARGIN + LEFT_COLUMN_WIDTH + 30;
const RIGHT_COLUMN_WIDTH = DESIGN_WIDTH - RIGHT_COLUMN_X - MARGIN;
const CONTENT_TOP = 310;
const ROW_HEIGHT = 290;
const ROW_GAP = 20;
const TIPS_ROW_HEIGHT = 90;

export class HasilUmpanBalik extends Scene {
    private background!: GameObjects.Image;
    private root!: GameObjects.Container;
    private reflectionCard!: ReflectionCard;

    constructor() {
        super("HasilUmpanBalik");
    }

    create() {
        this.background = this.add.image(0, 0, "AnatomiStructure.background");
        this.root = this.add.container(0, 0);

        this.buildHeader();
        this.buildContent();

        this.layout(this.scale.width, this.scale.height);
        this.scale.on(Scale.Events.RESIZE, this.handleResize, this);
        playSceneEnter(this, this.root);

        EventBus.emit("current-scene-ready", this);

        this.events.once("shutdown", () => {
            this.scale.off(Scale.Events.RESIZE, this.handleResize, this);
            this.reflectionCard.destroy();
        });
    }

    private handleResize(gameSize: Phaser.Structs.Size) {
        this.layout(gameSize.width, gameSize.height);
    }

    private goTo(sceneKey: string) {
        playSceneExit(this, this.root, () => this.scene.start(sceneKey));
    }

    private buildHeader() {
        const header = new ModuleHeader(this, {
            x: MARGIN,
            badgeLabel: "MODUL ANATOMI STRUKTUR",
            breadcrumbLabel: "Hasil & Umpan Balik",
            heading: "Hasil & Umpan Balik",
            subtitle:
                "Berikut adalah hasil pembelajaranmu. Terus tingkatkan pemahaman\ndan penerapan prosedur keselamatan pelayaran!",
            onBack: () => this.goTo("MainMenu"),
        });
        this.root.add(header.view);
    }

    private buildContent() {
        const leftColumnHeight = ROW_HEIGHT * 2 + ROW_GAP * 2 + TIPS_ROW_HEIGHT;

        this.root.add(
            createHeroFeedbackCard(this, MARGIN, CONTENT_TOP, LEFT_COLUMN_WIDTH, leftColumnHeight),
        );

        const columnWidth = (RIGHT_COLUMN_WIDTH - ROW_GAP) / 2;
        const scoreX = RIGHT_COLUMN_X;
        const awardX = RIGHT_COLUMN_X + columnWidth + ROW_GAP;
        const bottomRowY = CONTENT_TOP + ROW_HEIGHT + ROW_GAP;
        const tipsRowY = bottomRowY + ROW_HEIGHT + ROW_GAP;

        this.root.add(createScoreCard(this, scoreX, CONTENT_TOP, columnWidth, ROW_HEIGHT, 85, 100));
        this.root.add(
            createAwardCard(
                this,
                awardX,
                CONTENT_TOP,
                columnWidth,
                ROW_HEIGHT,
                "MASTER OF MARITIME SAFETY",
                "Luar biasa! Kamu menunjukkan ketepatan taktis dan kepatuhan\ntinggi terhadap prosedur keselamatan pelayaran.",
            ),
        );

        this.root.add(createChecklistCard(this, scoreX, bottomRowY, columnWidth, ROW_HEIGHT, 90));

        this.reflectionCard = new ReflectionCard(this, awardX, bottomRowY, columnWidth, ROW_HEIGHT);
        this.root.add(this.reflectionCard.view);

        this.root.add(
            createTipsAndRepeatRow(this, scoreX, tipsRowY, RIGHT_COLUMN_WIDTH, TIPS_ROW_HEIGHT, () =>
                this.goTo("AnatomiStruktur"),
            ),
        );
    }

    private layout(width: number, height: number) {
        this.background.setPosition(width / 2, height / 2);
        this.background.setDisplaySize(width, height);

        const scale = Math.min(width / DESIGN_WIDTH, height / DESIGN_HEIGHT);
        this.root.setScale(scale);
        const rootX = (width - DESIGN_WIDTH * scale) / 2;
        const rootY = (height - DESIGN_HEIGHT * scale) / 2;
        this.root.setPosition(rootX, rootY);

        const canvas = this.sys.game.canvas;
        const canvasRect = canvas.getBoundingClientRect();
        const domScaleX = canvasRect.width / width;
        const domScaleY = canvasRect.height / height;
        this.reflectionCard.layout(scale, rootX, rootY, canvasRect, domScaleX, domScaleY);
    }
}
