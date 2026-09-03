import { Actions, GameObjects, Scale, Scene } from "phaser";

import { ModuleHeader } from "../../../component/ModuleHeader/ModuleHeader";
import {
    BODY_TEXT,
    BORDER_BLUE,
    DARK_NAVY,
    PRIMARY_BLUE,
    PRIMARY_BLUE_HEX,
    PURPLE,
    PURPLE_TEXT,
    createFloatingTabCard,
    createHeaderBarCard,
} from "../../../component/ModulePanel/ModulePanel";
import { SceneProgressFooter } from "../../../component/SceneProgressFooter/SceneProgressFooter";
import { EventBus } from "../../EventBus";

interface CargoType {
    label: string;
    color: number;
    weight: number;
}

const CARGO_TYPES: CargoType[] = [
    { label: "5 TON", color: 0x8a97a8, weight: 5 },
    { label: "10 TON", color: 0x2f68d8, weight: 10 },
    { label: "15 TON", color: 0xc0392b, weight: 15 },
    { label: "20 TON", color: 0xd68a1f, weight: 20 },
    { label: "25 TON", color: 0x3f9a5c, weight: 25 },
];

type ZoneKey = "geladak-atas" | "palka-bawah";

interface PlacedCargo {
    id: number;
    cargo: CargoType;
}

interface DropZoneState {
    key: ZoneKey;
    x: number;
    y: number;
    width: number;
    height: number;
    contentContainer: GameObjects.Container;
    placeholderIcon: GameObjects.Graphics;
    placeholderText: GameObjects.Text;
    items: PlacedCargo[];
}

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

    private sideView!: GameObjects.Container;
    private topView!: GameObjects.Container;
    private sideViewButtonBg!: GameObjects.Graphics;
    private topViewButtonBg!: GameObjects.Graphics;
    private sideViewButtonText!: GameObjects.Text;
    private topViewButtonText!: GameObjects.Text;

    private feedbackText!: GameObjects.Text;
    private gmInput!: HTMLInputElement;

    // ---- Drag & drop state --------------------------------------------
    private zones: Record<ZoneKey, DropZoneState> = {} as Record<ZoneKey, DropZoneState>;
    private nextCargoId = 0;
    private dragGhost: GameObjects.Container | null = null;
    private draggedCargo: CargoType | null = null;
    private currentScale = 1;
    private currentRootX = 0;
    private currentRootY = 0;

    private stabilPillBg!: GameObjects.Graphics;
    private stabilPillBounds!: { x: number; y: number; width: number };
    private stabilPillText!: GameObjects.Text;
    private sudutOlengText!: GameObjects.Text;

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
        this.buildGmInput();
        this.updateStability();

        this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
            this.updateDragGhost(pointer);
        });
        this.input.on("pointerup", (pointer: Phaser.Input.Pointer) => {
            this.endDrag(pointer);
        });

        this.layout(this.scale.width, this.scale.height);
        this.scale.on(Scale.Events.RESIZE, this.handleResize, this);

        EventBus.emit("current-scene-ready", this);

        this.events.once("shutdown", () => {
            this.scale.off(Scale.Events.RESIZE, this.handleResize, this);
            this.gmInput.remove();
        });
    }

    private handleResize(gameSize: Phaser.Structs.Size) {
        this.layout(gameSize.width, gameSize.height);
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
            onBack: () => this.scene.start("MainMenu"),
        });
        this.root.add(header.view);
    }

    // ---- Left card: ship + drop zones + cargo palette ---------------------

    private buildCargoCard() {
        const x = MARGIN;
        const y = 310;
        const width = LEFT_COLUMN_WIDTH;
        const height = 610;

        this.root.add(
            createFloatingTabCard(
                this,
                x,
                y,
                width,
                height,
                "RUANG PALKA & PENEMPATAN KARGO",
            ),
        );

        this.sideView = this.createShipSideView();
        this.sideView.setPosition(x + width / 2, 480);
        this.root.add(this.sideView);

        this.topView = this.createShipTopView();
        this.topView.setPosition(x + width / 2, 480);
        this.topView.setVisible(false);
        this.root.add(this.topView);

        this.buildViewToggle(x + 24, 350);

        this.buildDropZone("geladak-atas", x + 24, 592, width - 48, "GELADAK ATAS");
        this.buildDropZone("palka-bawah", x + 24, 678, width - 48, "PALKA BAWAH");

        this.root.add(
            this.add.text(x + 24, 776, "KARGO YANG TERSEDIA", {
                fontFamily: "Arial Black",
                fontSize: 14,
                color: DARK_NAVY,
            }),
        );

        this.buildCargoPalette(x + 24, 800, width - 48);
    }

    private buildViewToggle(x: number, y: number) {
        const buttonWidth = 150;
        const buttonHeight = 36;
        const gap = 12;

        this.sideViewButtonBg = this.add.graphics();
        this.sideViewButtonText = this.add
            .text(x + buttonWidth / 2, y + buttonHeight / 2, "Tampak Samping", {
                fontFamily: "Arial Black",
                fontSize: 13,
                color: "#ffffff",
            })
            .setOrigin(0.5);

        this.topViewButtonBg = this.add.graphics();
        this.topViewButtonText = this.add
            .text(
                x + buttonWidth + gap + buttonWidth / 2,
                y + buttonHeight / 2,
                "Tampak Atas",
                {
                    fontFamily: "Arial Black",
                    fontSize: 13,
                    color: PRIMARY_BLUE_HEX,
                },
            )
            .setOrigin(0.5);

        const sideHit = this.add
            .rectangle(x, y, buttonWidth, buttonHeight, 0xffffff, 0)
            .setOrigin(0, 0)
            .setInteractive({ useHandCursor: true });
        const topHit = this.add
            .rectangle(x + buttonWidth + gap, y, buttonWidth, buttonHeight, 0xffffff, 0)
            .setOrigin(0, 0)
            .setInteractive({ useHandCursor: true });

        const drawToggle = (showSide: boolean) => {
            this.sideViewButtonBg.clear();
            this.sideViewButtonBg.fillStyle(
                showSide ? PRIMARY_BLUE : 0xffffff,
                1,
            );
            this.sideViewButtonBg.fillRoundedRect(
                x,
                y,
                buttonWidth,
                buttonHeight,
                buttonHeight / 2,
            );
            if (!showSide) {
                this.sideViewButtonBg.lineStyle(2, PRIMARY_BLUE, 0.6);
                this.sideViewButtonBg.strokeRoundedRect(
                    x,
                    y,
                    buttonWidth,
                    buttonHeight,
                    buttonHeight / 2,
                );
            }
            this.sideViewButtonText.setColor(showSide ? "#ffffff" : PRIMARY_BLUE_HEX);

            const topX = x + buttonWidth + gap;
            this.topViewButtonBg.clear();
            this.topViewButtonBg.fillStyle(!showSide ? PRIMARY_BLUE : 0xffffff, 1);
            this.topViewButtonBg.fillRoundedRect(
                topX,
                y,
                buttonWidth,
                buttonHeight,
                buttonHeight / 2,
            );
            if (showSide) {
                this.topViewButtonBg.lineStyle(2, PRIMARY_BLUE, 0.6);
                this.topViewButtonBg.strokeRoundedRect(
                    topX,
                    y,
                    buttonWidth,
                    buttonHeight,
                    buttonHeight / 2,
                );
            }
            this.topViewButtonText.setColor(!showSide ? "#ffffff" : PRIMARY_BLUE_HEX);

            this.sideView.setVisible(showSide);
            this.topView.setVisible(!showSide);
        };

        sideHit.on("pointerdown", () => drawToggle(true));
        topHit.on("pointerdown", () => drawToggle(false));
        drawToggle(true);

        this.root.add([
            this.sideViewButtonBg,
            this.topViewButtonBg,
            this.sideViewButtonText,
            this.topViewButtonText,
            sideHit,
            topHit,
        ]);
    }

    /** A cargo ship, side profile — hull, bridge, mast, containers, clouds. */
    private createShipSideView() {
        const container = this.add.container(0, 0);
        const g = this.add.graphics();

        // Clouds.
        g.fillStyle(0xe4eefb, 1);
        [-330, -180].forEach((cx) => {
            g.fillEllipse(cx, -70, 70, 26);
            g.fillEllipse(cx + 26, -78, 46, 22);
        });

        // Hull.
        g.fillStyle(0x143a84, 1);
        g.beginPath();
        g.moveTo(-360, 30);
        g.lineTo(360, 30);
        g.lineTo(330, 70);
        g.lineTo(-330, 70);
        g.closePath();
        g.fillPath();

        g.fillStyle(0xc0392b, 1);
        g.fillRect(-330, 70, 660, 14);

        // Bridge / superstructure.
        g.fillStyle(0xf3f7fc, 1);
        g.fillRect(-320, -60, 110, 90);
        g.lineStyle(2, 0xb9c8e0, 1);
        g.strokeRect(-320, -60, 110, 90);

        g.fillStyle(0x2c8fb8, 0.85);
        [0, 1, 2].forEach((row) => {
            [0, 1, 2].forEach((col) => {
                g.fillRect(-300 + col * 30, -44 + row * 26, 16, 16);
            });
        });

        g.fillStyle(0x334155, 1);
        g.fillRect(-300, -92, 20, 34);

        container.add(g);

        // Mast.
        const mast = this.add.graphics();
        mast.lineStyle(4, 0x334155, 1);
        mast.lineBetween(300, 30, 300, -80);
        mast.lineBetween(288, -60, 312, -60);
        container.add(mast);

        // Containers on deck.
        const containerColors = [0x2f68d8, 0x8a97a8, 0xc0392b, 0xd68a1f, 0xb0762f, 0x2f68d8];
        containerColors.forEach((color, index) => {
            const cx = -160 + index * 62;
            const box = this.add
                .rectangle(cx, -8, 54, 44, color, 1)
                .setStrokeStyle(2, 0x0000000, 0.15);
            container.add(box);
        });

        return container;
    }

    /** Placeholder top-down deck outline; full top-view detail comes later. */
    private createShipTopView() {
        const container = this.add.container(0, 0);
        const g = this.add.graphics();

        g.fillStyle(0xeaf3ff, 1);
        g.lineStyle(3, PRIMARY_BLUE, 0.8);
        g.fillRoundedRect(-330, -70, 660, 140, 30);
        g.strokeRoundedRect(-330, -70, 660, 140, 30);

        g.lineStyle(1.5, PRIMARY_BLUE, 0.35);
        for (let gx = -300; gx <= 300; gx += 60) {
            g.lineBetween(gx, -65, gx, 65);
        }
        for (let gy = -50; gy <= 50; gy += 25) {
            g.lineBetween(-320, gy, 320, gy);
        }

        container.add(g);
        container.add(
            this.add
                .text(0, 0, "Tampak Atas", {
                    fontFamily: "Arial Black",
                    fontSize: 16,
                    color: PRIMARY_BLUE_HEX,
                })
                .setOrigin(0.5),
        );

        return container;
    }

    private buildDropZone(
        key: ZoneKey,
        x: number,
        y: number,
        width: number,
        label: string,
    ) {
        const boxHeight = 54;
        const boxY = y + 20;

        this.root.add(
            this.add.text(x, y, label, {
                fontFamily: "Arial Black",
                fontSize: 13,
                color: DARK_NAVY,
            }),
        );

        const box = this.add.graphics();
        box.fillStyle(0xeaf3ff, 0.8);
        box.fillRoundedRect(x, boxY, width, boxHeight, 12);
        box.lineStyle(2, PRIMARY_BLUE, 0.5);
        for (let dashX = x; dashX < x + width; dashX += 14) {
            box.lineBetween(
                Math.min(dashX + 7, x + width),
                boxY,
                Math.min(dashX + 7, x + width),
                boxY,
            );
        }
        box.strokeRoundedRect(x, boxY, width, boxHeight, 12);
        this.root.add(box);

        // Download-style icon: a downward arrow over a tray line.
        const iconX = x + width / 2 - 90;
        const iconY = boxY + boxHeight / 2;
        const placeholderIcon = this.add.graphics();
        placeholderIcon.fillStyle(PRIMARY_BLUE, 0.8);
        placeholderIcon.beginPath();
        placeholderIcon.moveTo(iconX, iconY + 8);
        placeholderIcon.lineTo(iconX - 7, iconY - 2);
        placeholderIcon.lineTo(iconX - 2, iconY - 2);
        placeholderIcon.lineTo(iconX - 2, iconY - 10);
        placeholderIcon.lineTo(iconX + 2, iconY - 10);
        placeholderIcon.lineTo(iconX + 2, iconY - 2);
        placeholderIcon.lineTo(iconX + 7, iconY - 2);
        placeholderIcon.closePath();
        placeholderIcon.fillPath();
        this.root.add(placeholderIcon);

        const placeholderText = this.add
            .text(iconX + 18, iconY, "Drag & Drop Kargo di sini", {
                fontFamily: "Arial",
                fontSize: 14,
                color: BODY_TEXT,
            })
            .setOrigin(0, 0.5);
        this.root.add(placeholderText);

        const contentContainer = this.add.container(0, 0);
        this.root.add(contentContainer);

        this.zones[key] = {
            key,
            x,
            y: boxY,
            width,
            height: boxHeight,
            contentContainer,
            placeholderIcon,
            placeholderText,
            items: [],
        };
    }

    private buildCargoPalette(x: number, y: number, width: number) {
        const cardWidth = (width - 24 * (CARGO_TYPES.length - 1)) / CARGO_TYPES.length;
        const cardHeight = 90;

        CARGO_TYPES.forEach((cargo, index) => {
            const cardX = x + index * (cardWidth + 24);

            const bg = this.add
                .rectangle(cardX, y, cardWidth, cardHeight, 0xffffff, 1)
                .setOrigin(0, 0)
                .setStrokeStyle(2, BORDER_BLUE, 1)
                .setInteractive({ useHandCursor: true });

            const box = this.add
                .rectangle(cardX + cardWidth / 2, y + 32, cardWidth - 40, 34, cargo.color, 1)
                .setStrokeStyle(2, 0x00000, 0.15);

            const label = this.add
                .text(cardX + cardWidth / 2, y + 66, cargo.label, {
                    fontFamily: "Arial Black",
                    fontSize: 13,
                    color: DARK_NAVY,
                })
                .setOrigin(0.5);

            bg.on("pointerover", () => {
                this.tweens.killTweensOf(bg);
                this.tweens.add({ targets: bg, scaleX: 1.04, scaleY: 1.04, duration: 120 });
            });
            bg.on("pointerout", () => {
                this.tweens.killTweensOf(bg);
                this.tweens.add({ targets: bg, scaleX: 1, scaleY: 1, duration: 120 });
            });
            bg.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
                this.startDrag(cargo, pointer);
            });

            this.root.add([bg, box, label]);
        });
    }

    // ---- Drag & drop -----------------------------------------------------

    /** Cargo picked up from the palette follows the raw pointer (screen
     * space) via a top-level ghost, independent of the scaled `root`. */
    private startDrag(cargo: CargoType, pointer: Phaser.Input.Pointer) {
        this.draggedCargo = cargo;

        const ghostWidth = 90 * this.currentScale;
        const ghostHeight = 50 * this.currentScale;

        const box = this.add
            .rectangle(0, 0, ghostWidth, ghostHeight, cargo.color, 0.92)
            .setStrokeStyle(2, 0x000000, 0.2);
        const label = this.add
            .text(0, 0, cargo.label, {
                fontFamily: "Arial Black",
                fontSize: Math.max(10, 13 * this.currentScale),
                color: "#ffffff",
            })
            .setOrigin(0.5);

        this.dragGhost = this.add.container(pointer.x, pointer.y, [box, label]);
        this.dragGhost.setDepth(1000);
        this.dragGhost.setAlpha(0.9);
    }

    private updateDragGhost(pointer: Phaser.Input.Pointer) {
        if (this.dragGhost) {
            this.dragGhost.setPosition(pointer.x, pointer.y);
        }
    }

    private endDrag(pointer: Phaser.Input.Pointer) {
        const cargo = this.draggedCargo;

        if (this.dragGhost) {
            this.dragGhost.destroy();
            this.dragGhost = null;
        }

        this.draggedCargo = null;

        if (!cargo) {
            return;
        }

        const zoneKey = this.findZoneAt(pointer.x, pointer.y);

        if (zoneKey) {
            this.placeCargo(zoneKey, cargo);
        }
    }

    /** Hit-tests the raw pointer against each zone's screen-space rect,
     * converted from design-space using the current root scale/offset. */
    private findZoneAt(pointerX: number, pointerY: number): ZoneKey | null {
        for (const key of Object.keys(this.zones) as ZoneKey[]) {
            const zone = this.zones[key];
            const screenX = this.currentRootX + zone.x * this.currentScale;
            const screenY = this.currentRootY + zone.y * this.currentScale;
            const screenWidth = zone.width * this.currentScale;
            const screenHeight = zone.height * this.currentScale;

            if (
                pointerX >= screenX &&
                pointerX <= screenX + screenWidth &&
                pointerY >= screenY &&
                pointerY <= screenY + screenHeight
            ) {
                return key;
            }
        }

        return null;
    }

    private placeCargo(zoneKey: ZoneKey, cargo: CargoType) {
        const zone = this.zones[zoneKey];
        zone.items.push({ id: this.nextCargoId++, cargo });
        this.relayoutZone(zoneKey);
        this.updateStability();
    }

    private removeCargo(zoneKey: ZoneKey, itemId: number) {
        const zone = this.zones[zoneKey];
        zone.items = zone.items.filter((item) => item.id !== itemId);
        this.relayoutZone(zoneKey);
        this.updateStability();
    }

    /** Redraws the small removable chips for everything currently placed
     * in a zone, wrapping into rows as needed, and toggles the empty-state
     * placeholder. */
    private relayoutZone(zoneKey: ZoneKey) {
        const zone = this.zones[zoneKey];
        zone.contentContainer.removeAll(true);

        const isEmpty = zone.items.length === 0;
        zone.placeholderIcon.setVisible(isEmpty);
        zone.placeholderText.setVisible(isEmpty);

        const chipWidth = 84;
        const chipHeight = 34;
        const gap = 8;
        const paddingX = 12;
        const perRow = Math.max(1, Math.floor((zone.width - paddingX * 2 + gap) / (chipWidth + gap)));

        zone.items.forEach((item, index) => {
            const row = Math.floor(index / perRow);
            const col = index % perRow;
            const chipX = zone.x + paddingX + col * (chipWidth + gap);
            const chipY = zone.y + 10 + row * (chipHeight + gap);

            const chipBg = this.add
                .rectangle(chipX, chipY, chipWidth, chipHeight, item.cargo.color, 1)
                .setOrigin(0, 0)
                .setStrokeStyle(2, 0x000000, 0.15)
                .setInteractive({ useHandCursor: true });

            const chipLabel = this.add
                .text(chipX + chipWidth / 2 - 6, chipY + chipHeight / 2, item.cargo.label, {
                    fontFamily: "Arial Black",
                    fontSize: 11,
                    color: "#ffffff",
                })
                .setOrigin(0.5);

            const removeMark = this.add
                .text(chipX + chipWidth - 12, chipY + chipHeight / 2, "×", {
                    fontFamily: "Arial Black",
                    fontSize: 15,
                    color: "#ffffff",
                })
                .setOrigin(0.5);

            chipBg.on("pointerdown", (pointer: Phaser.Input.Pointer, x: number, y: number, event: Phaser.Types.Input.EventData) => {
                event.stopPropagation();
                this.removeCargo(zoneKey, item.id);
            });
            chipBg.on("pointerover", () => chipBg.setFillStyle(0xd9534f, 1));
            chipBg.on("pointerout", () => chipBg.setFillStyle(item.cargo.color, 1));

            zone.contentContainer.add([chipBg, chipLabel, removeMark]);
        });
    }

    /** Illustrative (not physically accurate) stability feedback: too much
     * weight on the upper deck relative to the lower hold tilts the ship
     * and flips the status to unstable — this is the "oleng" behaviour
     * from the spec. */
    private updateStability() {
        const upperWeight = this.zones["geladak-atas"].items.reduce(
            (sum, item) => sum + item.cargo.weight,
            0,
        );
        const lowerWeight = this.zones["palka-bawah"].items.reduce(
            (sum, item) => sum + item.cargo.weight,
            0,
        );

        const imbalance = upperWeight - lowerWeight;
        const listAngle = Phaser.Math.Clamp(imbalance * 0.12, -25, 25);
        const isStable = listAngle <= 5;

        this.stabilPillBg.clear();
        this.stabilPillBg.fillStyle(isStable ? 0xdcf3e3 : 0xfbe0df, 1);
        this.stabilPillBg.fillRoundedRect(
            this.stabilPillBounds.x,
            this.stabilPillBounds.y,
            this.stabilPillBounds.width,
            26,
            13,
        );
        this.stabilPillText.setText(isStable ? "STABIL" : "OLENG");
        this.stabilPillText.setColor(isStable ? "#1f8d52" : "#c0392b");

        this.sudutOlengText.setText(
            `${listAngle.toFixed(1)}° (${isStable ? "Stabil" : "Waspada"})`,
        );
        this.sudutOlengText.setColor(isStable ? DARK_NAVY : "#c0392b");

        this.tweens.add({
            targets: this.sideView,
            angle: isStable ? listAngle * 0.4 : listAngle * 0.8,
            duration: 300,
            ease: "Quad.Out",
        });
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
        this.buildGraphCard();
        this.buildGmCard();
        this.buildTipsCard();
    }

    private buildGraphCard() {
        const x = RIGHT_COLUMN_X;
        const y = 130;
        const width = RIGHT_COLUMN_WIDTH;
        const height = 480;
        const headerHeight = 48;

        this.root.add(
            createHeaderBarCard(this, x, y, width, height, "GRAFIK STABILITAS", headerHeight),
        );

        // Plot area, in design-space pixels.
        const plotX0 = x + 54;
        const plotX1 = x + width - 24;
        const plotY0 = y + headerHeight + 56;
        const plotY1 = y + height - 96;

        const dataToPixel = (dataX: number, dataY: number) => ({
            px: plotX0 + ((dataX + 20) / 40) * (plotX1 - plotX0),
            py: plotY0 + ((20 - dataY) / 25) * (plotY1 - plotY0),
        });

        const graph = this.add.graphics();

        // Axes.
        const originPx = dataToPixel(0, 0);
        graph.lineStyle(1.5, 0xb9c8e0, 1);
        graph.lineBetween(plotX0, originPx.py, plotX1, originPx.py);
        graph.lineBetween(originPx.px, plotY0, originPx.px, plotY1);

        // Ticks.
        for (let dataX = -20; dataX <= 20; dataX += 5) {
            const { px } = dataToPixel(dataX, 0);
            const label = this.add
                .text(px, plotY1 + 10, String(dataX), {
                    fontFamily: "Arial",
                    fontSize: 11,
                    color: BODY_TEXT,
                })
                .setOrigin(0.5, 0);
            this.root.add(label);
        }
        for (let dataY = -5; dataY <= 20; dataY += 5) {
            const { py } = dataToPixel(-20, dataY);
            const label = this.add
                .text(plotX0 - 10, py, String(dataY), {
                    fontFamily: "Arial",
                    fontSize: 11,
                    color: BODY_TEXT,
                })
                .setOrigin(1, 0.5);
            this.root.add(label);
        }

        // Stability curve — a static example shape; recomputing this from
        // the actual loaded cargo isn't wired up yet.
        graph.lineStyle(3, PRIMARY_BLUE, 1);
        graph.beginPath();
        for (let dataX = -20; dataX <= 20; dataX += 1) {
            const dataY = 15 - 0.05 * dataX * dataX;
            const { px, py } = dataToPixel(dataX, dataY);
            if (dataX === -20) {
                graph.moveTo(px, py);
            } else {
                graph.lineTo(px, py);
            }
        }
        graph.strokePath();

        // M / G / B points, stacked at x=0.
        const points = [
            { key: "M", label: "M (Metacenter)", dataY: 15, color: 0x2aa658 },
            { key: "G", label: "G (Center of Gravity)", dataY: 5, color: 0x2f68d8 },
            { key: "B", label: "B (Center of Buoyancy)", dataY: 0, color: PURPLE },
        ];

        graph.lineStyle(1.5, 0xb9c8e0, 0.9);
        const topPx = dataToPixel(0, 20);
        const bottomPx = dataToPixel(0, -5);
        graph.lineBetween(topPx.px, topPx.py, bottomPx.px, bottomPx.py);

        points.forEach((point) => {
            const { px, py } = dataToPixel(0, point.dataY);
            graph.fillStyle(point.color, 1);
            graph.fillCircle(px, py, 7);

            const label = this.add
                .text(px + 12, py - 14, point.key, {
                    fontFamily: "Arial Black",
                    fontSize: 14,
                    color: `#${point.color.toString(16).padStart(6, "0")}`,
                })
                .setOrigin(0, 0.5);
            this.root.add(label);
        });

        this.root.add(graph);

        // Axis captions.
        this.root.add(
            this.add.text(plotX0, y + headerHeight + 16, "Tinggi (m)", {
                fontFamily: "Arial",
                fontSize: 12,
                color: BODY_TEXT,
            }),
        );
        this.root.add(
            this.add
                .text(plotX1, plotY1 + 28, "Jarak Melintang (m)", {
                    fontFamily: "Arial",
                    fontSize: 12,
                    color: BODY_TEXT,
                })
                .setOrigin(1, 0),
        );

        // Legend, top-right of the plot.
        points
            .slice()
            .reverse()
            .forEach((point, index) => {
                const legendY = y + headerHeight + 16 + index * 22;
                const dot = this.add.circle(plotX1 - 150, legendY, 5, point.color, 1);
                const label = this.add
                    .text(plotX1 - 138, legendY, point.label, {
                        fontFamily: "Arial",
                        fontSize: 12,
                        color: DARK_NAVY,
                    })
                    .setOrigin(0, 0.5);
                this.root.add([dot, label]);
            });

        // Status row: Kondisi Stabilitas / Sudut Oleng — live values driven
        // by whatever cargo is currently placed (see updateStability()).
        const statusY = y + height - 46;
        const statusDivider = x + width / 2;

        this.root.add(
            this.add.text(x + 24, statusY, "Kondisi Stabilitas", {
                fontFamily: "Arial",
                fontSize: 13,
                color: BODY_TEXT,
            }),
        );
        const stabilPillWidth = 74;
        this.stabilPillBounds = { x: x + 150, y: statusY - 12, width: stabilPillWidth };
        this.stabilPillBg = this.add.graphics();
        this.root.add(this.stabilPillBg);
        this.stabilPillText = this.add
            .text(x + 150 + stabilPillWidth / 2, statusY, "STABIL", {
                fontFamily: "Arial Black",
                fontSize: 12,
                color: "#1f8d52",
            })
            .setOrigin(0.5);
        this.root.add(this.stabilPillText);

        this.root.add(
            this.add.text(statusDivider + 20, statusY, "Sudut Oleng", {
                fontFamily: "Arial",
                fontSize: 13,
                color: BODY_TEXT,
            }),
        );
        this.sudutOlengText = this.add
            .text(x + width - 24, statusY, "0.0° (Stabil)", {
                fontFamily: "Arial Black",
                fontSize: 13,
                color: DARK_NAVY,
            })
            .setOrigin(1, 0.5);
        this.root.add(this.sudutOlengText);
    }

    private buildGmCard() {
        const x = RIGHT_COLUMN_X;
        const y = 634;
        const width = RIGHT_COLUMN_WIDTH;
        const height = 230;
        const headerHeight = 48;

        this.root.add(
            createHeaderBarCard(this, x, y, width, height, "PERHITUNGAN GM", headerHeight),
        );

        const contentX = x + 24;
        let contentY = y + headerHeight + 32;

        this.root.add(
            this.add.text(contentX, contentY, "GM = KM - KG", {
                fontFamily: "Arial Black",
                fontSize: 19,
                color: DARK_NAVY,
            }),
        );

        contentY += 48;

        const fieldWidth = 96;
        const fieldHeight = 40;

        const drawField = (fx: number, fy: number, label: string, value: string) => {
            this.root.add(
                this.add.text(fx, fy, label, {
                    fontFamily: "Arial",
                    fontSize: 12,
                    color: BODY_TEXT,
                }),
            );
            const box = this.add.graphics();
            box.fillStyle(0xf3f7fc, 1);
            box.fillRoundedRect(fx, fy + 18, fieldWidth, fieldHeight, 8);
            box.lineStyle(2, BORDER_BLUE, 1);
            box.strokeRoundedRect(fx, fy + 18, fieldWidth, fieldHeight, 8);
            this.root.add(box);
            this.root.add(
                this.add
                    .text(fx + fieldWidth / 2, fy + 18 + fieldHeight / 2, value, {
                        fontFamily: "Arial Black",
                        fontSize: 15,
                        color: DARK_NAVY,
                    })
                    .setOrigin(0.5),
            );
        };

        drawField(contentX, contentY, "KM (m)", "8.20");
        drawField(contentX + fieldWidth + 34, contentY, "KG (m)", "5.35");

        const arrowX = contentX + fieldWidth * 2 + 34 + 28;
        const arrowY = contentY + 18 + fieldHeight / 2;
        const arrow = this.add.graphics();
        arrow.fillStyle(PRIMARY_BLUE, 1);
        arrow.beginPath();
        arrow.moveTo(arrowX + 12, arrowY);
        arrow.lineTo(arrowX, arrowY - 6);
        arrow.lineTo(arrowX, arrowY + 6);
        arrow.closePath();
        arrow.fillPath();
        arrow.fillRect(arrowX - 12, arrowY - 2, 12, 4);
        this.root.add(arrow);

        const gmFieldX = arrowX + 24;
        this.root.add(
            this.add.text(gmFieldX, contentY, "GM (m)", {
                fontFamily: "Arial",
                fontSize: 12,
                color: BODY_TEXT,
            }),
        );

        this.gmFieldPosition = { x: gmFieldX, y: contentY + 18, width: 128, height: fieldHeight };

        // Stability Auditor mini-card.
        const auditorX = x + width - 150;
        const auditorY = y + headerHeight + 24;
        const auditorBg = this.add.graphics();
        auditorBg.fillStyle(0xf3f0fc, 1);
        auditorBg.lineStyle(2, PURPLE, 0.5);
        auditorBg.fillRoundedRect(auditorX, auditorY, 150, 96, 14);
        auditorBg.strokeRoundedRect(auditorX, auditorY, 150, 96, 14);
        this.root.add(auditorBg);

        const avatarRadius = 20;
        const avatarX = auditorX + 30;
        const avatarY = auditorY + 30;
        const avatarCircle = this.add
            .circle(avatarX, avatarY, avatarRadius, 0xe8f2ff, 1)
            .setStrokeStyle(2, PURPLE, 0.6);
        const avatar = this.add
            .image(avatarX, avatarY, "profile.human")
            .setDisplaySize(avatarRadius * 2, avatarRadius * 2);
        Actions.AddMaskShape(avatar, { shape: "circle", useInternal: true });
        this.root.add([avatarCircle, avatar]);

        this.root.add(
            this.add.text(auditorX + 12, auditorY + 56, "Stability Auditor", {
                fontFamily: "Arial Black",
                fontSize: 12,
                color: PURPLE_TEXT,
            }),
        );
        this.root.add(
            this.add.text(
                auditorX + 12,
                auditorY + 72,
                "Masukkan hasil GM untuk\nvalidasi stabilitas kapal.",
                {
                    fontFamily: "Arial",
                    fontSize: 10,
                    color: BODY_TEXT,
                    lineSpacing: 3,
                },
            ),
        );

        // Validate button + feedback.
        const buttonY = contentY + 18 + fieldHeight + 24;
        const buttonWidth = width - 48;
        const buttonHeight = 44;
        const buttonBg = this.add
            .rectangle(contentX, buttonY, buttonWidth, buttonHeight, PRIMARY_BLUE, 1)
            .setOrigin(0, 0)
            .setInteractive({ useHandCursor: true });
        const buttonLabel = this.add
            .text(contentX + buttonWidth / 2, buttonY + buttonHeight / 2, "Validasi Jawaban", {
                fontFamily: "Arial Black",
                fontSize: 15,
                color: "#ffffff",
            })
            .setOrigin(0.5);

        buttonBg.on("pointerover", () => buttonBg.setFillStyle(0x2558b8, 1));
        buttonBg.on("pointerout", () => buttonBg.setFillStyle(PRIMARY_BLUE, 1));
        buttonBg.on("pointerdown", () => this.checkAnswer());

        this.root.add([buttonBg, buttonLabel]);

        this.feedbackText = this.add.text(contentX, buttonY + buttonHeight + 12, "", {
            fontFamily: "Arial",
            fontSize: 12,
            color: BODY_TEXT,
            wordWrap: { width: buttonWidth },
        });
        this.root.add(this.feedbackText);
    }

    private gmFieldPosition!: { x: number; y: number; width: number; height: number };

    private buildTipsCard() {
        const x = RIGHT_COLUMN_X;
        const y = 888;
        const width = RIGHT_COLUMN_WIDTH;
        const height = 110;
        const radius = 16;

        const card = this.add.graphics();
        card.fillStyle(0xffffff, 1);
        card.fillRoundedRect(x, y, width, height, radius);
        card.lineStyle(2, PURPLE, 0.85);
        card.strokeRoundedRect(x, y, width, height, radius);
        this.root.add(card);

        this.root.add(
            this.add.text(x + 20, y + 20, "💡", {
                fontFamily: "Arial",
                fontSize: 22,
            }),
        );

        this.root.add(
            this.add.text(
                x + 60,
                y + 20,
                "Distribusi beban yang tepat menjaga nilai GM tetap positif agar kapal stabil.\nBeban berlebih di geladak atas dapat menyebabkan kapal oleng.",
                {
                    fontFamily: "Arial",
                    fontSize: 13,
                    color: BODY_TEXT,
                    lineSpacing: 6,
                    wordWrap: { width: width - 80 },
                },
            ),
        );
    }

    // ---- GM input (real HTML input overlaid on the canvas) -----------------

    private buildGmInput() {
        this.gmInput = document.createElement("input");
        this.gmInput.type = "text";
        this.gmInput.inputMode = "decimal";
        this.gmInput.placeholder = "Masukkan hasil GM";
        Object.assign(this.gmInput.style, {
            position: "absolute",
            font: "13px Arial",
            textAlign: "center",
            border: `2px solid ${PRIMARY_BLUE_HEX}`,
            borderRadius: "8px",
            outline: "none",
            padding: "0 6px",
            zIndex: "10",
        });
        document.body.appendChild(this.gmInput);
    }

    private checkAnswer() {
        // The Stability Auditor's real validation (parsing KM/KG and
        // checking the student's GM) isn't wired up yet.
        this.feedbackText.setText(
            `Jawaban "${this.gmInput.value || "(kosong)"}" diterima. Validasi oleh Stability Auditor akan segera hadir.`,
        );
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
        this.currentScale = scale;
        this.currentRootX = rootX;
        this.currentRootY = rootY;

        const canvas = this.sys.game.canvas;
        const canvasRect = canvas.getBoundingClientRect();
        const domScaleX = canvasRect.width / width;
        const domScaleY = canvasRect.height / height;

        const field = this.gmFieldPosition;
        const fieldScreenX = rootX + field.x * scale;
        const fieldScreenY = rootY + field.y * scale;

        this.gmInput.style.left = `${canvasRect.left + fieldScreenX * domScaleX}px`;
        this.gmInput.style.top = `${canvasRect.top + fieldScreenY * domScaleY}px`;
        this.gmInput.style.width = `${field.width * scale * domScaleX}px`;
        this.gmInput.style.height = `${field.height * scale * domScaleY}px`;
    }
}
