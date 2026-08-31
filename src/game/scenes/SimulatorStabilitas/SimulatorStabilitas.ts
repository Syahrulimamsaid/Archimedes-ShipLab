import { GameObjects, Scale, Scene } from "phaser";

import { Button } from "../../../component/Button/Button";
import { SceneHeader } from "../../../component/SceneHeader/SceneHeader";
import { EventBus } from "../../EventBus";

export class SimulatorStabilitas extends Scene {
    private background!: GameObjects.Image;
    private header!: SceneHeader;

    private cargoPanel!: GameObjects.Container;
    private graphPanel!: GameObjects.Container;
    private feedbackText!: GameObjects.Text;
    private checkButton!: Button;
    private answerInput!: HTMLInputElement;

    constructor() {
        super("SimulatorStabilitas");
    }

    create() {
        this.background = this.add.image(0, 0, "background.home").setAlpha(0.5);

        this.header = new SceneHeader(this, {
            title: "Simulator Stabilitas",
            subtitle: "Simulasi Beban & Perhitungan GM",
            onBack: () => this.scene.start("MainMenu"),
        });

        this.cargoPanel = this.createCargoPanel();
        this.graphPanel = this.createStabilityGraphPanel();
        this.createFormulaBar();
        this.createAnswerInput();

        this.layout(this.scale.width, this.scale.height);
        this.scale.on(Scale.Events.RESIZE, this.handleResize, this);

        EventBus.emit("current-scene-ready", this);

        this.events.once("shutdown", () => {
            this.scale.off(Scale.Events.RESIZE, this.handleResize, this);
            this.answerInput.remove();
        });
    }

    private handleResize(gameSize: Phaser.Structs.Size) {
        this.layout(gameSize.width, gameSize.height);
    }

    /**
     * Left half: a static schematic of the cargo hold (upper deck / lower
     * hold) with example cargo boxes. Drag & drop and the listing (oleng)
     * visualization aren't wired up yet — this is the layout scaffold.
     */
    private createCargoPanel() {
        const container = this.add.container(0, 0);
        const width = 460;
        const height = 380;
        const halfW = width / 2;
        const halfH = height / 2;

        const outline = this.add
            .rectangle(0, 0, width, height, 0xdcebfa, 0.5)
            .setStrokeStyle(3, 0x1d4b97, 0.85);

        const deckLine = this.add.graphics();
        deckLine.lineStyle(3, 0x1d4b97, 0.6);
        deckLine.lineBetween(-halfW, -20, halfW, -20);

        const upperDeckLabel = this.add
            .text(-halfW + 16, -halfH + 16, "GELADAK ATAS", {
                fontFamily: "Arial Black",
                fontSize: 14,
                color: "#1d4b97",
            })
            .setOrigin(0, 0);

        const lowerHoldLabel = this.add
            .text(-halfW + 16, halfH - 16, "PALKA BAWAH", {
                fontFamily: "Arial Black",
                fontSize: 14,
                color: "#1d4b97",
            })
            .setOrigin(0, 1);

        container.add([outline, deckLine, upperDeckLabel, lowerHoldLabel]);

        const cargoBoxes = [
            { x: -110, y: -100, label: "Kontainer 1" },
            { x: 60, y: -100, label: "Kontainer 2" },
            { x: -110, y: 90, label: "Kontainer 3" },
            { x: 60, y: 90, label: "Kontainer 4" },
        ];

        cargoBoxes.forEach((box) => {
            const boxBg = this.add
                .rectangle(box.x, box.y, 150, 70, 0xd39d1f, 0.85)
                .setStrokeStyle(2, 0x8a5a10, 1);
            const boxLabel = this.add
                .text(box.x, box.y, box.label, {
                    fontFamily: "Arial Black",
                    fontSize: 13,
                    color: "#ffffff",
                })
                .setOrigin(0.5);
            container.add([boxBg, boxLabel]);
        });

        return container;
    }

    /**
     * Right half: a static example of the G/B/M points along the ship's
     * vertical axis. Recomputing these from the actual loaded weight isn't
     * wired up yet — this shows the intended visualization.
     */
    private createStabilityGraphPanel() {
        const container = this.add.container(0, 0);
        const axisX = -60;
        const keelY = 150;

        const points: Array<{ key: string; y: number; color: number; label: string }> = [
            { key: "M", y: -30, color: 0x2aa658, label: "M — Titik Metasentrum" },
            { key: "G", y: 40, color: 0xd9534f, label: "G — Titik Berat" },
            { key: "B", y: 90, color: 0x2c8fb8, label: "B — Titik Apung" },
        ];

        const axis = this.add.graphics();
        axis.lineStyle(3, 0x1d4b97, 0.7);
        axis.lineBetween(axisX, keelY, axisX, -60);
        axis.lineStyle(4, 0x1d4b97, 0.9);
        axis.lineBetween(axisX - 40, keelY, axisX + 40, keelY);
        container.add(axis);

        const keelLabel = this.add
            .text(axisX, keelY + 16, "K — Lunas (Keel)", {
                fontFamily: "Arial",
                fontSize: 12,
                color: "#28466d",
            })
            .setOrigin(0.5, 0);
        container.add(keelLabel);

        points.forEach((point) => {
            const dashLine = this.add.graphics();
            dashLine.lineStyle(2, point.color, 0.5);
            dashLine.lineBetween(axisX, point.y, axisX + 140, point.y);

            const dot = this.add.circle(axisX, point.y, 8, point.color, 1);
            const label = this.add
                .text(axisX + 150, point.y, point.label, {
                    fontFamily: "Arial Black",
                    fontSize: 13,
                    color: `#${point.color.toString(16).padStart(6, "0")}`,
                })
                .setOrigin(0, 0.5);

            container.add([dashLine, dot, label]);
        });

        return container;
    }

    private createFormulaBar() {
        this.add
            .text(0, 0, "Hitung: GM = KM − KG =", {
                fontFamily: "Arial Black",
                fontSize: 18,
                color: "#143a84",
            })
            .setOrigin(0, 0.5)
            .setName("formulaLabel");

        this.checkButton = new Button(this, {
            width: 180,
            height: 44,
            text: "Periksa Jawaban",
            fillColor: 0x2f68d8,
            strokeColor: 0xffffff,
            strokeAlpha: 0.24,
            borderRadius: 14,
            hoverAnimation: "popup",
            hoverScale: 1.05,
            hoverOffsetY: 3,
        });
        this.checkButton.on("pointerdown", () => this.checkAnswer());

        this.feedbackText = this.add
            .text(0, 0, "", {
                fontFamily: "Arial",
                fontSize: 14,
                color: "#7d8da8",
            })
            .setOrigin(0, 0.5);
    }

    private createAnswerInput() {
        this.answerInput = document.createElement("input");
        this.answerInput.type = "text";
        this.answerInput.inputMode = "decimal";
        this.answerInput.placeholder = "GM (m)";
        Object.assign(this.answerInput.style, {
            position: "absolute",
            font: "16px Arial",
            textAlign: "center",
            border: "2px solid #2c8fb8",
            borderRadius: "8px",
            outline: "none",
            padding: "0 8px",
            zIndex: "10",
        });
        document.body.appendChild(this.answerInput);
    }

    private checkAnswer() {
        // The Stability Auditor's real validation (parsing KM/KG and
        // checking the student's GM) isn't wired up yet.
        this.feedbackText.setText(
            `Jawaban "${this.answerInput.value || "(kosong)"}" diterima. Validasi oleh Stability Auditor akan segera hadir.`,
        );
        this.feedbackText.setColor("#7d8da8");
    }

    private layout(width: number, height: number) {
        const centerX = width / 2;
        const centerY = height / 2;

        this.background.setPosition(centerX, centerY);
        this.background.setDisplaySize(width, height);

        this.header.layout(width, height);

        const headerHeight = Math.max(58, height * 0.088);
        const contentTop = Math.max(10, height * 0.012) + headerHeight + 40;
        const formulaBarY = height - 60;
        const contentBottom = formulaBarY - 60;
        const contentHeight = Math.max(260, contentBottom - contentTop);
        const contentCenterY = contentTop + contentHeight / 2;

        const panelScale = Math.min(
            (width * 0.42) / 460,
            contentHeight / 380,
            1,
        );

        this.cargoPanel.setPosition(width * 0.27, contentCenterY);
        this.cargoPanel.setScale(Math.max(0.6, panelScale));

        this.graphPanel.setPosition(width * 0.62, contentCenterY);
        this.graphPanel.setScale(Math.max(0.6, panelScale));

        const formulaLabel = this.children.getByName(
            "formulaLabel",
        ) as GameObjects.Text;
        const formulaLabelX = Math.max(40, width * 0.08);
        formulaLabel.setPosition(formulaLabelX, formulaBarY);

        const inputX = formulaLabelX + formulaLabel.width + 16;
        const inputWidth = 140;
        const inputHeight = 36;
        const rowGap = 20;
        const checkButtonWidth = 180;

        const checkButtonX =
            inputX + inputWidth + rowGap + checkButtonWidth / 2;
        this.checkButton.setPosition(checkButtonX, formulaBarY);

        const feedbackX = checkButtonX + checkButtonWidth / 2 + rowGap;
        this.feedbackText.setPosition(feedbackX, formulaBarY);

        const canvas = this.sys.game.canvas;
        const canvasRect = canvas.getBoundingClientRect();
        const domScaleX = canvasRect.width / width;
        const domScaleY = canvasRect.height / height;

        this.answerInput.style.left = `${canvasRect.left + inputX * domScaleX}px`;
        this.answerInput.style.top = `${
            canvasRect.top + (formulaBarY - inputHeight / 2) * domScaleY
        }px`;
        this.answerInput.style.width = `${inputWidth * domScaleX}px`;
        this.answerInput.style.height = `${inputHeight * domScaleY}px`;
    }
}
