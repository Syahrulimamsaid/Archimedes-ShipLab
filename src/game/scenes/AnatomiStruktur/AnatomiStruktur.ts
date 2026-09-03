import { GameObjects, Scale, Scene } from "phaser";

import { createFloatingTabCard } from "../../../component/ModulePanel/ModulePanel";
import { ModuleHeader } from "../../../component/ModuleHeader/ModuleHeader";
import { SceneProgressFooter } from "../../../component/SceneProgressFooter/SceneProgressFooter";
import { EventBus } from "../../EventBus";
import { HullComponentInfo, InfoWindow } from "./InfoWindow";

interface HullComponentData extends HullComponentInfo {
    key: string;
}

// The 9 labelled parts of the double-bottom structure — this is the entire
// set of learnable components for this scene.
const HULL_COMPONENTS: HullComponentData[] = [
    {
        key: "gading-gading",
        number: 1,
        name: "Gading-gading",
        englishName: "Frames",
        description:
            "Profil baja siku/kanal yang berfungsi sebagai tulang rusuk melintang di dalam ruang dasar berganda, menopang pelat tank top dan menjaga bentuk struktur.",
        specs: [
            { label: "Material", value: "Baja Profil (Rolled Steel)" },
            { label: "Standar", value: "ISO 9328-2 / ASTM A36" },
            { label: "Tebal", value: "8 - 14 mm" },
            { label: "Jarak Gading", value: "600 - 800 mm" },
            { label: "Lapisan Pelindung", value: "Primer Anti Karat" },
            {
                label: "Fungsi Utama",
                value: "Menopang pelat tank top & menjaga bentuk melintang",
            },
            {
                label: "Catatan",
                value: "Dipasang tegak lurus terhadap lunas kapal",
            },
        ],
    },
    {
        key: "tank-side-bracket",
        number: 2,
        name: "Tank Side Bracket",
        englishName: "Tank Side Bracket",
        description:
            "Pelat penguat berbentuk siku yang menghubungkan pelat tank top dengan lempeng samping pada sudut ruang dasar berganda.",
        specs: [
            { label: "Material", value: "Baja Marin (Marine Steel)" },
            { label: "Standar", value: "ISO 9328-2 / ASTM A131" },
            { label: "Tebal", value: "10 - 14 mm" },
            { label: "Lapisan Pelindung", value: "Epoxy Coating" },
            {
                label: "Fungsi Utama",
                value: "Memperkuat sambungan sudut tank top dengan lempeng samping",
            },
            {
                label: "Catatan",
                value: "Dipasang pada setiap jarak gading di sisi kapal",
            },
        ],
    },
    {
        key: "lempeng-samping",
        number: 3,
        name: "Lempeng Samping",
        englishName: "Margin Plate",
        description:
            "Pelat miring yang menghubungkan pelat tank top dengan kulit kapal di bagian sisi, membentuk batas luar ruang dasar berganda.",
        specs: [
            { label: "Material", value: "Baja Marin (Marine Steel)" },
            { label: "Standar", value: "ISO 9328-2 / ASTM A131" },
            { label: "Tebal", value: "10 - 16 mm" },
            { label: "Kekuatan Tarik", value: "≥ 400 MPa" },
            { label: "Lapisan Pelindung", value: "Epoxy Coating" },
            {
                label: "Fungsi Utama",
                value: "Membatasi sisi ruang dasar berganda & menyalurkan beban ke kulit kapal",
            },
            {
                label: "Catatan",
                value: "Kemiringan disesuaikan dengan bentuk lengkung kulit kapal",
            },
        ],
    },
    {
        key: "longitudinals",
        number: 4,
        name: "Longitudinals",
        englishName: "Longitudinals",
        description:
            "Profil baja memanjang yang dipasang di antara wrang untuk menahan gaya memanjang dan menjaga kestabilan pelat tank top serta kulit kapal.",
        specs: [
            { label: "Material", value: "Baja Profil (Rolled Steel)" },
            { label: "Standar", value: "ISO 9328-2 / ASTM A36" },
            { label: "Tebal", value: "8 - 12 mm" },
            { label: "Jarak Pemasangan", value: "700 - 900 mm" },
            { label: "Lapisan Pelindung", value: "Primer Anti Karat" },
            {
                label: "Fungsi Utama",
                value: "Menahan gaya memanjang & mencegah tekuk pelat",
            },
            {
                label: "Catatan",
                value: "Dipasang sejajar dengan sumbu memanjang kapal",
            },
        ],
    },
    {
        key: "centre-girder",
        number: 5,
        name: "Penyangga Tengah",
        englishName: "Centre Girder",
        description:
            "Pelat baja tegak yang membentang di sepanjang garis tengah kapal, menjadi tulang punggung utama struktur dasar berganda.",
        specs: [
            { label: "Material", value: "Baja Marin (Marine Steel)" },
            { label: "Standar", value: "ISO 9328-2 / ASTM A131" },
            { label: "Tebal", value: "12 - 18 mm" },
            { label: "Kekuatan Tarik", value: "≥ 400 MPa" },
            { label: "Lapisan Pelindung", value: "Epoxy Coating" },
            {
                label: "Fungsi Utama",
                value: "Menopang beban utama & menjaga kekakuan memanjang dasar kapal",
            },
            {
                label: "Catatan",
                value: "Menjadi acuan pemasangan wrang di kedua sisi",
            },
        ],
    },
    {
        key: "bracket",
        number: 6,
        name: "Bracket",
        englishName: "Bracket",
        description:
            "Pelat penguat berbentuk segitiga yang dipasang pada pertemuan antara penyangga tengah, wrang, dan longitudinals untuk memperkuat sambungan.",
        specs: [
            { label: "Material", value: "Baja Marin (Marine Steel)" },
            { label: "Standar", value: "ISO 9328-2 / ASTM A131" },
            { label: "Tebal", value: "8 - 12 mm" },
            { label: "Lapisan Pelindung", value: "Epoxy Coating" },
            {
                label: "Fungsi Utama",
                value: "Memperkuat sambungan antar elemen struktur",
            },
            {
                label: "Catatan",
                value: "Ukuran disesuaikan dengan gaya yang bekerja pada sambungan",
            },
        ],
    },
    {
        key: "wrang-penuh",
        number: 7,
        name: "Wrang Penuh",
        englishName: "Solid Floor",
        description:
            "Pelat baja tegak melintang tanpa lubang besar, dipasang pada posisi tertentu (mis. di bawah sekat) untuk memberi kekuatan melintang maksimal.",
        specs: [
            { label: "Material", value: "Baja Marin (Marine Steel)" },
            { label: "Standar", value: "ISO 9328-2 / ASTM A131" },
            { label: "Tebal", value: "10 - 14 mm" },
            { label: "Kekuatan Tarik", value: "≥ 400 MPa" },
            { label: "Lapisan Pelindung", value: "Epoxy Coating (tangki)" },
            {
                label: "Fungsi Utama",
                value: "Memberi kekuatan melintang maksimal & menahan tekanan sekat",
            },
            {
                label: "Catatan",
                value: "Dipasang berselang-seling dengan wrang terbuka",
            },
        ],
    },
    {
        key: "wrang-terbuka",
        number: 8,
        name: "Wrang Terbuka",
        englishName: "Open Floor",
        description:
            "Pelat baja tegak melintang dengan lubang peringan dan lubang orang (manhole), dipasang di antara wrang penuh untuk mengurangi berat sekaligus memungkinkan akses perawatan.",
        specs: [
            { label: "Material", value: "Baja Marin (Marine Steel)" },
            { label: "Standar", value: "ISO 9328-2 / ASTM A131" },
            { label: "Tebal", value: "8 - 12 mm" },
            { label: "Lapisan Pelindung", value: "Epoxy Coating (tangki)" },
            {
                label: "Fungsi Utama",
                value: "Mengurangi berat struktur & memberi akses inspeksi tangki",
            },
            {
                label: "Catatan",
                value: "Dilengkapi lubang orang (manhole) untuk pemeriksaan berkala",
            },
        ],
    },
    {
        key: "tank-top",
        number: 9,
        name: "Pelat Tank Top",
        englishName: "Tank Top Plating",
        description:
            "Pelat baja horizontal yang menjadi dasar ruang muat sekaligus atap ruang dasar berganda, memisahkan ruang muat dari tangki ballast/bahan bakar di bawahnya.",
        specs: [
            { label: "Material", value: "Baja Marin (Marine Steel)" },
            { label: "Standar", value: "ISO 9328-2 / ASTM A131" },
            { label: "Tebal", value: "12 - 18 mm" },
            { label: "Kekuatan Tarik", value: "≥ 400 MPa" },
            { label: "Lapisan Pelindung", value: "Anti-abrasion Coating" },
            {
                label: "Fungsi Utama",
                value: "Dasar ruang muat & pemisah kedap air dari tangki dasar berganda",
            },
            {
                label: "Catatan",
                value: "Menahan beban muatan langsung dari ruang kargo di atasnya",
            },
        ],
    },
];

const PRIMARY_BLUE = 0x2f68d8;
const HOVER_BLUE = 0x5ba9e1;

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

    private diagram!: GameObjects.Container;
    private hotspots: Map<string, GameObjects.Rectangle[]> = new Map();

    private infoWindow!: InfoWindow;
    private footer!: SceneProgressFooter;
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

        EventBus.emit("current-scene-ready", this);

        this.events.once("shutdown", () => {
            this.scale.off(Scale.Events.RESIZE, this.handleResize, this);
        });
    }

    private handleResize(gameSize: Phaser.Structs.Size) {
        this.layout(gameSize.width, gameSize.height);
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
            onBack: () => this.scene.start("MainMenu"),
        });
        this.root.add(header.view);
    }

    // ---- Diagram card --------------------------------------------------

    private buildDiagramCard() {
        const x = MARGIN;
        const y = 310;
        const width = LEFT_COLUMN_WIDTH;
        const height = 510;

        this.root.add(
            createFloatingTabCard(
                this,
                x,
                y,
                width,
                height,
                "STRUKTUR DASAR BERGANDA KAPAL",
            ),
        );

        this.diagram = this.createDoubleBottomDiagram();
        this.diagram.setPosition(x + width / 2, y + height / 2 + 10);
        this.diagram.setScale(1.1);
        this.root.add(this.diagram);
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

    // ---- Right column: info window ---------------------------------------

    private buildRightColumn() {
        this.infoWindow = new InfoWindow(this, RIGHT_COLUMN_WIDTH);
        this.infoWindow.setPosition(RIGHT_COLUMN_X, 130);
        this.root.add(this.infoWindow.view);
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
    }

    private setHotspotHover(key: string, isHover: boolean) {
        const rects = this.hotspots.get(key);

        if (!rects) {
            return;
        }

        rects.forEach((rect) => {
            rect.setStrokeStyle(isHover ? 3 : 2, isHover ? HOVER_BLUE : 0x1d4b97, isHover ? 1 : 0.7);
            rect.setFillStyle(rect.fillColor, isHover ? 0.85 : rect.getData("baseAlpha"));
        });
    }

    private addHotspot(
        key: string,
        x: number,
        y: number,
        width: number,
        height: number,
        fillColor: number,
        fillAlpha = 0.65,
    ) {
        const rect = this.add
            .rectangle(x, y, width, height, fillColor, fillAlpha)
            .setStrokeStyle(2, 0x1d4b97, 0.7)
            .setInteractive({ useHandCursor: true });
        rect.setData("baseAlpha", fillAlpha);

        rect.on("pointerover", () => this.setHotspotHover(key, true));
        rect.on("pointerout", () => this.setHotspotHover(key, false));
        rect.on("pointerdown", () => this.selectComponent(key));

        const existing = this.hotspots.get(key) ?? [];
        existing.push(rect);
        this.hotspots.set(key, existing);

        return rect;
    }

    private addNumberBadge(n: number, x: number, y: number, container: GameObjects.Container) {
        const badge = this.add.graphics();
        badge.fillStyle(PRIMARY_BLUE, 1);
        badge.fillCircle(x, y, 11);
        badge.lineStyle(1.5, 0xffffff, 1);
        badge.strokeCircle(x, y, 11);

        const label = this.add
            .text(x, y, String(n), {
                fontFamily: "Arial Black",
                fontSize: 12,
                color: "#ffffff",
            })
            .setOrigin(0.5);

        container.add([badge, label]);
    }

    /**
     * The double-bottom structure, enlarged to fill the diagram card since
     * it's now the sole subject of this scene. All 9 labelled parts are
     * individually clickable, numbered to match the InfoWindow badge.
     */
    private createDoubleBottomDiagram() {
        const container = this.add.container(0, 0);
        const bandTop = -70;
        const bandBottom = 170;
        const bandLeft = -320;
        const bandRight = 320;
        const framesTop = -160;

        // Soft background panel for context (non-interactive).
        const backdrop = this.add.graphics();
        backdrop.fillStyle(0xeaf3ff, 0.6);
        backdrop.fillRoundedRect(bandLeft - 20, bandTop - 4, bandRight - bandLeft + 40, bandBottom - bandTop + 24, 16);
        container.add(backdrop);

        // 9. Pelat Tank Top — the plating band across the very top.
        const tankTop = this.addHotspot(
            "tank-top",
            0,
            bandTop,
            bandRight - bandLeft,
            16,
            0x1d4b97,
            0.85,
        );
        container.add(tankTop);
        this.addNumberBadge(9, 250, bandTop - 20, container);

        // 4. Longitudinals — thin stiffener bands inside the structure.
        [bandTop + 60, bandTop + 140].forEach((ly) => {
            const strip = this.addHotspot("longitudinals", 0, ly, 480, 10, 0x1d4b97, 0.35);
            container.add(strip);
        });
        this.addNumberBadge(4, 170, bandTop + 60, container);

        // 7. Wrang Penuh (solid floor) — two instances.
        [-150, 150].forEach((fx) => {
            const floor = this.addHotspot("wrang-penuh", fx, (bandTop + bandBottom) / 2, 20, bandBottom - bandTop, 0x1d4b97, 0.8);
            container.add(floor);
        });
        this.addNumberBadge(7, -150, bandBottom - 20, container);

        // 8. Wrang Terbuka (open floor) — two instances, each with a
        // manhole cut-out drawn on top.
        [-250, 250].forEach((fx) => {
            const floor = this.addHotspot("wrang-terbuka", fx, (bandTop + bandBottom) / 2, 20, bandBottom - bandTop, 0xbcd4f5, 0.85);
            container.add(floor);

            const hole = this.add.graphics();
            hole.fillStyle(0xeaf3ff, 1);
            hole.fillEllipse(fx, (bandTop + bandBottom) / 2, 16, 30);
            hole.lineStyle(1.5, 0x1d4b97, 0.7);
            hole.strokeEllipse(fx, (bandTop + bandBottom) / 2, 16, 30);
            container.add(hole);
        });
        this.addNumberBadge(8, -250, bandTop + 20, container);

        // 5. Penyangga Tengah / Centre Girder — the main vertical backbone.
        const girder = this.addHotspot("centre-girder", 0, (bandTop + bandBottom) / 2, 20, bandBottom - bandTop, 0x2f68d8, 0.85);
        container.add(girder);
        this.addNumberBadge(5, 0, bandTop - 20, container);

        // 6. Bracket — small gussets where the girder meets the floors.
        [-45, 45].forEach((bx) => {
            const bracketHit = this.addHotspot("bracket", bx, bandBottom - 24, 44, 44, 0x6c4fd1, 0.35);
            container.add(bracketHit);

            const tri = this.add.graphics();
            tri.fillStyle(0x6c4fd1, 0.85);
            tri.beginPath();
            const dir = bx < 0 ? 1 : -1;
            tri.moveTo(bx, bandBottom - 44);
            tri.lineTo(bx + dir * 22, bandBottom - 4);
            tri.lineTo(bx, bandBottom - 4);
            tri.closePath();
            tri.fillPath();
            container.add(tri);
        });
        this.addNumberBadge(6, 0, bandBottom - 44, container);

        // 2. Tank Side Bracket — gussets at the top corners.
        [bandLeft, bandRight].forEach((edgeX) => {
            const dir = edgeX < 0 ? 1 : -1;
            const hit = this.addHotspot(
                "tank-side-bracket",
                edgeX + dir * 25,
                bandTop + 30,
                50,
                50,
                0xd68a1f,
                0.3,
            );
            container.add(hit);

            const tri = this.add.graphics();
            tri.fillStyle(0xd68a1f, 0.85);
            tri.beginPath();
            tri.moveTo(edgeX, bandTop + 8);
            tri.lineTo(edgeX + dir * 44, bandTop + 8);
            tri.lineTo(edgeX, bandTop + 52);
            tri.closePath();
            tri.fillPath();
            container.add(tri);
        });
        this.addNumberBadge(2, bandRight - 30, bandTop + 20, container);

        // 3. Lempeng Samping / Margin Plate — sloped side plates.
        [bandLeft, bandRight].forEach((edgeX) => {
            const dir = edgeX < 0 ? 1 : -1;
            const hit = this.addHotspot(
                "lempeng-samping",
                edgeX + dir * 20,
                (bandTop + bandBottom) / 2,
                40,
                bandBottom - bandTop,
                0x7d8da8,
                0.3,
            );
            container.add(hit);

            const plate = this.add.graphics();
            plate.fillStyle(0x7d8da8, 0.85);
            plate.beginPath();
            plate.moveTo(edgeX, bandTop);
            plate.lineTo(edgeX + dir * 40, bandTop + 20);
            plate.lineTo(edgeX + dir * 40, bandBottom);
            plate.lineTo(edgeX, bandBottom);
            plate.closePath();
            plate.fillPath();
            container.add(plate);
        });
        this.addNumberBadge(3, bandLeft + 30, bandBottom - 20, container);

        // 1. Gading-gading / Frames — ribs standing above the tank top.
        [-260, -160, -60, 60, 160, 260].forEach((fx) => {
            const frame = this.addHotspot(
                "gading-gading",
                fx,
                (framesTop + bandTop) / 2,
                14,
                bandTop - framesTop,
                0x4aa96c,
                0.75,
            );
            container.add(frame);
        });
        this.addNumberBadge(1, -260, framesTop + 14, container);

        return container;
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
    }
}
