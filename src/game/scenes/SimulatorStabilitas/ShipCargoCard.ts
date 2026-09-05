import { GameObjects, Scene } from "phaser";

import {
    BODY_TEXT,
    BORDER_BLUE,
    DARK_NAVY,
    PRIMARY_BLUE,
    PRIMARY_BLUE_HEX,
    createFloatingTabCard,
} from "../../../component/ModulePanel/ModulePanel";
import { SFX_KEYS, playSfx } from "../../SfxManager";
import { CARGO_TYPES, CargoType, ZoneKey } from "./CargoModel";

interface DropZoneState {
    key: ZoneKey;
    x: number;
    y: number;
    width: number;
    height: number;
    contentContainer: GameObjects.Container;
    placeholderIcon: GameObjects.Graphics;
    placeholderText: GameObjects.Text;
    items: { id: number; cargo: CargoType }[];
}

/**
 * The "RUANG PALKA & PENEMPATAN KARGO" floating card: side/top ship views,
 * the two drop zones, and the draggable cargo palette. Owns drag-and-drop
 * entirely internally and reports weight changes back via `onChange`.
 */
export class ShipCargoCard {
    private scene: Scene;
    private viewObjects: GameObjects.GameObject[] = [];
    private onChange: (upperWeight: number, lowerWeight: number) => void;

    private sideView!: GameObjects.Container;
    private topView!: GameObjects.Container;

    private zones: Record<ZoneKey, DropZoneState> = {} as Record<ZoneKey, DropZoneState>;
    private nextCargoId = 0;
    private dragGhost: GameObjects.Container | null = null;
    private draggedCargo: CargoType | null = null;

    private currentScale = 1;
    private currentRootX = 0;
    private currentRootY = 0;

    constructor(
        scene: Scene,
        x: number,
        y: number,
        width: number,
        height: number,
        onChange: (upperWeight: number, lowerWeight: number) => void,
    ) {
        this.scene = scene;
        this.onChange = onChange;

        this.viewObjects.push(
            ...createFloatingTabCard(scene, x, y, width, height, "RUANG PALKA & PENEMPATAN KARGO"),
        );

        this.sideView = this.createShipSideView();
        this.sideView.setPosition(x + width / 2, 480);
        this.viewObjects.push(this.sideView);

        this.topView = this.createShipTopView();
        this.topView.setPosition(x + width / 2, 480);
        this.topView.setVisible(false);
        this.viewObjects.push(this.topView);

        this.buildViewToggle(x + 24, 350);

        this.buildDropZone("geladak-atas", x + 24, 592, width - 48, "GELADAK ATAS");
        this.buildDropZone("palka-bawah", x + 24, 678, width - 48, "PALKA BAWAH");

        this.viewObjects.push(
            scene.add.text(x + 24, 776, "KARGO YANG TERSEDIA", {
                fontFamily: "Arial Black",
                fontSize: 14,
                color: DARK_NAVY,
            }),
        );

        this.buildCargoPalette(x + 24, 800, width - 48);

        scene.input.on("pointermove", (pointer: Phaser.Input.Pointer) => this.updateDragGhost(pointer));
        scene.input.on("pointerup", (pointer: Phaser.Input.Pointer) => this.endDrag(pointer));
    }

    get view() {
        return this.viewObjects;
    }

    /** Called by the scene's layout() so drag hit-testing and the ghost's
     * size stay correct as the design-space-to-screen scale changes. */
    setViewport(scale: number, rootX: number, rootY: number) {
        this.currentScale = scale;
        this.currentRootX = rootX;
        this.currentRootY = rootY;
    }

    setTilt(angle: number) {
        this.scene.tweens.add({
            targets: this.sideView,
            angle,
            duration: 300,
            ease: "Quad.Out",
        });
    }

    private buildViewToggle(x: number, y: number) {
        const buttonWidth = 150;
        const buttonHeight = 36;
        const gap = 12;

        const sideViewButtonBg = this.scene.add.graphics();
        const sideViewButtonText = this.scene.add
            .text(x + buttonWidth / 2, y + buttonHeight / 2, "Tampak Samping", {
                fontFamily: "Arial Black",
                fontSize: 13,
                color: "#ffffff",
            })
            .setOrigin(0.5);

        const topViewButtonBg = this.scene.add.graphics();
        const topViewButtonText = this.scene.add
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

        const sideHit = this.scene.add
            .rectangle(x, y, buttonWidth, buttonHeight, 0xffffff, 0)
            .setOrigin(0, 0)
            .setInteractive({ useHandCursor: true });
        const topHit = this.scene.add
            .rectangle(x + buttonWidth + gap, y, buttonWidth, buttonHeight, 0xffffff, 0)
            .setOrigin(0, 0)
            .setInteractive({ useHandCursor: true });

        const drawToggle = (showSide: boolean) => {
            sideViewButtonBg.clear();
            sideViewButtonBg.fillStyle(showSide ? PRIMARY_BLUE : 0xffffff, 1);
            sideViewButtonBg.fillRoundedRect(x, y, buttonWidth, buttonHeight, buttonHeight / 2);
            if (!showSide) {
                sideViewButtonBg.lineStyle(2, PRIMARY_BLUE, 0.6);
                sideViewButtonBg.strokeRoundedRect(x, y, buttonWidth, buttonHeight, buttonHeight / 2);
            }
            sideViewButtonText.setColor(showSide ? "#ffffff" : PRIMARY_BLUE_HEX);

            const topX = x + buttonWidth + gap;
            topViewButtonBg.clear();
            topViewButtonBg.fillStyle(!showSide ? PRIMARY_BLUE : 0xffffff, 1);
            topViewButtonBg.fillRoundedRect(topX, y, buttonWidth, buttonHeight, buttonHeight / 2);
            if (showSide) {
                topViewButtonBg.lineStyle(2, PRIMARY_BLUE, 0.6);
                topViewButtonBg.strokeRoundedRect(topX, y, buttonWidth, buttonHeight, buttonHeight / 2);
            }
            topViewButtonText.setColor(!showSide ? "#ffffff" : PRIMARY_BLUE_HEX);

            this.sideView.setVisible(showSide);
            this.topView.setVisible(!showSide);
        };

        sideHit.on("pointerdown", () => {
            playSfx(this.scene, SFX_KEYS.click);
            drawToggle(true);
        });
        topHit.on("pointerdown", () => {
            playSfx(this.scene, SFX_KEYS.click);
            drawToggle(false);
        });
        drawToggle(true);

        this.viewObjects.push(
            sideViewButtonBg,
            topViewButtonBg,
            sideViewButtonText,
            topViewButtonText,
            sideHit,
            topHit,
        );
    }

    /** A cargo ship, side profile — hull, bridge, mast, containers, clouds. */
    private createShipSideView() {
        const container = this.scene.add.container(0, 0);
        const g = this.scene.add.graphics();

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
        const mast = this.scene.add.graphics();
        mast.lineStyle(4, 0x334155, 1);
        mast.lineBetween(300, 30, 300, -80);
        mast.lineBetween(288, -60, 312, -60);
        container.add(mast);

        // Containers on deck.
        const containerColors = [0x2f68d8, 0x8a97a8, 0xc0392b, 0xd68a1f, 0xb0762f, 0x2f68d8];
        containerColors.forEach((color, index) => {
            const cx = -160 + index * 62;
            const box = this.scene.add
                .rectangle(cx, -8, 54, 44, color, 1)
                .setStrokeStyle(2, 0x0000000, 0.15);
            container.add(box);
        });

        return container;
    }

    /** Placeholder top-down deck outline; full top-view detail comes later. */
    private createShipTopView() {
        const container = this.scene.add.container(0, 0);
        const g = this.scene.add.graphics();

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
            this.scene.add
                .text(0, 0, "Tampak Atas", {
                    fontFamily: "Arial Black",
                    fontSize: 16,
                    color: PRIMARY_BLUE_HEX,
                })
                .setOrigin(0.5),
        );

        return container;
    }

    private buildDropZone(key: ZoneKey, x: number, y: number, width: number, label: string) {
        const boxHeight = 54;
        const boxY = y + 20;

        this.viewObjects.push(
            this.scene.add.text(x, y, label, {
                fontFamily: "Arial Black",
                fontSize: 13,
                color: DARK_NAVY,
            }),
        );

        const box = this.scene.add.graphics();
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
        this.viewObjects.push(box);

        // Download-style icon: a downward arrow over a tray line.
        const iconX = x + width / 2 - 90;
        const iconY = boxY + boxHeight / 2;
        const placeholderIcon = this.scene.add.graphics();
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
        this.viewObjects.push(placeholderIcon);

        const placeholderText = this.scene.add
            .text(iconX + 18, iconY, "Drag & Drop Kargo di sini", {
                fontFamily: "Arial",
                fontSize: 14,
                color: BODY_TEXT,
            })
            .setOrigin(0, 0.5);
        this.viewObjects.push(placeholderText);

        const contentContainer = this.scene.add.container(0, 0);
        this.viewObjects.push(contentContainer);

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

            const bg = this.scene.add
                .rectangle(cardX, y, cardWidth, cardHeight, 0xffffff, 1)
                .setOrigin(0, 0)
                .setStrokeStyle(2, BORDER_BLUE, 1)
                .setInteractive({ useHandCursor: true });

            const box = this.scene.add
                .rectangle(cardX + cardWidth / 2, y + 32, cardWidth - 40, 34, cargo.color, 1)
                .setStrokeStyle(2, 0x00000, 0.15);

            const label = this.scene.add
                .text(cardX + cardWidth / 2, y + 66, cargo.label, {
                    fontFamily: "Arial Black",
                    fontSize: 13,
                    color: DARK_NAVY,
                })
                .setOrigin(0.5);

            bg.on("pointerover", () => {
                this.scene.tweens.killTweensOf(bg);
                this.scene.tweens.add({ targets: bg, scaleX: 1.04, scaleY: 1.04, duration: 120 });
            });
            bg.on("pointerout", () => {
                this.scene.tweens.killTweensOf(bg);
                this.scene.tweens.add({ targets: bg, scaleX: 1, scaleY: 1, duration: 120 });
            });
            bg.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
                playSfx(this.scene, SFX_KEYS.click);
                this.startDrag(cargo, pointer);
            });

            this.viewObjects.push(bg, box, label);
        });
    }

    // ---- Drag & drop -----------------------------------------------------

    /** Cargo picked up from the palette follows the raw pointer (screen
     * space) via a top-level ghost, independent of the scaled root. */
    private startDrag(cargo: CargoType, pointer: Phaser.Input.Pointer) {
        this.draggedCargo = cargo;

        const ghostWidth = 90 * this.currentScale;
        const ghostHeight = 50 * this.currentScale;

        const box = this.scene.add
            .rectangle(0, 0, ghostWidth, ghostHeight, cargo.color, 0.92)
            .setStrokeStyle(2, 0x000000, 0.2);
        const label = this.scene.add
            .text(0, 0, cargo.label, {
                fontFamily: "Arial Black",
                fontSize: Math.max(10, 13 * this.currentScale),
                color: "#ffffff",
            })
            .setOrigin(0.5);

        this.dragGhost = this.scene.add.container(pointer.x, pointer.y, [box, label]);
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
        this.notifyChange();
    }

    private removeCargo(zoneKey: ZoneKey, itemId: number) {
        const zone = this.zones[zoneKey];
        zone.items = zone.items.filter((item) => item.id !== itemId);
        this.relayoutZone(zoneKey);
        this.notifyChange();
    }

    private notifyChange() {
        const upperWeight = this.zones["geladak-atas"].items.reduce((sum, item) => sum + item.cargo.weight, 0);
        const lowerWeight = this.zones["palka-bawah"].items.reduce((sum, item) => sum + item.cargo.weight, 0);
        this.onChange(upperWeight, lowerWeight);
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

            const chipBg = this.scene.add
                .rectangle(chipX, chipY, chipWidth, chipHeight, item.cargo.color, 1)
                .setOrigin(0, 0)
                .setStrokeStyle(2, 0x000000, 0.15)
                .setInteractive({ useHandCursor: true });

            const chipLabel = this.scene.add
                .text(chipX + chipWidth / 2 - 6, chipY + chipHeight / 2, item.cargo.label, {
                    fontFamily: "Arial Black",
                    fontSize: 11,
                    color: "#ffffff",
                })
                .setOrigin(0.5);

            const removeMark = this.scene.add
                .text(chipX + chipWidth - 12, chipY + chipHeight / 2, "×", {
                    fontFamily: "Arial Black",
                    fontSize: 15,
                    color: "#ffffff",
                })
                .setOrigin(0.5);

            chipBg.on(
                "pointerdown",
                (pointer: Phaser.Input.Pointer, x: number, y: number, event: Phaser.Types.Input.EventData) => {
                    event.stopPropagation();
                    playSfx(this.scene, SFX_KEYS.click);
                    this.removeCargo(zoneKey, item.id);
                },
            );
            chipBg.on("pointerover", () => chipBg.setFillStyle(0xd9534f, 1));
            chipBg.on("pointerout", () => chipBg.setFillStyle(item.cargo.color, 1));

            zone.contentContainer.add([chipBg, chipLabel, removeMark]);
        });
    }
}
