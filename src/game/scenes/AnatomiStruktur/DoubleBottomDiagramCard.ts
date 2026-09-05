import { GameObjects, Scene } from "phaser";

import { createFloatingTabCard } from "../../../component/ModulePanel/ModulePanel";
import { SFX_KEYS, playSfx } from "../../SfxManager";

const PRIMARY_BLUE = 0x2f68d8;
const HOVER_BLUE = 0x5ba9e1;

/**
 * The "RUANG PALKA..." floating card: the illustrated double-bottom
 * cross-section with all 10 clickable parts (9 structural members plus the
 * watertight door). Owns hotspot hover/click behaviour internally and just
 * reports the selected key back to whoever built it.
 */
export class DoubleBottomDiagramCard {
    readonly view: GameObjects.GameObject[];

    private scene: Scene;
    private hotspots: Map<string, GameObjects.Rectangle[]> = new Map();
    private onSelect: (key: string) => void;

    constructor(
        scene: Scene,
        x: number,
        y: number,
        width: number,
        height: number,
        onSelect: (key: string) => void,
    ) {
        this.scene = scene;
        this.onSelect = onSelect;

        const chrome = createFloatingTabCard(
            scene,
            x,
            y,
            width,
            height,
            "STRUKTUR DASAR BERGANDA KAPAL",
        );

        const diagram = this.createDoubleBottomDiagram();
        diagram.setPosition(x + width / 2, y + height / 2 + 10);
        diagram.setScale(1.1);

        this.view = [...chrome, diagram];
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
        const rect = this.scene.add
            .rectangle(x, y, width, height, fillColor, fillAlpha)
            .setStrokeStyle(2, 0x1d4b97, 0.7)
            .setInteractive({ useHandCursor: true });
        rect.setData("baseAlpha", fillAlpha);

        rect.on("pointerover", () => this.setHotspotHover(key, true));
        rect.on("pointerout", () => this.setHotspotHover(key, false));
        rect.on("pointerdown", () => {
            playSfx(this.scene, SFX_KEYS.click);
            this.onSelect(key);
        });

        const existing = this.hotspots.get(key) ?? [];
        existing.push(rect);
        this.hotspots.set(key, existing);

        return rect;
    }

    private addNumberBadge(n: number, x: number, y: number, container: GameObjects.Container) {
        const badge = this.scene.add.graphics();
        badge.fillStyle(PRIMARY_BLUE, 1);
        badge.fillCircle(x, y, 11);
        badge.lineStyle(1.5, 0xffffff, 1);
        badge.strokeCircle(x, y, 11);

        const label = this.scene.add
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
     * it's now the sole subject of this scene. All 10 labelled parts are
     * individually clickable, numbered to match the InfoWindow badge.
     */
    private createDoubleBottomDiagram() {
        const container = this.scene.add.container(0, 0);
        const bandTop = -70;
        const bandBottom = 170;
        const bandLeft = -320;
        const bandRight = 320;
        const framesTop = -160;

        // Soft background panel for context (non-interactive).
        const backdrop = this.scene.add.graphics();
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

            const hole = this.scene.add.graphics();
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

            const tri = this.scene.add.graphics();
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

            const tri = this.scene.add.graphics();
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

            const plate = this.scene.add.graphics();
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

        // 10. Pintu Kedap Air / Watertight Door — not actually part of the
        // double-bottom structure, but shown beside it (per product
        // decision) so every learnable part, including the door that gates
        // the emergency-flooding quiz, lives on one diagram.
        const doorX = 372;
        const doorY = (bandTop + bandBottom) / 2;
        const doorWidth = 42;
        const doorHeight = 122;

        const doorHit = this.addHotspot(
            "pintu-kedap-air",
            doorX,
            doorY,
            doorWidth,
            doorHeight,
            0x8a97a8,
            0.3,
        );
        container.add(doorHit);

        const door = this.scene.add.graphics();
        door.fillStyle(0x5c6b85, 0.95);
        door.fillRoundedRect(doorX - doorWidth / 2, doorY - doorHeight / 2, doorWidth, doorHeight, 6);
        door.lineStyle(2, 0x1d2b45, 0.8);
        door.strokeRoundedRect(doorX - doorWidth / 2, doorY - doorHeight / 2, doorWidth, doorHeight, 6);

        // Porthole window.
        door.fillStyle(0xbcd4f5, 0.9);
        door.fillCircle(doorX, doorY - 30, 11);
        door.lineStyle(2, 0x1d2b45, 0.8);
        door.strokeCircle(doorX, doorY - 30, 11);

        // Dogging wheel handle.
        door.lineStyle(3, 0xd68a1f, 1);
        door.strokeCircle(doorX, doorY + 20, 14);
        [0, 45, 90, 135].forEach((deg) => {
            const rad = (deg * Math.PI) / 180;
            const dx = Math.cos(rad) * 14;
            const dy = Math.sin(rad) * 14;
            door.lineBetween(doorX - dx, doorY + 20 - dy, doorX + dx, doorY + 20 + dy);
        });
        container.add(door);

        this.addNumberBadge(10, doorX, doorY - doorHeight / 2 - 20, container);

        return container;
    }
}
