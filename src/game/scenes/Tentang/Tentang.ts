import { GameObjects, Scale, Scene } from "phaser";

import { createBackButton } from "../../../component/ModuleHeader/ModuleHeader";
import { BODY_TEXT, DARK_NAVY, PRIMARY_BLUE, PRIMARY_BLUE_HEX } from "../../../component/ModulePanel/ModulePanel";
import { playSceneEnter, playSceneExit, trackGroup } from "../../../component/SceneTransition";
import { EventBus } from "../../EventBus";

// Authored at a fixed reference resolution and uniformly scaled to fit the
// window, same approach as the other module scenes.
const DESIGN_WIDTH = 1536;
const DESIGN_HEIGHT = 1060;
const MARGIN = 40;

const CARD_X = MARGIN;
const CARD_Y = 140;
const CARD_WIDTH = DESIGN_WIDTH - MARGIN * 2;
const CARD_HEIGHT = 460;

/**
 * A single-panel "Tentang" (about) info page — developer profile, asset
 * credits, and bibliography — reached from MainMenu's Tentang button.
 * Purely informational: no interactive gameplay of its own.
 */
export class Tentang extends Scene {
    private background!: GameObjects.Image;
    private root!: GameObjects.Container;
    private transitionGroups: GameObjects.GameObject[][] = [];

    constructor() {
        super("Tentang");
    }

    create() {
        this.background = this.add.image(0, 0, "AnatomiStructure.background");
        this.root = this.add.container(0, 0);

        const groups: GameObjects.GameObject[][] = [];
        trackGroup(this.root, groups, () => this.buildTopBar());
        trackGroup(this.root, groups, () => this.buildContentCard());
        this.transitionGroups = groups;

        this.layout(this.scale.width, this.scale.height);
        this.scale.on(Scale.Events.RESIZE, this.handleResize, this);
        playSceneEnter(this, groups);

        EventBus.emit("current-scene-ready", this);

        this.events.once("shutdown", () => {
            this.scale.off(Scale.Events.RESIZE, this.handleResize, this);
        });
    }

    private handleResize(gameSize: Phaser.Structs.Size) {
        this.layout(gameSize.width, gameSize.height);
    }

    private goTo(sceneKey: string) {
        playSceneExit(this, this.transitionGroups, () => this.scene.start(sceneKey));
    }

    // ---- Title + back button --------------------------------------------------

    private buildTopBar() {
        const backButton = createBackButton(this, MARGIN, 40, () => this.goTo("MainMenu"));

        const title = this.add
            .text(DESIGN_WIDTH / 2, 67, "TENTANG", {
                fontFamily: "Arial Black",
                fontSize: 32,
                color: DARK_NAVY,
            })
            .setOrigin(0.5);

        this.root.add([backButton, title]);
    }

    // ---- Content card -----------------------------------------------------------

    private buildContentCard() {
        const card = this.add.graphics();
        card.fillStyle(0xffffff, 1);
        card.fillRoundedRect(CARD_X, CARD_Y, CARD_WIDTH, CARD_HEIGHT, 20);
        card.lineStyle(2, PRIMARY_BLUE, 0.9);
        card.strokeRoundedRect(CARD_X, CARD_Y, CARD_WIDTH, CARD_HEIGHT, 20);
        this.root.add(card);

        const paddingX = 36;
        const paddingY = 32;
        const textX = CARD_X + paddingX;
        const textWidth = CARD_WIDTH - paddingX * 2;

        let cursorY = CARD_Y + paddingY;
        cursorY += this.buildProfilPengembang(textX, cursorY, textWidth) + 28;
        cursorY += this.buildLabeledParagraph(textX, cursorY, textWidth, "Aset gambar", "Ilustrasi, karakter, dan ikon dibuat dengan bantuan ChatGPT (OpenAI).") + 28;
        cursorY += this.buildLabeledParagraph(textX, cursorY, textWidth, "Music", "Pixabay — pixabay.com (Free License)") + 28;
        this.buildDaftarPustaka(textX, cursorY, textWidth);
    }

    private buildProfilPengembang(x: number, y: number, width: number): number {
        const header = this.add.text(x, y, "Profil Pengembang :", {
            fontFamily: "Arial Black",
            fontSize: 17,
            color: PRIMARY_BLUE_HEX,
        });

        const rows: Array<[string, string]> = [
            ["Nama", "Sayembara Digital SMK"],
            ["Mata Pelajaran", "Nautika Kapal Niaga"],
            ["Instansi", "Sayembara Digital SMK"],
            ["Surel", "-"],
            ["Tahun Pembuatan", "2026"],
        ];

        const rowHeight = 26;
        const rowsTop = y + header.height + 12;
        const labelWidth = 170;

        rows.forEach(([label, value], index) => {
            const rowY = rowsTop + index * rowHeight;
            const labelText = this.add.text(x, rowY, label, {
                fontFamily: "Arial Black",
                fontSize: 14,
                color: DARK_NAVY,
            });
            const colonText = this.add.text(x + labelWidth, rowY, ":", {
                fontFamily: "Arial Black",
                fontSize: 14,
                color: DARK_NAVY,
            });
            const valueText = this.add.text(x + labelWidth + 16, rowY, value, {
                fontFamily: "Arial",
                fontSize: 14,
                color: BODY_TEXT,
                wordWrap: { width: width - labelWidth - 16 },
            });
            this.root.add([labelText, colonText, valueText]);
        });

        this.root.add(header);
        return header.height + 12 + rows.length * rowHeight;
    }

    private buildLabeledParagraph(x: number, y: number, width: number, label: string, body: string): number {
        const header = this.add.text(x, y, `${label} :`, {
            fontFamily: "Arial Black",
            fontSize: 17,
            color: PRIMARY_BLUE_HEX,
        });

        const bodyText = this.add.text(x, y + header.height + 10, body, {
            fontFamily: "Arial",
            fontSize: 14,
            color: BODY_TEXT,
            lineSpacing: 4,
            wordWrap: { width },
        });

        this.root.add([header, bodyText]);
        return header.height + 10 + bodyText.height;
    }

    private buildDaftarPustaka(x: number, y: number, width: number) {
        const header = this.add.text(x, y, "Daftar Pustaka", {
            fontFamily: "Arial Black",
            fontSize: 17,
            color: PRIMARY_BLUE_HEX,
        });

        const bodyText = this.add.text(
            x,
            y + header.height + 10,
            "Referensi materi mengacu pada standar International Maritime Organization (IMO), Biro Klasifikasi Indonesia (BKI), dan sumber pembelajaran maritim terbuka lainnya.",
            {
                fontFamily: "Arial",
                fontSize: 14,
                color: BODY_TEXT,
                lineSpacing: 4,
                wordWrap: { width },
            },
        );

        this.root.add([header, bodyText]);
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
