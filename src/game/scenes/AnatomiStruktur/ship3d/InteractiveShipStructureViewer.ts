import { GameObjects, Scene } from "phaser";

import { createFloatingTabCard } from "../../../../component/ModulePanel/ModulePanel";
import { SFX_KEYS, playSfx } from "../../../SfxManager";
import { desaturate, lighten, shadeColor } from "./colorUtils";
import { projectAndSortFaces } from "./faceSorting";
import {
    CAMERA_PRESETS,
    clampPitch,
    defaultCamera,
    projectPoint,
} from "./orbitCamera";
import { OUTLINE_COLOR, SELECTED_COLOR, buildShipComponents } from "./shipComponents";
import { Face3D, OrbitCamera, ProjectedFace, ShipComponent, ShipComponentId, Vec2 } from "./types";
import { boundsCenter, boundsOf, Vec3, vec3 } from "./vec3";

const MIN_ZOOM = 0.65;
const MAX_ZOOM = 2.0;
const TOOLBAR_HEIGHT = 40;
const DRAG_THRESHOLD = 5;
const YAW_SENSITIVITY = 0.006;
const PITCH_SENSITIVITY = 0.006;
const INERTIA_DAMPING = 0.9;
const INERTIA_STOP_EPSILON = 0.0004;

const PRESET_ORDER: Array<{ key: keyof typeof CAMERA_PRESETS; label: string }> = [
    { key: "depan", label: "Depan" },
    { key: "samping", label: "Samping" },
    { key: "atas", label: "Atas" },
    { key: "isometrik", label: "Isometrik" },
];

function shortestAngleDelta(from: number, to: number): number {
    const twoPi = Math.PI * 2;
    let delta = (to - from) % twoPi;
    if (delta > Math.PI) delta -= twoPi;
    if (delta < -Math.PI) delta += twoPi;
    return delta;
}

function pointInPolygon(px: number, py: number, points: Vec2[]): boolean {
    let inside = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
        const pi = points[i];
        const pj = points[j];
        const intersects =
            pi.y > py !== pj.y > py &&
            px < ((pj.x - pi.x) * (py - pi.y)) / (pj.y - pi.y) + pi.x;
        if (intersects) inside = !inside;
    }
    return inside;
}

/**
 * A pure-SVG-style 3D viewer of the double-bottom cross-section, drawn
 * through Phaser Graphics instead of DOM/SVG: fixed geometry built once from
 * Box3D/Prism3D primitives (see shipGeometry.ts), an orbit camera with
 * orthographic projection (orbitCamera.ts), and painter's-algorithm face
 * sorting (faceSorting.ts) recomputed on every orbit/zoom change. No
 * Three.js/Babylon/canvas-3D and no dynamic lighting — shading is a fixed
 * tint per face direction (primitives.ts).
 *
 * Same constructor shape as the DoubleBottomDiagramCard it replaces, so it
 * drops straight into AnatomiStruktur.ts: scene, x, y, width, height, and an
 * onSelect(componentId) callback matching HULL_COMPONENTS' `key` field.
 */
export class InteractiveShipStructureViewer {
    readonly view: GameObjects.GameObject[];

    private scene: Scene;
    private onSelect: (id: ShipComponentId) => void;

    private components: ShipComponent[];
    private componentById = new Map<ShipComponentId, ShipComponent>();
    private componentCenters = new Map<ShipComponentId, Vec3>();
    private allFaces: Face3D[] = [];

    private camera: OrbitCamera;
    private lastProjected: ProjectedFace[] = [];

    private graphics: GameObjects.Graphics;
    private hitZone: GameObjects.Rectangle;
    private tooltip: GameObjects.Container;
    private tooltipBg: GameObjects.Graphics;
    private tooltipText: GameObjects.Text;
    private clipMaskGraphics: GameObjects.Graphics;

    private centerX: number;
    private centerY: number;
    private contentWidth: number;
    private contentHeight: number;

    private hoverId: ShipComponentId | null = null;
    private selectedId: ShipComponentId | null = null;
    private activePreset: keyof typeof CAMERA_PRESETS | null = null;
    private pointerOverViewer = false;

    private isDragging = false;
    private dragMoved = false;
    private lastPointerX = 0;
    private lastPointerY = 0;
    private pointerDownX = 0;
    private pointerDownY = 0;
    private yawVelocity = 0;
    private pitchVelocity = 0;

    private pinchActive = false;
    private lastPinchDistance = 0;

    private currentScale = 1;
    private currentRootX = 0;
    private currentRootY = 0;

    private presetButtons: Array<{
        key: keyof typeof CAMERA_PRESETS;
        bg: GameObjects.Graphics;
        label: GameObjects.Text;
        x: number;
        y: number;
        w: number;
        h: number;
    }> = [];
    private resetButton!: { bg: GameObjects.Graphics; label: GameObjects.Text; x: number; y: number; w: number; h: number };

    private boundPointerMove = (pointer: Phaser.Input.Pointer) => this.handleGlobalPointerMove(pointer);
    private boundPointerUp = (pointer: Phaser.Input.Pointer) => this.handleGlobalPointerUp(pointer);
    private boundWheel = (
        _pointer: Phaser.Input.Pointer,
        over: GameObjects.GameObject[],
        _dx: number,
        dy: number,
    ) => this.handleWheel(over, dy);
    private boundUpdate = () => this.handleInertiaTick();

    constructor(
        scene: Scene,
        x: number,
        y: number,
        width: number,
        height: number,
        onSelect: (id: ShipComponentId) => void,
    ) {
        this.scene = scene;
        this.onSelect = onSelect;

        this.components = buildShipComponents();
        for (const component of this.components) {
            this.componentById.set(component.id, component);
            this.allFaces.push(...component.geometry);
            const allVerts = component.geometry.flatMap((f) => f.vertices);
            this.componentCenters.set(component.id, boundsCenter(boundsOf(allVerts)));
        }

        this.camera = defaultCamera(vec3(0, 0, 90));
        this.camera.zoom = 1.15;

        this.centerX = x + width / 2;
        this.centerY = y + (height - TOOLBAR_HEIGHT) / 2;
        this.contentWidth = width - 24;
        this.contentHeight = height - TOOLBAR_HEIGHT - 24;

        const chrome = createFloatingTabCard(scene, x, y, width, height, "STRUKTUR DASAR BERGANDA KAPAL");

        this.graphics = scene.add.graphics();
        this.graphics.setPosition(this.centerX, this.centerY);

        // Clips the projected polygons to the panel's content area so a
        // zoomed-in/focused component is cropped at the panel edge instead
        // of spilling out over the rest of the scene. Kept as a standalone
        // (not scene-added) graphics object redrawn in absolute screen
        // space in updateClipMask(), since a geometry mask's source isn't
        // affected by the root container's own scale/position otherwise.
        this.clipMaskGraphics = scene.make.graphics(undefined, false);
        this.graphics.setMask(this.clipMaskGraphics.createGeometryMask());

        this.hitZone = scene.add
            .rectangle(this.centerX, this.centerY, this.contentWidth, this.contentHeight, 0xffffff, 0)
            .setInteractive({ useHandCursor: true });
        this.hitZone.on("pointerover", () => {
            this.pointerOverViewer = true;
        });
        this.hitZone.on("pointerout", () => {
            this.pointerOverViewer = false;
            if (!this.isDragging) this.setHover(null);
        });
        this.hitZone.on(
            "pointerdown",
            (pointer: Phaser.Input.Pointer, _lx: number, _ly: number, event: Phaser.Types.Input.EventData) => {
                event.stopPropagation();
                this.beginDrag(pointer);
            },
        );

        this.tooltipBg = scene.add.graphics();
        this.tooltipText = scene.add
            .text(0, 0, "", { fontFamily: "Arial Black", fontSize: 13, color: "#ffffff" })
            .setOrigin(0, 0.5);
        this.tooltip = scene.add.container(0, 0, [this.tooltipBg, this.tooltipText]);
        this.tooltip.setVisible(false);
        this.tooltip.setDepth(50);

        const toolbar = this.buildToolbar(x, y + height - TOOLBAR_HEIGHT + 6, width);

        this.view = [...chrome, this.graphics, this.hitZone, this.tooltip, ...toolbar];

        // Enables a 2nd touch pointer for pinch-to-zoom (Phaser only tracks
        // pointer1 by default). Event names are passed as plain strings
        // (not e.g. Phaser.Scenes.Events.UPDATE) because these scene files
        // only ever import named values from "phaser", and the ambient
        // global `Phaser` namespace they'd need for that isn't reliably
        // present at runtime here (see CargoModel.ts's clamp() comment).
        scene.input.addPointer(1);
        scene.input.on("pointermove", this.boundPointerMove);
        scene.input.on("pointerup", this.boundPointerUp);
        scene.input.on("wheel", this.boundWheel);
        scene.events.on("update", this.boundUpdate);
        scene.events.once("shutdown", () => this.destroy());

        this.updateClipMask();
        this.render();
    }

    destroy() {
        this.scene.input.off("pointermove", this.boundPointerMove);
        this.scene.input.off("pointerup", this.boundPointerUp);
        this.scene.input.off("wheel", this.boundWheel);
        this.scene.events.off("update", this.boundUpdate);
        this.scene.tweens.killTweensOf(this.camera);
        this.scene.tweens.killTweensOf(this.camera.target);
        this.graphics.clearMask(true);
        this.clipMaskGraphics.destroy();
    }

    /** Keeps pointer-to-diagram-space conversion (and the clip mask's
     * screen-space rect) correct as AnatomiStruktur's root container is
     * rescaled/repositioned on resize (same pattern as
     * ShipCargoCard.setViewport in SimulatorStabilitas). */
    setViewport(scale: number, rootX: number, rootY: number) {
        this.currentScale = scale;
        this.currentRootX = rootX;
        this.currentRootY = rootY;
        this.updateClipMask();
    }

    private updateClipMask() {
        const left = this.centerX - this.contentWidth / 2;
        const top = this.centerY - this.contentHeight / 2;
        const screenX = this.currentRootX + left * this.currentScale;
        const screenY = this.currentRootY + top * this.currentScale;

        this.clipMaskGraphics.clear();
        this.clipMaskGraphics.fillStyle(0xffffff);
        this.clipMaskGraphics.fillRect(
            screenX,
            screenY,
            this.contentWidth * this.currentScale,
            this.contentHeight * this.currentScale,
        );
    }

    // ---- Coordinate conversion ------------------------------------------

    private toDiagramLocal(pointer: Phaser.Input.Pointer): Vec2 {
        const designX = (pointer.x - this.currentRootX) / this.currentScale;
        const designY = (pointer.y - this.currentRootY) / this.currentScale;
        return { x: designX - this.centerX, y: designY - this.centerY };
    }

    // ---- Rendering --------------------------------------------------------

    private render() {
        const projected = projectAndSortFaces(this.allFaces, this.camera, 0, 0);
        this.lastProjected = projected;

        const g = this.graphics;
        g.clear();

        for (const pf of projected) {
            const componentId = pf.face.componentId;
            const isSelected = this.selectedId === componentId;
            const isDimmed = this.selectedId !== null && !isSelected;
            const isHovered = this.hoverId === componentId;

            const component = this.componentById.get(componentId)!;
            let color = shadeColor(component.baseColor, pf.face.shade);
            let alpha = 1;

            if (isDimmed) {
                color = desaturate(color, 0.45);
                alpha = 0.32;
            } else if (isHovered) {
                color = lighten(color, 0.16);
            }

            g.fillStyle(color, alpha);
            this.tracePolygon(g, pf.points);
            g.fillPath();

            const strokeColor = isSelected ? SELECTED_COLOR : OUTLINE_COLOR;
            const strokeWidth = isSelected ? 2.5 : 1;
            const strokeAlpha = isDimmed ? 0.25 : 0.85;
            g.lineStyle(strokeWidth, strokeColor, strokeAlpha);
            this.tracePolygon(g, pf.points);
            g.strokePath();
        }

        this.updateTooltip();
    }

    private tracePolygon(g: GameObjects.Graphics, points: Vec2[]) {
        g.beginPath();
        g.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            g.lineTo(points[i].x, points[i].y);
        }
        g.closePath();
    }

    // ---- Hover / hit testing ----------------------------------------------

    private hitTest(local: Vec2): ShipComponentId | null {
        for (let i = this.lastProjected.length - 1; i >= 0; i--) {
            const pf = this.lastProjected[i];
            if (pointInPolygon(local.x, local.y, pf.points)) {
                return pf.face.componentId;
            }
        }
        return null;
    }

    private setHover(id: ShipComponentId | null) {
        if (id === this.hoverId) return;
        this.hoverId = id;
        this.hitZone.input!.cursor = id ? "pointer" : "grab";
        this.render();
    }

    private updateTooltip() {
        const id = this.hoverId ?? this.selectedId;
        if (!id) {
            this.tooltip.setVisible(false);
            return;
        }

        const component = this.componentById.get(id)!;
        const center = this.componentCenters.get(id)!;
        const { screen } = projectPoint(center, this.camera, 0, 0);

        this.tooltipText.setText(`${component.number}  ${component.label}`);
        const w = this.tooltipText.width + 20;
        const h = this.tooltipText.height + 12;

        this.tooltipBg.clear();
        this.tooltipBg.fillStyle(SELECTED_COLOR, 1);
        this.tooltipBg.fillRoundedRect(0, -h / 2, w, h, 8);
        this.tooltipText.setPosition(10, 0);

        this.tooltip.setPosition(this.centerX + screen.x + 14, this.centerY + screen.y - 24);
        this.tooltip.setVisible(true);
    }

    // ---- Drag orbit / click / inertia --------------------------------------

    private beginDrag(pointer: Phaser.Input.Pointer) {
        this.scene.tweens.killTweensOf(this.camera);
        this.isDragging = true;
        this.dragMoved = false;
        this.activePreset = null;
        this.yawVelocity = 0;
        this.pitchVelocity = 0;
        this.lastPointerX = pointer.x;
        this.lastPointerY = pointer.y;
        this.pointerDownX = pointer.x;
        this.pointerDownY = pointer.y;
        this.hitZone.input!.cursor = "grabbing";
    }

    private handleGlobalPointerMove(pointer: Phaser.Input.Pointer) {
        const p1 = this.scene.input.pointer1;
        const p2 = this.scene.input.pointer2;

        if (p1.isDown && p2.isDown && (this.pinchActive || this.isDragging || this.pointerOverViewer)) {
            const distance = Math.hypot(p2.x - p1.x, p2.y - p1.y);
            if (!this.pinchActive) {
                this.pinchActive = true;
                this.isDragging = false;
                this.lastPinchDistance = distance;
            } else {
                const delta = distance - this.lastPinchDistance;
                this.lastPinchDistance = distance;
                this.scene.tweens.killTweensOf(this.camera);
                this.camera.zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, this.camera.zoom * (1 + delta * 0.003)));
                this.render();
            }
            return;
        }
        this.pinchActive = false;

        if (this.isDragging && pointer.isDown) {
            const dx = pointer.x - this.lastPointerX;
            const dy = pointer.y - this.lastPointerY;

            if (!this.dragMoved) {
                const totalDx = pointer.x - this.pointerDownX;
                const totalDy = pointer.y - this.pointerDownY;
                if (Math.hypot(totalDx, totalDy) > DRAG_THRESHOLD) {
                    this.dragMoved = true;
                }
            }

            if (this.dragMoved) {
                const yawDelta = (dx / this.currentScale) * YAW_SENSITIVITY;
                const pitchDelta = -(dy / this.currentScale) * PITCH_SENSITIVITY;
                this.camera.yaw += yawDelta;
                this.camera.pitch = clampPitch(this.camera.pitch + pitchDelta);
                this.yawVelocity = yawDelta;
                this.pitchVelocity = pitchDelta;
                this.render();
            }

            this.lastPointerX = pointer.x;
            this.lastPointerY = pointer.y;
            return;
        }

        if (!this.isDragging && this.pointerOverViewer) {
            const local = this.toDiagramLocal(pointer);
            this.setHover(this.hitTest(local));
        }
    }

    private handleGlobalPointerUp(pointer: Phaser.Input.Pointer) {
        if (!this.isDragging) return;
        this.isDragging = false;
        this.hitZone.input!.cursor = this.hoverId ? "pointer" : "grab";

        if (!this.dragMoved) {
            const local = this.toDiagramLocal(pointer);
            const hit = this.hitTest(local);
            if (hit) {
                this.selectComponent(hit);
            } else {
                this.clearSelection();
            }
        }
        // Drag released with motion still in flight: let handleInertiaTick
        // decay the last yaw/pitch velocity instead of stopping abruptly.
    }

    private handleInertiaTick() {
        if (this.isDragging) return;
        if (Math.abs(this.yawVelocity) < INERTIA_STOP_EPSILON && Math.abs(this.pitchVelocity) < INERTIA_STOP_EPSILON) {
            return;
        }

        this.camera.yaw += this.yawVelocity;
        this.camera.pitch = clampPitch(this.camera.pitch + this.pitchVelocity);
        this.yawVelocity *= INERTIA_DAMPING;
        this.pitchVelocity *= INERTIA_DAMPING;
        this.render();
    }

    private handleWheel(over: GameObjects.GameObject[], dy: number) {
        if (!over.includes(this.hitZone)) return;
        this.scene.tweens.killTweensOf(this.camera);
        const factor = dy > 0 ? 0.92 : 1.08;
        this.camera.zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, this.camera.zoom * factor));
        this.render();
    }

    // ---- Selection ----------------------------------------------------------

    private selectComponent(id: ShipComponentId) {
        this.selectedId = id;
        this.activePreset = null;
        this.render();
        this.focusCameraOn(id);
        playSfx(this.scene, SFX_KEYS.click);
        this.onSelect(id);
    }

    private clearSelection() {
        if (this.selectedId === null) return;
        this.selectedId = null;
        this.render();
    }

    private focusCameraOn(id: ShipComponentId) {
        const center = this.componentCenters.get(id)!;

        this.scene.tweens.killTweensOf(this.camera.target);
        this.scene.tweens.add({
            targets: this.camera.target,
            x: center.x,
            y: center.y,
            z: center.z,
            duration: 420,
            ease: "Cubic.InOut",
            onUpdate: () => this.render(),
        });

        const targetZoom = Math.min(MAX_ZOOM, this.camera.zoom * 1.08);
        this.scene.tweens.add({
            targets: this.camera,
            zoom: targetZoom,
            duration: 420,
            ease: "Cubic.InOut",
        });
    }

    // ---- Preset toolbar -----------------------------------------------------

    private buildToolbar(x: number, y: number, width: number) {
        const objects: GameObjects.GameObject[] = [];
        const items = [...PRESET_ORDER, { key: "reset" as const, label: "Reset" }];
        const sidePadding = 20;
        const gap = 6;
        const usableWidth = width - sidePadding * 2;
        const buttonWidth = (usableWidth - gap * (items.length - 1)) / items.length;
        const buttonHeight = 28;

        let cursorX = x + sidePadding;
        for (const item of items) {
            const bg = this.scene.add.graphics();
            const label = this.scene.add
                .text(0, 0, item.label, { fontFamily: "Arial", fontSize: 11, color: "#1659a7" })
                .setOrigin(0.5);

            const hitArea = this.scene.add
                .rectangle(cursorX + buttonWidth / 2, y + buttonHeight / 2, buttonWidth, buttonHeight, 0xffffff, 0)
                .setInteractive({ useHandCursor: true });

            const entry = { bg, label, x: cursorX, y, w: buttonWidth, h: buttonHeight };

            if (item.key === "reset") {
                this.resetButton = entry;
                hitArea.on("pointerdown", (_p: unknown, _lx: number, _ly: number, event: Phaser.Types.Input.EventData) => {
                    event.stopPropagation();
                    playSfx(this.scene, SFX_KEYS.click);
                    this.resetView();
                });
            } else {
                this.presetButtons.push({ key: item.key, ...entry });
                hitArea.on("pointerdown", (_p: unknown, _lx: number, _ly: number, event: Phaser.Types.Input.EventData) => {
                    event.stopPropagation();
                    playSfx(this.scene, SFX_KEYS.click);
                    this.applyPreset(item.key);
                });
            }

            label.setPosition(cursorX + buttonWidth / 2, y + buttonHeight / 2);
            objects.push(bg, label, hitArea);
            cursorX += buttonWidth + gap;
        }

        this.redrawToolbar();
        return objects;
    }

    private redrawToolbar() {
        const drawButton = (entry: { bg: GameObjects.Graphics; label: GameObjects.Text; x: number; y: number; w: number; h: number }, active: boolean) => {
            entry.bg.clear();
            entry.bg.fillStyle(active ? SELECTED_COLOR : 0xffffff, 1);
            entry.bg.fillRoundedRect(entry.x, entry.y, entry.w, entry.h, entry.h / 2);
            entry.bg.lineStyle(1.5, 0xb8d9ff, 1);
            entry.bg.strokeRoundedRect(entry.x, entry.y, entry.w, entry.h, entry.h / 2);
            entry.label.setColor(active ? "#ffffff" : "#1659a7");
        };

        for (const button of this.presetButtons) {
            drawButton(button, this.activePreset === button.key);
        }
        drawButton(this.resetButton, false);
    }

    private applyPreset(key: keyof typeof CAMERA_PRESETS) {
        const preset = CAMERA_PRESETS[key];
        const yawDelta = shortestAngleDelta(this.camera.yaw, preset.yaw);

        this.scene.tweens.killTweensOf(this.camera);
        this.scene.tweens.add({
            targets: this.camera,
            yaw: this.camera.yaw + yawDelta,
            pitch: clampPitch(preset.pitch),
            duration: 450,
            ease: "Cubic.InOut",
            onUpdate: () => this.render(),
        });

        this.activePreset = key;
        this.redrawToolbar();
    }

    private resetView() {
        this.selectedId = null;
        this.activePreset = null;

        const def = defaultCamera(vec3(0, 0, 90));
        const yawDelta = shortestAngleDelta(this.camera.yaw, def.yaw);

        this.scene.tweens.killTweensOf(this.camera);
        this.scene.tweens.killTweensOf(this.camera.target);

        this.scene.tweens.add({
            targets: this.camera,
            yaw: this.camera.yaw + yawDelta,
            pitch: def.pitch,
            zoom: def.zoom * 1.15,
            duration: 450,
            ease: "Cubic.InOut",
            onUpdate: () => this.render(),
        });
        this.scene.tweens.add({
            targets: this.camera.target,
            x: def.target.x,
            y: def.target.y,
            z: def.target.z,
            duration: 450,
            ease: "Cubic.InOut",
            onUpdate: () => this.render(),
        });

        this.redrawToolbar();
    }
}
