import { GameObjects, Scene } from "phaser";

import { createFloatingTabCard } from "../../../component/ModulePanel/ModulePanel";
import { SFX_KEYS, playSfx } from "../../SfxManager";

const PRIMARY_BLUE = 0x2f68d8;
const HOVER_BLUE = 0x5ba9e1;

// Badge colors matched to the reference illustration's numbered legend
// (1=red, 2=blue, 3=green, 4=gold, 5=purple, 6=orange, 7=teal, 8=pink,
// 9=blue) so each labelled part reads the same way it does there, even
// though the underlying shapes are hand-drawn rather than the source render.
const BADGE_COLORS: Record<number, number> = {
    1: 0xd9453d,
    2: 0x2f68d8,
    3: 0x2aa658,
    4: 0xdba61a,
    5: 0x6c4fd1,
    6: 0xe0792e,
    7: 0x1f9098,
    8: 0xe0447d,
    9: 0x2f68d8,
};

type Point = { x: number; y: number };

/**
 * The "RUANG PALKA..." floating card: an isometric-style double-bottom
 * cutaway (angled frame strips, triangular brackets with lightening holes,
 * a curved hull band, a slanted tank-top roof) inspired by the reference
 * illustration's composition and color-coded legend — hand-drawn vector
 * art, not a photorealistic 3D render, since Phaser's Graphics API can't
 * produce that and no matching image asset exists.
 *
 * Two interactions layered on top:
 *  - Click-to-focus: selecting a part dims every other part so the chosen
 *    one stands out (click it again to clear focus).
 *  - A pseudo-3D "turntable": the structure is split into three depth
 *    layers (front/mid/back) nested in a rotation rig. Rotating squashes
 *    the rig horizontally (Phaser mirrors it past 90°, like a card
 *    flipping) while each layer drifts sideways at a different rate,
 *    faking parallax depth from flat 2D pieces.
 */
export class DoubleBottomDiagramCard {
    readonly view: GameObjects.GameObject[];

    private scene: Scene;
    private hotspots: Map<string, GameObjects.Rectangle[]> = new Map();
    private componentVisuals: Map<string, GameObjects.GameObject[]> = new Map();
    private onSelect: (key: string) => void;
    private focusedKey: string | null = null;

    private rotationRig!: GameObjects.Container;
    private frontLayer!: GameObjects.Container;
    private midLayer!: GameObjects.Container;
    private backLayer!: GameObjects.Container;
    private rotationAngle = 0;

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
        diagram.setPosition(x + width / 2 - 20, y + height / 2 + 6);
        diagram.setScale(0.92);

        const rotationControls = this.buildRotationControls(x, y, width, height);

        this.view = [...chrome, diagram, ...rotationControls];
    }

    // ---- Hover / focus ---------------------------------------------------

    private setHotspotHover(key: string, isHover: boolean) {
        const rects = this.hotspots.get(key);

        if (!rects) {
            return;
        }

        rects.forEach((rect) => {
            rect.setStrokeStyle(isHover ? 3 : 1.5, isHover ? HOVER_BLUE : 0x1d4b97, isHover ? 0.9 : 0);
        });
    }

    /** Tracks every visual piece (hotspot + its decoration) that belongs to
     * a component key, so applyFocus() can dim/restore them as a group. */
    private registerVisual(key: string, ...objects: GameObjects.GameObject[]) {
        const existing = this.componentVisuals.get(key) ?? [];
        existing.push(...objects);
        this.componentVisuals.set(key, existing);
    }

    /** Dims every component except `key` (or restores everyone if `key` is
     * null). Clicking an already-focused part clears focus again. */
    private applyFocus(key: string | null) {
        this.focusedKey = key;

        this.componentVisuals.forEach((objects, visualKey) => {
            const dimmed = key !== null && visualKey !== key;
            const targetAlpha = dimmed ? 0.2 : 1;

            this.scene.tweens.add({
                targets: objects,
                alpha: targetAlpha,
                duration: 220,
                ease: "Quad.Out",
            });
        });
    }

    /** An invisible (or near-invisible) rectangle used purely for click/hover
     * hit-testing, laid over a hand-drawn shape that's the actual visual. */
    private addHotspot(
        key: string,
        x: number,
        y: number,
        width: number,
        height: number,
        angleDeg = 0,
    ) {
        const rect = this.scene.add
            .rectangle(x, y, width, height, 0xffffff, 0)
            .setAngle(angleDeg)
            .setStrokeStyle(1.5, 0x1d4b97, 0)
            .setInteractive({ useHandCursor: true });

        rect.on("pointerover", () => this.setHotspotHover(key, true));
        rect.on("pointerout", () => this.setHotspotHover(key, false));
        rect.on(
            "pointerdown",
            (
                _pointer: Phaser.Input.Pointer,
                _localX: number,
                _localY: number,
                event: Phaser.Types.Input.EventData,
            ) => {
                event.stopPropagation();
                playSfx(this.scene, SFX_KEYS.click);
                this.applyFocus(this.focusedKey === key ? null : key);
                this.onSelect(key);
            },
        );

        const existing = this.hotspots.get(key) ?? [];
        existing.push(rect);
        this.hotspots.set(key, existing);
        this.registerVisual(key, rect);

        return rect;
    }

    private addNumberBadge(n: number, x: number, y: number, key: string, container: GameObjects.Container) {
        const color = BADGE_COLORS[n] ?? PRIMARY_BLUE;

        const badge = this.scene.add.graphics();
        badge.fillStyle(color, 1);
        badge.fillCircle(x, y, 13);
        badge.lineStyle(2, 0xffffff, 1);
        badge.strokeCircle(x, y, 13);

        const label = this.scene.add
            .text(x, y, String(n), {
                fontFamily: "Arial Black",
                fontSize: 14,
                color: "#ffffff",
            })
            .setOrigin(0.5);

        container.add([badge, label]);
        this.registerVisual(key, badge, label);
    }

    // ---- Small polygon helpers --------------------------------------------

    private fillPolygon(g: GameObjects.Graphics, points: Point[], color: number, alpha = 1) {
        g.fillStyle(color, alpha);
        g.beginPath();
        g.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            g.lineTo(points[i].x, points[i].y);
        }
        g.closePath();
        g.fillPath();
    }

    private strokePolygon(g: GameObjects.Graphics, points: Point[], color: number, alpha = 1, width = 2) {
        g.lineStyle(width, color, alpha);
        g.beginPath();
        g.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            g.lineTo(points[i].x, points[i].y);
        }
        g.closePath();
        g.strokePath();
    }

    /** A band shape between two hand-tuned curves (outer/inner waypoints),
     * used for the curved hull plating — cheaper and easier to tune than
     * true arc geometry for a hand-placed illustration. */
    private curvedBand(outer: Point[], inner: Point[]) {
        return [...outer, ...[...inner].reverse()];
    }

    /**
     * An isometric-styled double-bottom cutaway. All 9 labelled parts are
     * individually clickable, numbered to match the InfoWindow badge, and
     * grouped into three depth layers for the rotation illusion.
     */
    private createDoubleBottomDiagram() {
        const container = this.scene.add.container(0, 0);
        this.rotationRig = this.scene.add.container(0, 0);
        this.backLayer = this.scene.add.container(0, 0);
        this.midLayer = this.scene.add.container(0, 0);
        this.frontLayer = this.scene.add.container(0, 0);
        this.rotationRig.add([this.backLayer, this.midLayer, this.frontLayer]);
        container.add(this.rotationRig);

        this.buildTankTop();
        this.buildCompartments();
        this.buildCentreGirder();
        this.buildBottomLongitudinal();
        this.buildSideFlanges();
        this.buildTankSideBracket();
        this.buildHullCurve();
        this.buildFrames();
        this.buildBrackets();

        return container;
    }

    // 9. Pelat Tank Top — the slanted "roof" plate, back layer.
    private buildTankTop() {
        const pts: Point[] = [
            { x: -400, y: -60 },
            { x: -20, y: -150 },
            { x: 60, y: -108 },
            { x: -340, y: -10 },
        ];

        const g = this.scene.add.graphics();
        this.fillPolygon(g, pts, 0xb9c3cf, 1);
        this.strokePolygon(g, pts, 0x8a97a8, 0.9);
        // Subtle highlight along the leading edge for a beveled-metal hint.
        g.lineStyle(3, 0xe8edf3, 0.8);
        g.lineBetween(pts[0].x, pts[0].y, pts[1].x, pts[1].y);
        this.backLayer.add(g);

        const hit = this.addHotspot("tank-top", -170, -82, 460, 100, -14);
        this.backLayer.add(hit);
        this.registerVisual("tank-top", g);
        this.addNumberBadge(9, -220, -145, "tank-top", this.backLayer);
    }

    // Non-interactive cyan tank compartments — decorative context only,
    // matching the reference's repeated compartment rows (not individually
    // labelled there either).
    private buildCompartments() {
        const g = this.scene.add.graphics();

        for (let row = 0; row < 3; row++) {
            const rowY = -20 + row * 62;
            const rowShift = row * 14;

            [0, 1].forEach((col) => {
                const boxX = -330 + rowShift + col * 175;
                const pts: Point[] = [
                    { x: boxX, y: rowY },
                    { x: boxX + 160, y: rowY - 10 },
                    { x: boxX + 160, y: rowY + 40 },
                    { x: boxX, y: rowY + 50 },
                ];
                this.fillPolygon(g, pts, 0x8fe1ee, 1);
                this.strokePolygon(g, pts, 0x2c8fa8, 0.7, 1.5);

                // Lightening holes + a small hatch, echoing the reference.
                const holeY = rowY + 20 - 5 * (1 - col);
                g.fillStyle(0x6fc3d4, 0.9);
                g.fillCircle(boxX + 45, holeY, 9);
                g.fillCircle(boxX + 95, holeY - 4, 9);
                g.fillStyle(0x4fa9bc, 0.9);
                g.fillRoundedRect(boxX + 12, rowY + 4, 60, 12, 3);
            });
        }
        this.backLayer.add(g);
    }

    // 5. Penyangga Tengah / Centre Girder — vertical divider through the
    // compartments, mid layer.
    private buildCentreGirder() {
        const pts: Point[] = [
            { x: -158, y: -32 },
            { x: -142, y: -38 },
            { x: -100, y: 148 },
            { x: -118, y: 154 },
        ];

        const g = this.scene.add.graphics();
        this.fillPolygon(g, pts, 0x2f3b52, 1);
        this.strokePolygon(g, pts, 0x151c29, 0.9, 1.5);
        this.midLayer.add(g);

        const hit = this.addHotspot("centre-girder", -130, 55, 220, 34, 77);
        this.midLayer.add(hit);
        this.registerVisual("centre-girder", g);
        this.addNumberBadge(5, -128, 172, "centre-girder", this.midLayer);
    }

    // 4. Longitudinals — the gold strip along the bottom-front edge, back layer.
    private buildBottomLongitudinal() {
        const pts: Point[] = [
            { x: -300, y: 158 },
            { x: -20, y: 132 },
            { x: -20, y: 154 },
            { x: -300, y: 182 },
        ];

        const g = this.scene.add.graphics();
        this.fillPolygon(g, pts, 0xe0b23c, 1);
        this.strokePolygon(g, pts, 0xa17a1f, 0.9);
        this.backLayer.add(g);

        const hit = this.addHotspot("longitudinals", -160, 158, 290, 30, -5);
        this.backLayer.add(hit);
        this.registerVisual("longitudinals", g);
        this.addNumberBadge(4, -30, 190, "longitudinals", this.backLayer);
    }

    // 7 & 8. Wrang Terbuka / Wrang Penuh — stepped vertical flanges along
    // the front-left edge, mid layer.
    private buildSideFlanges() {
        const flanges: Array<{ key: string; pts: Point[]; color: number; badge: number; bx: number; by: number }> = [
            {
                key: "wrang-terbuka",
                pts: [
                    { x: -388, y: -18 },
                    { x: -368, y: -24 },
                    { x: -336, y: 68 },
                    { x: -356, y: 74 },
                ],
                color: 0x6fc3d4,
                badge: 7,
                bx: -420,
                by: 20,
            },
            {
                key: "wrang-penuh",
                pts: [
                    { x: -352, y: 34 },
                    { x: -332, y: 28 },
                    { x: -298, y: 128 },
                    { x: -318, y: 134 },
                ],
                color: 0x8a97a8,
                badge: 8,
                bx: -400,
                by: 108,
            },
        ];

        flanges.forEach(({ key, pts, color, badge, bx, by }) => {
            const g = this.scene.add.graphics();
            this.fillPolygon(g, pts, color, 1);
            this.strokePolygon(g, pts, 0x1d4b97, 0.5);
            this.midLayer.add(g);

            const cx = (pts[0].x + pts[2].x) / 2;
            const cy = (pts[0].y + pts[2].y) / 2;
            const hit = this.addHotspot(key, cx, cy, 60, 110, -16);
            this.midLayer.add(hit);
            this.registerVisual(key, g);
            this.addNumberBadge(badge, bx, by, key, this.midLayer);
        });
    }

    // 6. Tank Side Bracket — the corner plate where the bottom meets the
    // curved hull, mid layer.
    private buildTankSideBracket() {
        const pts: Point[] = [
            { x: 220, y: 150 },
            { x: 300, y: 118 },
            { x: 330, y: 168 },
            { x: 250, y: 200 },
        ];

        const g = this.scene.add.graphics();
        this.fillPolygon(g, pts, 0xe08a3c, 1);
        this.strokePolygon(g, pts, 0xa5591f, 0.9);
        this.midLayer.add(g);

        const hit = this.addHotspot("tank-side-bracket", 275, 158, 130, 80, -20);
        this.midLayer.add(hit);
        this.registerVisual("tank-side-bracket", g);
        this.addNumberBadge(6, 285, 208, "tank-side-bracket", this.midLayer);
    }

    // 3. Lempeng Samping / Margin Plate — the curved outer hull band, back layer.
    private buildHullCurve() {
        const outer: Point[] = [
            { x: 350, y: -210 },
            { x: 415, y: -140 },
            { x: 440, y: -40 },
            { x: 432, y: 80 },
            { x: 388, y: 180 },
            { x: 318, y: 238 },
        ];
        const inner: Point[] = [
            { x: 305, y: -196 },
            { x: 362, y: -132 },
            { x: 384, y: -40 },
            { x: 377, y: 72 },
            { x: 340, y: 162 },
            { x: 282, y: 210 },
        ];

        const g = this.scene.add.graphics();
        this.fillPolygon(g, this.curvedBand(outer, inner), 0xc3ccd6, 1);
        this.strokePolygon(g, outer, 0x8a97a8, 0.9);
        this.strokePolygon(g, inner, 0x8a97a8, 0.5, 1);
        this.backLayer.add(g);

        const hit = this.addHotspot("lempeng-samping", 400, -10, 130, 420, 12);
        this.backLayer.add(hit);
        this.registerVisual("lempeng-samping", g);
        this.addNumberBadge(3, 462, 128, "lempeng-samping", this.backLayer);
    }

    // 1. Gading-gading / Frames — angled orange strips standing against the
    // curved hull, front layer.
    private buildFrames() {
        const g = this.scene.add.graphics();
        const baseXs = [122, 172, 222, 272];

        baseXs.forEach((bx) => {
            const pts: Point[] = [
                { x: bx, y: -206 },
                { x: bx + 16, y: -210 },
                { x: bx - 24, y: 30 },
                { x: bx - 40, y: 34 },
            ];
            this.fillPolygon(g, pts, 0xe08a3c, 1);
            this.strokePolygon(g, pts, 0xa5591f, 0.8, 1.5);
        });
        this.frontLayer.add(g);

        const hit = this.addHotspot("gading-gading", 175, -100, 220, 300, -6);
        this.frontLayer.add(hit);
        this.registerVisual("gading-gading", g);
        this.addNumberBadge(1, 210, -230, "gading-gading", this.frontLayer);
    }

    // 2. Bracket — olive triangular brackets with lightening holes, stepping
    // diagonally beneath the frames, front layer.
    private buildBrackets() {
        const g = this.scene.add.graphics();
        const steps = [
            { x: 96, y: -14 },
            { x: 146, y: 26 },
            { x: 196, y: 66 },
            { x: 246, y: 106 },
        ];

        steps.forEach(({ x, y }) => {
            const pts: Point[] = [
                { x: x - 40, y: y - 4 },
                { x: x + 44, y: y - 34 },
                { x: x + 44, y: y + 34 },
            ];
            this.fillPolygon(g, pts, 0x8a8a3c, 1);
            this.strokePolygon(g, pts, 0x5c5c22, 0.85, 1.5);
            g.fillStyle(0xd9dde2, 0.95);
            g.fillCircle(x + 8, y, 12);
            g.lineStyle(1.5, 0x5c5c22, 0.6);
            g.strokeCircle(x + 8, y, 12);
        });
        this.frontLayer.add(g);

        const hit = this.addHotspot("bracket", 165, 30, 220, 150, -20);
        this.frontLayer.add(hit);
        this.registerVisual("bracket", g);
        this.addNumberBadge(2, 108, -20, "bracket", this.frontLayer);
    }

    // ---- Pseudo-3D turntable ------------------------------------------

    /** Squashes the whole rig horizontally (mirroring past 90°, like a
     * card flipping) and drifts each depth layer sideways at a different
     * rate, faking parallax depth from flat 2D pieces. */
    private applyRotationTransform() {
        const cosFactor = Math.cos(this.rotationAngle);
        const sinFactor = Math.sin(this.rotationAngle);
        const sign = cosFactor < 0 ? -1 : 1;
        const squash = sign * Math.max(0.22, Math.abs(cosFactor));

        this.rotationRig.scaleX = squash;

        const parallax = sinFactor * 26;
        this.backLayer.x = parallax * 0.3;
        this.midLayer.x = parallax * 0.65;
        this.frontLayer.x = parallax * 1;
    }

    private rotateBy(deltaDegrees: number) {
        const targetAngle = this.rotationAngle + (deltaDegrees * Math.PI) / 180;

        this.scene.tweens.add({
            targets: this,
            rotationAngle: targetAngle,
            duration: 550,
            ease: "Sine.InOut",
            onUpdate: () => this.applyRotationTransform(),
        });
    }

    private createRotateButton(cx: number, cy: number, glyph: string, onClick: () => void) {
        const radius = 18;
        const bg = this.scene.add
            .circle(cx, cy, radius, PRIMARY_BLUE, 1)
            .setStrokeStyle(2, 0xffffff, 0.7)
            .setInteractive({ useHandCursor: true });
        const label = this.scene.add
            .text(cx, cy, glyph, {
                fontFamily: "Arial Black",
                fontSize: 20,
                color: "#ffffff",
            })
            .setOrigin(0.5);

        bg.on("pointerover", () => {
            this.scene.tweens.killTweensOf([bg, label]);
            this.scene.tweens.add({ targets: [bg, label], scaleX: 1.12, scaleY: 1.12, duration: 120 });
        });
        bg.on("pointerout", () => {
            this.scene.tweens.killTweensOf([bg, label]);
            this.scene.tweens.add({ targets: [bg, label], scaleX: 1, scaleY: 1, duration: 120 });
        });
        bg.on("pointerdown", () => {
            playSfx(this.scene, SFX_KEYS.click);
            onClick();
        });

        return [bg, label];
    }

    /** Rotate-left / rotate-right controls anchored to the card's own
     * bounds (not the diagram), so they stay put while the diagram squashes. */
    private buildRotationControls(x: number, y: number, width: number, height: number) {
        const controlY = y + height - 26;

        const leftButton = this.createRotateButton(x + 36, controlY, "‹", () => this.rotateBy(-45));
        const rightButton = this.createRotateButton(x + width - 36, controlY, "›", () => this.rotateBy(45));

        const hint = this.scene.add
            .text(x + width / 2, controlY, "Putar untuk melihat sisi lain", {
                fontFamily: "Arial",
                fontSize: 12,
                color: "#4a5b78",
            })
            .setOrigin(0.5);

        return [...leftButton, ...rightButton, hint];
    }
}
