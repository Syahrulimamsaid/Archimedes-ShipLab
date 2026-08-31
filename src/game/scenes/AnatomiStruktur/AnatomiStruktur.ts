import { GameObjects, Scale, Scene } from "phaser";

import { SceneHeader } from "../../../component/SceneHeader/SceneHeader";
import { EventBus } from "../../EventBus";
import { InfoWindow } from "./InfoWindow";
import { QuizModal } from "./QuizModal";

interface HullComponentData {
    key: string;
    label: string;
    material: string;
}

const HULL_COMPONENTS: HullComponentData[] = [
    {
        key: "kulit",
        label: "Kulit Kapal (Shell Plating)",
        material:
            "Pelat baja lambung luar yang membentuk badan kapal dan menahan tekanan hidrostatis air laut secara langsung.",
    },
    {
        key: "gading",
        label: "Gading-gading (Frames)",
        material:
            "Profil baja siku/kanal yang berfungsi sebagai tulang rusuk melintang, menopang kulit kapal dan menahan tekanan air laut.",
    },
    {
        key: "dasar-berganda",
        label: "Dasar Berganda (Double Bottom)",
        material:
            "Pelat baja ganda dengan struktur girder dan floor, berfungsi sebagai ruang tangki sekaligus pelindung tambahan terhadap kebocoran dasar kapal.",
    },
    {
        key: "sekat",
        label: "Sekat Kedap Air (Watertight Bulkhead)",
        material:
            "Pelat baja tegak kedap air yang membagi lambung menjadi beberapa kompartemen untuk membatasi penyebaran air jika terjadi kebocoran.",
    },
    {
        key: "pintu",
        label: "Pintu Kedap Air (Watertight Door)",
        material:
            "Pintu baja dengan mekanisme penutup kedap air pada sekat, dioperasikan untuk mengisolasi kompartemen saat kondisi darurat kebocoran.",
    },
];

const ACCENT_COLOR = 0x2f68d8;
const HOVER_COLOR = 0x5ba9e1;

export class AnatomiStruktur extends Scene {
    private background!: GameObjects.Image;
    private header!: SceneHeader;
    private infoWindow!: InfoWindow;
    private quizModal!: QuizModal;

    private diagram!: GameObjects.Container;
    private hotspots: Map<string, GameObjects.Rectangle[]> = new Map();

    constructor() {
        super("AnatomiStruktur");
    }

    create() {
        this.background = this.add.image(0, 0, "background.home").setAlpha(0.5);

        this.header = new SceneHeader(this, {
            title: "Anatomi Struktur",
            subtitle: "Eksplorasi Lapisan Lambung Kapal",
            onBack: () => this.scene.start("MainMenu"),
        });

        this.diagram = this.createHullDiagram();
        this.infoWindow = new InfoWindow(this);
        this.quizModal = new QuizModal(this, {
            title: "Kuis SOP Darurat Kebocoran",
            message:
                "Pintu kedap air telah dimanipulasi. Jawab kuis prosedur tanggap darurat kebocoran untuk melanjutkan.",
            badgeNote:
                'Menyelesaikan kuis ini akan membuka klaim lencana "Ship Construction Surveyor".',
        });

        this.layout(this.scale.width, this.scale.height);
        this.scale.on(Scale.Events.RESIZE, this.handleResize, this);

        EventBus.emit("current-scene-ready", this);

        this.events.once("shutdown", () => {
            this.scale.off(Scale.Events.RESIZE, this.handleResize, this);
        });
    }

    private handleResize(gameSize: Phaser.Structs.Size) {
        this.layout(gameSize.width, gameSize.height);
    }

    private selectComponent(key: string) {
        const data = HULL_COMPONENTS.find((component) => component.key === key);

        if (!data) {
            return;
        }

        this.infoWindow.show(data.label, data.material, ACCENT_COLOR);

        if (key === "pintu") {
            this.quizModal.open();
        }
    }

    private setHotspotHover(key: string, isHover: boolean) {
        const rects = this.hotspots.get(key);

        if (!rects) {
            return;
        }

        rects.forEach((rect) => {
            rect.setStrokeStyle(isHover ? 3 : 2, isHover ? HOVER_COLOR : 0x1d4b97, isHover ? 1 : 0.7);
            rect.setFillStyle(rect.fillColor, isHover ? 0.85 : 0.6);
        });
    }

    private addHotspot(
        key: string,
        x: number,
        y: number,
        width: number,
        height: number,
        fillColor: number,
    ) {
        const rect = this.add
            .rectangle(x, y, width, height, fillColor, 0.6)
            .setStrokeStyle(2, 0x1d4b97, 0.7)
            .setInteractive({ useHandCursor: true });

        rect.on("pointerover", () => this.setHotspotHover(key, true));
        rect.on("pointerout", () => this.setHotspotHover(key, false));
        rect.on("pointerdown", () => this.selectComponent(key));

        const existing = this.hotspots.get(key) ?? [];
        existing.push(rect);
        this.hotspots.set(key, existing);

        return rect;
    }

    /**
     * A simplified schematic of a hull cross-section, built from primitives
     * (no dedicated artwork exists yet) with one interactive hotspot per
     * component described in the spec.
     */
    private createHullDiagram() {
        const container = this.add.container(0, 0);

        // Outer hull outline (Kulit Kapal) — rounded at the bottom to suggest
        // the hull's curvature.
        const hullOutline = this.add.graphics();
        hullOutline.fillStyle(0xdcebfa, 0.5);
        hullOutline.lineStyle(4, 0x1d4b97, 0.9);
        hullOutline.fillRoundedRect(-300, -170, 600, 340, {
            tl: 20,
            tr: 20,
            bl: 90,
            br: 90,
        });
        hullOutline.strokeRoundedRect(-300, -170, 600, 340, {
            tl: 20,
            tr: 20,
            bl: 90,
            br: 90,
        });
        container.add(hullOutline);

        const hullHotspot = this.addHotspot("kulit", 0, -170, 600, 24, 0x2f68d8);
        container.add(hullHotspot);

        // Double bottom (Dasar Berganda) — band along the bottom.
        const doubleBottomHotspot = this.addHotspot(
            "dasar-berganda",
            0,
            110,
            560,
            60,
            0xd39d1f,
        );
        container.add(doubleBottomHotspot);

        // Frames (Gading-gading) — evenly spaced ribs, one hotspot group.
        [-240, -160, -80, 80, 160, 240].forEach((x) => {
            const frame = this.addHotspot("gading", x, -20, 14, 300, 0x4aa96c);
            container.add(frame);
        });

        // Watertight bulkhead (Sekat Kedap Air) — vertical wall through the
        // middle of the hull.
        const bulkheadHotspot = this.addHotspot(
            "sekat",
            0,
            -20,
            32,
            340,
            0x7d8da8,
        );
        container.add(bulkheadHotspot);

        // Watertight door (Pintu Kedap Air) — cut into the bulkhead.
        const doorHotspot = this.addHotspot("pintu", 0, 70, 28, 60, 0xd9534f);
        container.add(doorHotspot);

        return container;
    }

    private layout(width: number, height: number) {
        const centerX = width / 2;
        const centerY = height / 2;

        this.background.setPosition(centerX, centerY);
        this.background.setDisplaySize(width, height);

        this.header.layout(width, height);

        const headerHeight = Math.max(58, height * 0.088);
        const contentTop = Math.max(10, height * 0.012) + headerHeight;
        const diagramScale = Math.min(
            (width * 0.68) / 640,
            (height - contentTop - 60) / 380,
            1,
        );

        this.diagram.setPosition(centerX - width * 0.08, contentTop + (height - contentTop) / 2);
        this.diagram.setScale(Math.max(0.5, diagramScale));

        this.infoWindow.layout(
            width - Math.min(260, width * 0.18),
            contentTop + (height - contentTop) / 2,
            Math.max(0.7, Math.min(1, width / 1600)),
        );

        this.quizModal.layout(centerX, centerY, width, height);
    }
}
