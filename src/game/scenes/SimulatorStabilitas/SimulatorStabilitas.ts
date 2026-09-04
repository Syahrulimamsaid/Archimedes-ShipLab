import { GameObjects, Scale, Scene } from "phaser";

import { playSceneEnter, playSceneExit } from "../../../component/SceneTransition";
import { ModuleHeader } from "../../../component/ModuleHeader/ModuleHeader";
import { SceneProgressFooter } from "../../../component/SceneProgressFooter/SceneProgressFooter";
import { EventBus } from "../../EventBus";
import {
    GM_ANSWER_TOLERANCE,
    KM_METACENTER,
    LIGHT_SHIP_KG,
    MIN_STABLE_GM,
    StabilityResult,
    computeStability,
} from "./CargoModel";
import { GmCalculatorCard } from "./GmCalculatorCard";
import { ShipCargoCard } from "./ShipCargoCard";
import { StabilityGraphCard } from "./StabilityGraphCard";
import { createTipsCard } from "./TipsCard";

// Authored at a fixed reference resolution and uniformly scaled to fit the
// window (see AnatomiStruktur for the same approach) — much more reliable
// for a pixel-specific mockup than independent responsive fractions.
const DESIGN_WIDTH = 1536;
const DESIGN_HEIGHT = 1060;
const MARGIN = 40;
const LEFT_COLUMN_WIDTH = 880;
const RIGHT_COLUMN_X = 990;
const RIGHT_COLUMN_WIDTH = 462;

export class SimulatorStabilitas extends Scene {
    private background!: GameObjects.Image;
    private root!: GameObjects.Container;

    private shipCargoCard!: ShipCargoCard;
    private graphCard!: StabilityGraphCard;
    private gmCard!: GmCalculatorCard;

    private currentStability: StabilityResult = computeStability(0, 0);

    constructor() {
        super("SimulatorStabilitas");
    }

    create() {
        this.background = this.add.image(0, 0, "AnatomiStructure.background");
        this.root = this.add.container(0, 0);

        this.buildHeader();
        this.buildCargoCard();
        this.buildFooterCard();
        this.buildRightColumn();
        this.applyStability(computeStability(0, 0));

        this.layout(this.scale.width, this.scale.height);
        this.scale.on(Scale.Events.RESIZE, this.handleResize, this);
        playSceneEnter(this, this.root);

        EventBus.emit("current-scene-ready", this);

        this.events.once("shutdown", () => {
            this.scale.off(Scale.Events.RESIZE, this.handleResize, this);
            this.gmCard.destroy();
        });
    }

    private handleResize(gameSize: Phaser.Structs.Size) {
        this.layout(gameSize.width, gameSize.height);
    }

    private goTo(sceneKey: string) {
        playSceneExit(this, this.root, () => this.scene.start(sceneKey));
    }

    // ---- Header ----------------------------------------------------------

    private buildHeader() {
        const header = new ModuleHeader(this, {
            x: MARGIN,
            badgeLabel: "MODUL SIMULATOR STABILITAS",
            breadcrumbLabel: "Simulasi Beban & Input Teks",
            heading: "Simulasi Beban & Input Teks",
            subtitle:
                "Lakukan drag & drop kargo ke palka untuk mengatur distribusi beban.\nHitung GM = KM - KG, lalu masukkan hasilnya untuk divalidasi.",
            onBack: () => this.goTo("MainMenu"),
        });
        this.root.add(header.view);
    }

    // ---- Left card: ship + drop zones + cargo palette ---------------------

    private buildCargoCard() {
        this.shipCargoCard = new ShipCargoCard(
            this,
            MARGIN,
            310,
            LEFT_COLUMN_WIDTH,
            610,
            (upperWeight, lowerWeight) => this.applyStability(computeStability(upperWeight, lowerWeight)),
        );
        this.root.add(this.shipCargoCard.view);
    }

    /** The single source of truth for a new StabilityResult: pushes it to
     * the graph, the GM card, the hull tilt, and keeps a copy for
     * checkAnswer() to validate against. */
    private applyStability(result: StabilityResult) {
        this.currentStability = result;
        this.graphCard.update(result);
        this.gmCard.update(result.km, result.kg);
        this.shipCargoCard.setTilt(result.isStable ? result.listAngle * 0.4 : result.listAngle * 0.8);
    }

    // ---- Footer ------------------------------------------------------------

    private buildFooterCard() {
        const footer = new SceneProgressFooter(this, {
            x: MARGIN,
            y: 946,
            width: LEFT_COLUMN_WIDTH,
            sceneLabel: "SCENE 3",
            sceneTitle: "Simulasi Stabilitas Kapal",
            progressLabel: "PROGRES SIMULASI",
            total: 5,
        });
        footer.setProgress(3);
        this.root.add(footer.view);
    }

    // ---- Right column: graph + GM calculator + tips ------------------------

    private buildRightColumn() {
        this.graphCard = new StabilityGraphCard(this, RIGHT_COLUMN_X, 130, RIGHT_COLUMN_WIDTH, 480);
        this.root.add(this.graphCard.view);

        this.gmCard = new GmCalculatorCard(
            this,
            RIGHT_COLUMN_X,
            634,
            RIGHT_COLUMN_WIDTH,
            230,
            KM_METACENTER,
            LIGHT_SHIP_KG,
            (inputValue) => this.checkAnswer(inputValue),
        );
        this.root.add(this.gmCard.view);

        this.root.add(createTipsCard(this, RIGHT_COLUMN_X, 888, RIGHT_COLUMN_WIDTH, 110));
    }

    /** Parses the student's GM answer and checks it against the live value
     * derived from whatever cargo is actually placed (see applyStability),
     * within a small tolerance for rounding. */
    private checkAnswer(rawInput: string) {
        const raw = rawInput.trim().replace(",", ".");
        const userGM = parseFloat(raw);

        if (raw === "" || Number.isNaN(userGM)) {
            this.gmCard.setFeedback("Masukkan hasil GM (dalam meter) terlebih dahulu.", "#c0392b");
            return;
        }

        const { km, kg, gm } = this.currentStability;
        const isCorrect = Math.abs(userGM - gm) <= GM_ANSWER_TOLERANCE;
        const stabilityNote =
            gm >= MIN_STABLE_GM
                ? "kapal dalam kondisi STABIL"
                : "kapal berisiko OLENG karena GM di bawah ambang aman";
        const workedExample = `GM = KM (${km.toFixed(2)}) - KG (${kg.toFixed(2)}) = ${gm.toFixed(2)} m`;

        if (isCorrect) {
            this.gmCard.setFeedback(`Benar! ${workedExample}, ${stabilityNote}.`, "#1f8d52");
        } else {
            this.gmCard.setFeedback(`Kurang tepat. Seharusnya ${workedExample}. Coba hitung kembali.`, "#c0392b");
        }
    }

    private layout(width: number, height: number) {
        this.background.setPosition(width / 2, height / 2);
        this.background.setDisplaySize(width, height);

        const scale = Math.min(width / DESIGN_WIDTH, height / DESIGN_HEIGHT);
        this.root.setScale(scale);
        this.root.setPosition(
            (width - DESIGN_WIDTH * scale) / 2,
            (height - DESIGN_HEIGHT * scale) / 2,
        );

        const rootX = (width - DESIGN_WIDTH * scale) / 2;
        const rootY = (height - DESIGN_HEIGHT * scale) / 2;
        this.shipCargoCard.setViewport(scale, rootX, rootY);

        const canvas = this.sys.game.canvas;
        const canvasRect = canvas.getBoundingClientRect();
        const domScaleX = canvasRect.width / width;
        const domScaleY = canvasRect.height / height;
        this.gmCard.layout(scale, rootX, rootY, canvasRect, domScaleX, domScaleY);
    }
}
