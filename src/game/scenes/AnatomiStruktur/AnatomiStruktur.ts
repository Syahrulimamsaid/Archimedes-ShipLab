import { GameObjects, Scale, Scene } from "phaser";

import { playSceneEnter, playSceneExit } from "../../../component/SceneTransition";
import { ModuleHeader } from "../../../component/ModuleHeader/ModuleHeader";
import { SceneProgressFooter } from "../../../component/SceneProgressFooter/SceneProgressFooter";
import { EventBus } from "../../EventBus";
import { unlockNextModuleAfter } from "../../ModuleProgress";
import { HULL_COMPONENTS, SOP_DARURAT_QUIZ } from "./HullComponentsData";
import { InfoWindow } from "./InfoWindow";
import { QuizPromptCard } from "./QuizPromptCard";
import { InteractiveShipStructureViewer } from "./ship3d/InteractiveShipStructureViewer";

// The whole scene is authored at this fixed reference resolution and
// uniformly scaled to fit the window — far more reliable for reproducing a
// pixel-specific mockup than computing dozens of independent responsive
// fractions like the other scenes do.
const DESIGN_WIDTH = 1536;
const DESIGN_HEIGHT = 980;
const MARGIN = 40;
const LEFT_COLUMN_WIDTH = 880;
const RIGHT_COLUMN_X = 990;
const RIGHT_COLUMN_WIDTH = 462;

export class AnatomiStruktur extends Scene {
    private background!: GameObjects.Image;
    private root!: GameObjects.Container;

    private infoWindow!: InfoWindow;
    private footer!: SceneProgressFooter;
    private quizPrompt!: QuizPromptCard;
    private diagramViewer!: InteractiveShipStructureViewer;
    private viewedKeys = new Set<string>();

    constructor() {
        super("AnatomiStruktur");
    }

    create() {
        this.background = this.add.image(0, 0, "AnatomiStructure.background");
        this.root = this.add.container(0, 0);

        this.buildHeader();
        this.buildDiagramCard();
        this.buildFooterCard();
        this.buildRightColumn();

        this.layout(this.scale.width, this.scale.height);
        this.scale.on(Scale.Events.RESIZE, this.handleResize, this);
        playSceneEnter(this, this.root);

        EventBus.emit("current-scene-ready", this);

        this.events.once("shutdown", () => {
            this.scale.off(Scale.Events.RESIZE, this.handleResize, this);
        });
    }

    private handleResize(gameSize: Phaser.Structs.Size) {
        this.layout(gameSize.width, gameSize.height);
    }

    private goTo(sceneKey: string) {
        playSceneExit(this, this.root, () => this.scene.start(sceneKey));
    }

    // ---- Header: back button + breadcrumb + heading --------------------

    private buildHeader() {
        const header = new ModuleHeader(this, {
            x: MARGIN,
            badgeLabel: "MODUL ANATOMI STRUKTUR",
            breadcrumbLabel: "Struktur Dasar Berganda",
            heading: "Struktur Dasar Berganda Kapal",
            subtitle:
                "Klik setiap komponen pada potongan dasar berganda\nuntuk mengetahui spesifikasi materialnya.",
            onBack: () => this.goTo("MainMenu"),
        });
        this.root.add(header.view);
    }

    // ---- Diagram card --------------------------------------------------

    private buildDiagramCard() {
        this.diagramViewer = new InteractiveShipStructureViewer(
            this,
            MARGIN,
            310,
            LEFT_COLUMN_WIDTH,
            510,
            (key) => this.selectComponent(key),
        );
        this.root.add(this.diagramViewer.view);
    }

    // ---- Footer card: scene label + progress ---------------------------

    private buildFooterCard() {
        this.footer = new SceneProgressFooter(this, {
            x: MARGIN,
            y: 846,
            width: LEFT_COLUMN_WIDTH,
            sceneLabel: "SCENE 2",
            sceneTitle: "Struktur Dasar Berganda",
            progressLabel: "PROGRES EKSPLORASI",
            total: HULL_COMPONENTS.length,
        });
        this.root.add(this.footer.view);
    }

    // ---- Right column: info window + quiz prompt --------------------------

    private buildRightColumn() {
        this.infoWindow = new InfoWindow(this, RIGHT_COLUMN_WIDTH);
        this.infoWindow.setPosition(RIGHT_COLUMN_X, 130);
        this.root.add(this.infoWindow.view);

        this.quizPrompt = new QuizPromptCard(this, RIGHT_COLUMN_X, RIGHT_COLUMN_WIDTH, (quiz) => {
            // A dedicated scene, not a modal overlay — it takes over the
            // whole screen and (deliberately) has no way back until the
            // quiz is completed.
            this.scene.start("QuizScene", { config: quiz, returnScene: "AnatomiStruktur" });
        });
        this.root.add(this.quizPrompt.view);

        // Shown immediately on open — not gated behind selecting a
        // component (the watertight door hotspot that used to gate it was
        // removed from the diagram).
        this.quizPrompt.show(SOP_DARURAT_QUIZ, this.infoWindow.bottom + 16);
        unlockNextModuleAfter("anatomi-struktur");
    }

    // ---- Diagram hotspot interaction --------------------------------------

    private selectComponent(key: string) {
        const data = HULL_COMPONENTS.find((component) => component.key === key);

        if (!data) {
            return;
        }

        this.infoWindow.show(data);
        this.viewedKeys.add(key);
        this.footer.setProgress(this.viewedKeys.size);

        // The quiz prompt stays visible at all times now — just reposition
        // it below whatever height the info window grew to.
        this.quizPrompt.show(SOP_DARURAT_QUIZ, this.infoWindow.bottom + 16);
    }

    private layout(width: number, height: number) {
        this.background.setPosition(width / 2, height / 2);
        this.background.setDisplaySize(width, height);

        const scale = Math.min(width / DESIGN_WIDTH, height / DESIGN_HEIGHT);
        this.root.setScale(scale);
        const rootX = (width - DESIGN_WIDTH * scale) / 2;
        const rootY = (height - DESIGN_HEIGHT * scale) / 2;
        this.root.setPosition(rootX, rootY);

        this.diagramViewer?.setViewport(scale, rootX, rootY);
    }
}
