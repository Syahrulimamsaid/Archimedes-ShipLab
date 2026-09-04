import { GameObjects, Scene } from "phaser";

import {
    BODY_TEXT,
    DARK_NAVY,
    PRIMARY_BLUE,
    PURPLE,
    createHeaderBarCard,
} from "../../../component/ModulePanel/ModulePanel";
import { StabilityResult, clamp } from "./CargoModel";

/**
 * The "GRAFIK STABILITAS" card: the M/G/B righting curve plot plus the
 * Kondisi Stabilitas / Sudut Oleng status row. Fully driven by `update()` —
 * it holds no cargo state of its own.
 */
export class StabilityGraphCard {
    private scene: Scene;
    private viewObjects: GameObjects.GameObject[] = [];

    private dynamicGraph: GameObjects.Graphics;
    private pointDotLabels: Record<"M" | "G" | "B", GameObjects.Text>;
    private stabilPillBg: GameObjects.Graphics;
    private stabilPillBounds: { x: number; y: number; width: number };
    private stabilPillText: GameObjects.Text;
    private sudutOlengText: GameObjects.Text;

    private plotX0: number;
    private plotX1: number;
    private plotY0: number;
    private plotY1: number;

    constructor(scene: Scene, x: number, y: number, width: number, height: number) {
        this.scene = scene;
        const headerHeight = 48;

        this.viewObjects.push(
            ...createHeaderBarCard(scene, x, y, width, height, "GRAFIK STABILITAS", headerHeight),
        );

        // Plot area, in design-space pixels.
        this.plotX0 = x + 54;
        this.plotX1 = x + width - 24;
        this.plotY0 = y + headerHeight + 56;
        this.plotY1 = y + height - 96;
        const plotX0 = this.plotX0;
        const plotX1 = this.plotX1;
        const plotY0 = this.plotY0;
        const plotY1 = this.plotY1;

        const graph = scene.add.graphics();

        // Axes.
        const originPx = this.dataToPixel(0, 0);
        graph.lineStyle(1.5, 0xb9c8e0, 1);
        graph.lineBetween(plotX0, originPx.py, plotX1, originPx.py);
        graph.lineBetween(originPx.px, plotY0, originPx.px, plotY1);

        // Ticks.
        for (let dataX = -20; dataX <= 20; dataX += 5) {
            const { px } = this.dataToPixel(dataX, 0);
            this.viewObjects.push(
                scene.add
                    .text(px, plotY1 + 10, String(dataX), {
                        fontFamily: "Arial",
                        fontSize: 11,
                        color: BODY_TEXT,
                    })
                    .setOrigin(0.5, 0),
            );
        }
        for (let dataY = -5; dataY <= 20; dataY += 5) {
            const { py } = this.dataToPixel(-20, dataY);
            this.viewObjects.push(
                scene.add
                    .text(plotX0 - 10, py, String(dataY), {
                        fontFamily: "Arial",
                        fontSize: 11,
                        color: BODY_TEXT,
                    })
                    .setOrigin(1, 0.5),
            );
        }

        // Full-height reference line at x=0; the M/G/B dots and the
        // righting curve itself are drawn dynamically by update().
        const points = [
            { key: "M", label: "M (Metacenter)", color: 0x2aa658 },
            { key: "G", label: "G (Center of Gravity)", color: 0x2f68d8 },
            { key: "B", label: "B (Center of Buoyancy)", color: PURPLE },
        ];

        graph.lineStyle(1.5, 0xb9c8e0, 0.9);
        const topPx = this.dataToPixel(0, 20);
        const bottomPx = this.dataToPixel(0, -5);
        graph.lineBetween(topPx.px, topPx.py, bottomPx.px, bottomPx.py);

        this.viewObjects.push(graph);

        this.dynamicGraph = scene.add.graphics();
        this.viewObjects.push(this.dynamicGraph);

        this.pointDotLabels = {} as Record<"M" | "G" | "B", GameObjects.Text>;
        points.forEach((point) => {
            const label = scene.add
                .text(0, 0, point.key, {
                    fontFamily: "Arial Black",
                    fontSize: 14,
                    color: `#${point.color.toString(16).padStart(6, "0")}`,
                })
                .setOrigin(0, 0.5);
            this.viewObjects.push(label);
            this.pointDotLabels[point.key as "M" | "G" | "B"] = label;
        });

        // Axis captions.
        this.viewObjects.push(
            scene.add.text(plotX0, y + headerHeight + 16, "Tinggi (m)", {
                fontFamily: "Arial",
                fontSize: 12,
                color: BODY_TEXT,
            }),
        );
        this.viewObjects.push(
            scene.add
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
                const dot = scene.add.circle(plotX1 - 150, legendY, 5, point.color, 1);
                const label = scene.add
                    .text(plotX1 - 138, legendY, point.label, {
                        fontFamily: "Arial",
                        fontSize: 12,
                        color: DARK_NAVY,
                    })
                    .setOrigin(0, 0.5);
                this.viewObjects.push(dot, label);
            });

        // Status row: Kondisi Stabilitas / Sudut Oleng — live values driven
        // by whatever cargo is currently placed (see update()).
        const statusY = y + height - 46;
        const statusDivider = x + width / 2;

        this.viewObjects.push(
            scene.add.text(x + 24, statusY, "Kondisi Stabilitas", {
                fontFamily: "Arial",
                fontSize: 13,
                color: BODY_TEXT,
            }),
        );
        const stabilPillWidth = 74;
        this.stabilPillBounds = { x: x + 150, y: statusY - 12, width: stabilPillWidth };
        this.stabilPillBg = scene.add.graphics();
        this.viewObjects.push(this.stabilPillBg);
        this.stabilPillText = scene.add
            .text(x + 150 + stabilPillWidth / 2, statusY, "STABIL", {
                fontFamily: "Arial Black",
                fontSize: 12,
                color: "#1f8d52",
            })
            .setOrigin(0.5);
        this.viewObjects.push(this.stabilPillText);

        this.viewObjects.push(
            scene.add.text(statusDivider + 20, statusY, "Sudut Oleng", {
                fontFamily: "Arial",
                fontSize: 13,
                color: BODY_TEXT,
            }),
        );
        this.sudutOlengText = scene.add
            .text(x + width - 24, statusY, "0.0° (Stabil)", {
                fontFamily: "Arial Black",
                fontSize: 13,
                color: DARK_NAVY,
            })
            .setOrigin(1, 0.5);
        this.viewObjects.push(this.sudutOlengText);
    }

    get view() {
        return this.viewObjects;
    }

    private dataToPixel(dataX: number, dataY: number) {
        return {
            px: this.plotX0 + ((dataX + 20) / 40) * (this.plotX1 - this.plotX0),
            py: this.plotY0 + ((20 - dataY) / 25) * (this.plotY1 - this.plotY0),
        };
    }

    /** Redraws the righting curve and the M/G/B markers, and updates the
     * STABIL/OLENG pill and Sudut Oleng text, from a fresh StabilityResult.
     * The curve's peak tracks GM directly, so a shrinking or negative GM
     * visibly flattens/dips the curve — the same cue as the pill, graphed. */
    update(result: StabilityResult) {
        const clampY = (value: number) => clamp(value, -5, 20);

        this.dynamicGraph.clear();

        const curvePeak = clamp(2 + result.gm * 2, -3, 18);
        this.dynamicGraph.lineStyle(3, PRIMARY_BLUE, 1);
        this.dynamicGraph.beginPath();
        for (let dataX = -20; dataX <= 20; dataX += 1) {
            const dataY = curvePeak - 0.05 * dataX * dataX;
            const { px, py } = this.dataToPixel(dataX, dataY);
            if (dataX === -20) {
                this.dynamicGraph.moveTo(px, py);
            } else {
                this.dynamicGraph.lineTo(px, py);
            }
        }
        this.dynamicGraph.strokePath();

        const points: { key: "M" | "G" | "B"; dataY: number; color: number }[] = [
            { key: "M", dataY: clampY(result.km), color: 0x2aa658 },
            { key: "G", dataY: clampY(result.kg), color: 0x2f68d8 },
            { key: "B", dataY: 0, color: PURPLE },
        ];

        points.forEach((point) => {
            const { px, py } = this.dataToPixel(0, point.dataY);
            this.dynamicGraph.fillStyle(point.color, 1);
            this.dynamicGraph.fillCircle(px, py, 7);
            this.pointDotLabels[point.key].setPosition(px + 12, py - 14);
        });

        this.stabilPillBg.clear();
        this.stabilPillBg.fillStyle(result.isStable ? 0xdcf3e3 : 0xfbe0df, 1);
        this.stabilPillBg.fillRoundedRect(
            this.stabilPillBounds.x,
            this.stabilPillBounds.y,
            this.stabilPillBounds.width,
            26,
            13,
        );
        this.stabilPillText.setText(result.isStable ? "STABIL" : "OLENG");
        this.stabilPillText.setColor(result.isStable ? "#1f8d52" : "#c0392b");

        this.sudutOlengText.setText(
            `${result.listAngle.toFixed(1)}° (${result.isStable ? "Stabil" : "Waspada"})`,
        );
        this.sudutOlengText.setColor(result.isStable ? DARK_NAVY : "#c0392b");
    }
}
