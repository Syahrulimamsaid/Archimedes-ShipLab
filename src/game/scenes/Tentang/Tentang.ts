import { GameObjects, Scale, Scene } from "phaser";

import { ModuleHeader } from "../../../component/ModuleHeader/ModuleHeader";
import {
    BODY_TEXT,
    BORDER_BLUE,
    DARK_NAVY,
    PRIMARY_BLUE,
    PRIMARY_BLUE_HEX,
    createHeaderBarCard,
} from "../../../component/ModulePanel/ModulePanel";
import { playSceneEnter, playSceneExit } from "../../../component/SceneTransition";
import { EventBus } from "../../EventBus";

// Authored at a fixed reference resolution and uniformly scaled to fit the
// window, same approach as the other module scenes.
const DESIGN_WIDTH = 1536;
const DESIGN_HEIGHT = 1060;
const MARGIN = 40;
const LEFT_COLUMN_WIDTH = 880;
const RIGHT_COLUMN_X = 990;
const RIGHT_COLUMN_WIDTH = 462;

const CARD_FILL = 0xdce6f5;

/**
 * A static "Tentang" (about) info page — app metadata, learning goals,
 * feature summary, and asset credits — reached from MainMenu's Tentang
 * button. Purely informational: no interactive gameplay of its own.
 */
export class Tentang extends Scene {
    private background!: GameObjects.Image;
    private root!: GameObjects.Container;

    constructor() {
        super("Tentang");
    }

    create() {
        this.background = this.add.image(0, 0, "AnatomiStructure.background");
        this.root = this.add.container(0, 0);

        this.buildHeader();
        this.buildIllustration();
        this.buildTipBar();
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

    // ---- Header -----------------------------------------------------------

    private buildHeader() {
        const header = new ModuleHeader(this, {
            x: MARGIN,
            badgeLabel: "ARCHIMEDES-SHIPLAB",
            breadcrumbLabel: "Tentang",
            heading: "Tentang Archimedes-ShipLab",
            subtitle:
                "Archimedes-ShipLab adalah media pembelajaran interaktif berbasis simulasi\nyang dirancang untuk membantu taruna memahami struktur kapal dan prinsip\nstabilitas secara visual, praktis, dan menyenangkan.",
            onBack: () => this.goTo("MainMenu"),
        });
        this.root.add(header.view);
    }

    // ---- Left column: illustration + tip bar -------------------------------

    private buildIllustration() {
        const x = MARGIN;
        const y = 352;
        const width = LEFT_COLUMN_WIDTH;
        const height = 466;
        const radius = 20;

        const frame = this.add.graphics();
        frame.fillStyle(0xffffff, 1);
        frame.fillRoundedRect(x, y, width, height, radius);

        // A dedicated illustration asset for this page only (bg_tentang.png)
        // — separate from MainMenu's own background.home, so cropping it
        // here never affects MainMenu. Phaser 4 dropped GeometryMask support
        // under WebGL (Canvas renderer only — see GeometryMask's class doc),
        // so instead of clipping to the rounded corners, the image is just
        // inset enough that its own square corners sit safely inside the
        // card's rounded-corner curve.
        const inset = 14;
        const textureKey = "tentang.background";
        const frameKey = "tentang.illustrationCrop";
        const texture = this.textures.get(textureKey);
        if (!texture.has(frameKey)) {
            texture.add(frameKey, 0, 360, 95, 970, 490);
        }

        const image = this.add.image(x + width / 2, y + height / 2, textureKey, frameKey);
        const fitScale = Math.min((width - inset * 2) / image.width, (height - inset * 2) / image.height);
        image.setScale(fitScale);

        const border = this.add.graphics();
        border.lineStyle(2, PRIMARY_BLUE, 0.9);
        border.strokeRoundedRect(x, y, width, height, radius);

        const quoteWidth = 600;
        const quoteHeight = 92;
        const quoteX = x + width / 2 - quoteWidth / 2;
        const quoteY = y + 36;
        const quoteBg = this.add.graphics();
        quoteBg.fillStyle(0xffffff, 0.82);
        quoteBg.fillRoundedRect(quoteX, quoteY, quoteWidth, quoteHeight, 18);

        const quoteText = this.add
            .text(x + width / 2, quoteY + quoteHeight / 2, '"Belajar Nautika,\nLebih Dekat dengan Dunia Nyata"', {
                fontFamily: "Arial Black",
                fontSize: 22,
                color: DARK_NAVY,
                align: "center",
                lineSpacing: 8,
            })
            .setOrigin(0.5);

        this.root.add([frame, image, quoteBg, quoteText, border]);
    }

    private buildTipBar() {
        const x = MARGIN;
        const y = 836;
        const width = LEFT_COLUMN_WIDTH;
        const height = 64;

        const bar = this.add.graphics();
        bar.fillStyle(0xeaf2ff, 1);
        bar.fillRoundedRect(x, y, width, height, 16);
        bar.lineStyle(2, BORDER_BLUE, 1);
        bar.strokeRoundedRect(x, y, width, height, 16);

        const icon = this.add.text(x + 28, y + height / 2, "💡", { fontFamily: "Arial", fontSize: 22 }).setOrigin(0, 0.5);

        const text = this.add
            .text(x + 64, y + height / 2, "Mari belajar, berlatih, dan wujudkan pelayaran yang lebih aman!", {
                fontFamily: "Arial Black",
                fontSize: 15,
                color: DARK_NAVY,
                wordWrap: { width: width - 100 },
            })
            .setOrigin(0, 0.5);

        this.root.add([bar, icon, text]);
    }

    // ---- Right column: info cards -------------------------------------------

    private buildRightColumn() {
        const gap = 14;
        let cursorY = 90;

        cursorY += this.buildInfoAplikasiCard(RIGHT_COLUMN_X, cursorY, RIGHT_COLUMN_WIDTH) + gap;
        cursorY += this.buildTujuanCard(RIGHT_COLUMN_X, cursorY, RIGHT_COLUMN_WIDTH) + gap;
        cursorY += this.buildFiturCard(RIGHT_COLUMN_X, cursorY, RIGHT_COLUMN_WIDTH) + gap;
        cursorY += this.buildSumberAsetCard(RIGHT_COLUMN_X, cursorY, RIGHT_COLUMN_WIDTH) + gap;

        this.buildTagline(RIGHT_COLUMN_X, RIGHT_COLUMN_WIDTH, cursorY);
    }

    private buildInfoAplikasiCard(x: number, y: number, width: number): number {
        const headerHeight = 40;
        const rows: Array<[string, string, string]> = [
            ["🎓", "Nama Aplikasi", "Archimedes-ShipLab"],
            ["📖", "Versi", "1.0.0"],
            ["👥", "Target Pengguna", "Taruna SMK Nautika Kapal Niaga"],
            ["🖥️", "Jenis", "Media Pembelajaran Interaktif"],
            ["📅", "Tahun Pengembangan", "2024"],
            ["🏢", "Pengembang", "Sayembara Digital SMK"],
        ];

        const rowHeight = 36;
        const paddingTop = 14;
        const paddingBottom = 12;
        const height = headerHeight + paddingTop + paddingBottom + rows.length * rowHeight;

        const chrome = createHeaderBarCard(this, x, y, width, height, "INFORMASI APLIKASI", headerHeight);
        this.root.add(chrome);

        const labelX = x + 58;
        const colonX = labelX + 145;
        const valueX = colonX + 12;

        rows.forEach(([icon, label, value], index) => {
            const rowY = y + headerHeight + paddingTop + index * rowHeight + rowHeight / 2;

            const iconBg = this.add.circle(x + 32, rowY, 14, CARD_FILL, 1);
            const iconText = this.add.text(x + 32, rowY, icon, { fontFamily: "Arial", fontSize: 13 }).setOrigin(0.5);

            const labelText = this.add
                .text(labelX, rowY, label, { fontFamily: "Arial Black", fontSize: 12, color: DARK_NAVY })
                .setOrigin(0, 0.5);

            const colonText = this.add
                .text(colonX, rowY, ":", { fontFamily: "Arial Black", fontSize: 12, color: DARK_NAVY })
                .setOrigin(0, 0.5);

            const valueText = this.add
                .text(valueX, rowY, value, {
                    fontFamily: "Arial",
                    fontSize: 11,
                    color: BODY_TEXT,
                    wordWrap: { width: x + width - 16 - valueX },
                })
                .setOrigin(0, 0.5);

            this.root.add([iconBg, iconText, labelText, colonText, valueText]);
        });

        return height;
    }

    private buildTujuanCard(x: number, y: number, width: number): number {
        const headerHeight = 40;
        const paddingX = 20;
        const paddingY = 14;
        const iconSize = 44;
        const textX = x + paddingX + iconSize + 16;
        const textWidth = width - paddingX * 2 - iconSize - 16;
        const bodyTop = y + headerHeight + paddingY;

        const bodyText = this.add.text(
            textX,
            bodyTop,
            "Membantu taruna memahami komponen struktur kapal serta prinsip stabilitas melalui eksplorasi interaktif dan simulasi yang mendekati kondisi nyata di dunia maritim.",
            {
                fontFamily: "Arial",
                fontSize: 13,
                color: BODY_TEXT,
                lineSpacing: 5,
                wordWrap: { width: textWidth },
            },
        );

        const bodyHeight = Math.max(iconSize, bodyText.height);
        const height = headerHeight + paddingY * 2 + bodyHeight;

        const chrome = createHeaderBarCard(this, x, y, width, height, "TUJUAN PEMBELAJARAN", headerHeight);

        const iconCenterY = bodyTop + bodyHeight / 2;
        const iconBg = this.add.circle(x + paddingX + iconSize / 2, iconCenterY, iconSize / 2, CARD_FILL, 1);
        const icon = this.add
            .text(x + paddingX + iconSize / 2, iconCenterY, "🎯", { fontFamily: "Arial", fontSize: 20 })
            .setOrigin(0.5);

        this.root.add([...chrome, iconBg, icon, bodyText]);
        return height;
    }

    private buildFiturCard(x: number, y: number, width: number): number {
        const headerHeight = 40;
        const paddingX = 20;
        const paddingY = 14;
        const colGap = 16;
        const colWidth = (width - paddingX * 2 - colGap) / 2;
        const iconSize = 40;
        const bodyTop = y + headerHeight + paddingY;

        const items: Array<[string, string, string]> = [
            ["🚢", "Modul Anatomi Struktur", "Eksplorasi bagian-bagian kapal dengan informasi material dan fungsi."],
            [
                "📊",
                "Modul Simulator Stabilitas",
                "Simulasi penataan beban kapal dan perhitungan stabilitas secara interaktif.",
            ],
        ];

        let maxColHeight = iconSize;
        const rendered = items.map(([icon, title, desc], index) => {
            const colX = x + paddingX + index * (colWidth + colGap);
            const textX = colX + iconSize + 12;
            const textWidth = colWidth - iconSize - 12;

            const titleText = this.add.text(textX, bodyTop, title, {
                fontFamily: "Arial Black",
                fontSize: 13,
                color: DARK_NAVY,
                wordWrap: { width: textWidth },
            });
            const descText = this.add.text(textX, bodyTop + titleText.height + 4, desc, {
                fontFamily: "Arial",
                fontSize: 11,
                color: BODY_TEXT,
                lineSpacing: 3,
                wordWrap: { width: textWidth },
            });

            const colHeight = titleText.height + 4 + descText.height;
            maxColHeight = Math.max(maxColHeight, colHeight);

            return { icon, colX, titleText, descText };
        });

        const height = headerHeight + paddingY * 2 + maxColHeight;
        const chrome = createHeaderBarCard(this, x, y, width, height, "FITUR UTAMA", headerHeight);
        this.root.add(chrome);

        const divider = this.add.rectangle(
            x + paddingX + colWidth + colGap / 2,
            bodyTop + maxColHeight / 2,
            1.5,
            maxColHeight,
            BORDER_BLUE,
            1,
        );
        this.root.add(divider);

        rendered.forEach(({ icon, colX, titleText, descText }) => {
            const iconCenterY = bodyTop + maxColHeight / 2;
            const iconBg = this.add.circle(colX + iconSize / 2, iconCenterY, iconSize / 2, CARD_FILL, 1);
            const iconText = this.add
                .text(colX + iconSize / 2, iconCenterY, icon, { fontFamily: "Arial", fontSize: 17 })
                .setOrigin(0.5);
            this.root.add([iconBg, iconText, titleText, descText]);
        });

        return height;
    }

    private buildSumberAsetCard(x: number, y: number, width: number): number {
        const headerHeight = 40;
        const paddingX = 16;
        const paddingY = 12;
        const cols = 3;
        const gapX = 10;
        const gapY = 10;
        const tileWidth = (width - paddingX * 2 - gapX * (cols - 1)) / cols;
        const iconSize = 32;
        const bodyTop = y + headerHeight + paddingY;

        const tiles: Array<[string, string, string]> = [
            ["🖼️", "Ilustrasi & Background", "Custom Illustration\nSayembara Digital SMK"],
            ["👥", "Karakter", "Custom Illustration\nSayembara Digital SMK"],
            ["🧩", "Ikon & UI Element", "Custom Design\nSayembara Digital SMK"],
            ["Aa", "Font", "Plus Jakarta Sans\n(Google Fonts)"],
            ["🎵", "Audio", "Mixkit\n(Free License)"],
            ["📄", "Referensi Materi", "IMO, BKI, dan sumber\npembelajaran maritim terbuka"],
        ];

        let tileContentHeight = 0;
        const measured = tiles.map(([icon, title, subtitle], index) => {
            const col = index % cols;
            const row = Math.floor(index / cols);
            const tileX = x + paddingX + col * (tileWidth + gapX);

            const titleText = this.add
                .text(tileX + tileWidth / 2, 0, title, {
                    fontFamily: "Arial Black",
                    fontSize: 11,
                    color: DARK_NAVY,
                    align: "center",
                    wordWrap: { width: tileWidth - 8 },
                })
                .setOrigin(0.5, 0);
            const subtitleText = this.add
                .text(tileX + tileWidth / 2, 0, subtitle, {
                    fontFamily: "Arial",
                    fontSize: 9,
                    color: BODY_TEXT,
                    align: "center",
                    lineSpacing: 2,
                    wordWrap: { width: tileWidth - 8 },
                })
                .setOrigin(0.5, 0);

            const contentHeight = iconSize + 6 + titleText.height + 4 + subtitleText.height;
            tileContentHeight = Math.max(tileContentHeight, contentHeight);

            return { icon, tileX, row, titleText, subtitleText };
        });

        const rows = Math.ceil(tiles.length / cols);
        const bodyHeight = rows * tileContentHeight + (rows - 1) * gapY;
        const height = headerHeight + paddingY * 2 + bodyHeight;

        const chrome = createHeaderBarCard(this, x, y, width, height, "SUMBER ASET", headerHeight);
        this.root.add(chrome);

        measured.forEach(({ icon, tileX, row, titleText, subtitleText }) => {
            const tileTop = bodyTop + row * (tileContentHeight + gapY);
            const iconCenterY = tileTop + iconSize / 2;
            const iconBg = this.add.circle(tileX + tileWidth / 2, iconCenterY, iconSize / 2, CARD_FILL, 1);
            const iconText = this.add
                .text(tileX + tileWidth / 2, iconCenterY, icon, {
                    fontFamily: icon === "Aa" ? "Arial Black" : "Arial",
                    fontSize: icon === "Aa" ? 12 : 14,
                    color: DARK_NAVY,
                })
                .setOrigin(0.5);

            titleText.setPosition(tileX + tileWidth / 2, tileTop + iconSize + 6);
            subtitleText.setPosition(tileX + tileWidth / 2, tileTop + iconSize + 6 + titleText.height + 4);

            this.root.add([iconBg, iconText, titleText, subtitleText]);
        });

        return height;
    }

    private buildTagline(x: number, width: number, y: number) {
        const rightEdge = x + width;
        const anchorSize = 34;
        const centerY = y + anchorSize / 2;

        const anchorBg = this.add.circle(rightEdge - anchorSize / 2, centerY, anchorSize / 2, PRIMARY_BLUE, 1);
        const anchorIcon = this.add
            .text(rightEdge - anchorSize / 2, centerY, "⚓", { fontFamily: "Arial", fontSize: 16, color: "#ffffff" })
            .setOrigin(0.5);

        const taglineText = this.add
            .text(rightEdge - anchorSize - 12, centerY, "SAFER SEAS\nBRIGHTER FUTURES", {
                fontFamily: "Arial Black",
                fontSize: 13,
                color: PRIMARY_BLUE_HEX,
                align: "right",
                lineSpacing: 2,
            })
            .setOrigin(1, 0.5);

        this.root.add([taglineText, anchorBg, anchorIcon]);
    }

    // ---- Layout -------------------------------------------------------------

    private layout(width: number, height: number) {
        this.background.setPosition(width / 2, height / 2);
        this.background.setDisplaySize(width, height);

        const scale = Math.min(width / DESIGN_WIDTH, height / DESIGN_HEIGHT);
        this.root.setScale(scale);
        const rootX = (width - DESIGN_WIDTH * scale) / 2;
        const rootY = (height - DESIGN_HEIGHT * scale) / 2;
        this.root.setPosition(rootX, rootY);
    }
}
