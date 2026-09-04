import { Actions, GameObjects, Scene } from "phaser";

import {
    BODY_TEXT,
    BORDER_BLUE,
    DARK_NAVY,
    PRIMARY_BLUE,
    PRIMARY_BLUE_HEX,
    PURPLE,
    PURPLE_TEXT,
    createHeaderBarCard,
} from "../../../component/ModulePanel/ModulePanel";

/**
 * The "PERHITUNGAN GM" card: KM/KG readouts, the Stability Auditor mini-card,
 * a real HTML `<input>` overlaid on the canvas for the student's GM answer,
 * the validate button, and the feedback line. `onValidate` is called with
 * the raw input text whenever the button is pressed — the scene owns the
 * actual GM comparison since it owns the live StabilityResult.
 */
export class GmCalculatorCard {
    private scene: Scene;
    private viewObjects: GameObjects.GameObject[] = [];

    private kmValueText: GameObjects.Text;
    private kgValueText: GameObjects.Text;
    private feedbackText: GameObjects.Text;
    private gmInput: HTMLInputElement;
    private gmFieldPosition: { x: number; y: number; width: number; height: number };

    constructor(
        scene: Scene,
        x: number,
        y: number,
        width: number,
        height: number,
        initialKM: number,
        initialKG: number,
        onValidate: (inputValue: string) => void,
    ) {
        this.scene = scene;
        const headerHeight = 48;

        this.viewObjects.push(
            ...createHeaderBarCard(scene, x, y, width, height, "PERHITUNGAN GM", headerHeight),
        );

        const contentX = x + 24;
        let contentY = y + headerHeight + 32;

        this.viewObjects.push(
            scene.add.text(contentX, contentY, "GM = KM - KG", {
                fontFamily: "Arial Black",
                fontSize: 19,
                color: DARK_NAVY,
            }),
        );

        contentY += 48;

        const fieldWidth = 96;
        const fieldHeight = 40;

        const drawField = (fx: number, fy: number, label: string, value: string) => {
            this.viewObjects.push(
                scene.add.text(fx, fy, label, {
                    fontFamily: "Arial",
                    fontSize: 12,
                    color: BODY_TEXT,
                }),
            );
            const box = scene.add.graphics();
            box.fillStyle(0xf3f7fc, 1);
            box.fillRoundedRect(fx, fy + 18, fieldWidth, fieldHeight, 8);
            box.lineStyle(2, BORDER_BLUE, 1);
            box.strokeRoundedRect(fx, fy + 18, fieldWidth, fieldHeight, 8);
            this.viewObjects.push(box);
            const valueText = scene.add
                .text(fx + fieldWidth / 2, fy + 18 + fieldHeight / 2, value, {
                    fontFamily: "Arial Black",
                    fontSize: 15,
                    color: DARK_NAVY,
                })
                .setOrigin(0.5);
            this.viewObjects.push(valueText);
            return valueText;
        };

        this.kmValueText = drawField(contentX, contentY, "KM (m)", initialKM.toFixed(2));
        this.kgValueText = drawField(
            contentX + fieldWidth + 34,
            contentY,
            "KG (m)",
            initialKG.toFixed(2),
        );

        const arrowX = contentX + fieldWidth * 2 + 34 + 28;
        const arrowY = contentY + 18 + fieldHeight / 2;
        const arrow = scene.add.graphics();
        arrow.fillStyle(PRIMARY_BLUE, 1);
        arrow.beginPath();
        arrow.moveTo(arrowX + 12, arrowY);
        arrow.lineTo(arrowX, arrowY - 6);
        arrow.lineTo(arrowX, arrowY + 6);
        arrow.closePath();
        arrow.fillPath();
        arrow.fillRect(arrowX - 12, arrowY - 2, 12, 4);
        this.viewObjects.push(arrow);

        const gmFieldX = arrowX + 24;
        this.viewObjects.push(
            scene.add.text(gmFieldX, contentY, "GM (m)", {
                fontFamily: "Arial",
                fontSize: 12,
                color: BODY_TEXT,
            }),
        );

        this.gmFieldPosition = { x: gmFieldX, y: contentY + 18, width: 128, height: fieldHeight };

        // Stability Auditor mini-card.
        const auditorX = x + width - 150;
        const auditorY = y + headerHeight + 24;
        const auditorBg = scene.add.graphics();
        auditorBg.fillStyle(0xf3f0fc, 1);
        auditorBg.lineStyle(2, PURPLE, 0.5);
        auditorBg.fillRoundedRect(auditorX, auditorY, 150, 96, 14);
        auditorBg.strokeRoundedRect(auditorX, auditorY, 150, 96, 14);
        this.viewObjects.push(auditorBg);

        const avatarRadius = 20;
        const avatarX = auditorX + 30;
        const avatarY = auditorY + 30;
        const avatarCircle = scene.add
            .circle(avatarX, avatarY, avatarRadius, 0xe8f2ff, 1)
            .setStrokeStyle(2, PURPLE, 0.6);
        const avatar = scene.add
            .image(avatarX, avatarY, "profile.human")
            .setDisplaySize(avatarRadius * 2, avatarRadius * 2);
        Actions.AddMaskShape(avatar, { shape: "circle", useInternal: true });
        this.viewObjects.push(avatarCircle, avatar);

        this.viewObjects.push(
            scene.add.text(auditorX + 12, auditorY + 56, "Stability Auditor", {
                fontFamily: "Arial Black",
                fontSize: 12,
                color: PURPLE_TEXT,
            }),
        );
        this.viewObjects.push(
            scene.add.text(
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
        const buttonBg = scene.add
            .rectangle(contentX, buttonY, buttonWidth, buttonHeight, PRIMARY_BLUE, 1)
            .setOrigin(0, 0)
            .setInteractive({ useHandCursor: true });
        const buttonLabel = scene.add
            .text(contentX + buttonWidth / 2, buttonY + buttonHeight / 2, "Validasi Jawaban", {
                fontFamily: "Arial Black",
                fontSize: 15,
                color: "#ffffff",
            })
            .setOrigin(0.5);

        buttonBg.on("pointerover", () => buttonBg.setFillStyle(0x2558b8, 1));
        buttonBg.on("pointerout", () => buttonBg.setFillStyle(PRIMARY_BLUE, 1));
        buttonBg.on("pointerdown", () => onValidate(this.gmInput.value));

        this.viewObjects.push(buttonBg, buttonLabel);

        this.feedbackText = scene.add.text(contentX, buttonY + buttonHeight + 12, "", {
            fontFamily: "Arial",
            fontSize: 12,
            color: BODY_TEXT,
            wordWrap: { width: buttonWidth },
        });
        this.viewObjects.push(this.feedbackText);

        // ---- GM input (real HTML input overlaid on the canvas) -------------
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

    get view() {
        return this.viewObjects;
    }

    update(km: number, kg: number) {
        this.kmValueText.setText(km.toFixed(2));
        this.kgValueText.setText(kg.toFixed(2));
    }

    setFeedback(text: string, color: string) {
        this.feedbackText.setText(text);
        this.feedbackText.setColor(color);
    }

    /** Repositions the HTML `<input>` over its design-space slot, called by
     * the scene's layout() on create and every resize. */
    layout(scale: number, rootX: number, rootY: number, canvasRect: DOMRect, domScaleX: number, domScaleY: number) {
        const field = this.gmFieldPosition;
        const fieldScreenX = rootX + field.x * scale;
        const fieldScreenY = rootY + field.y * scale;

        this.gmInput.style.left = `${canvasRect.left + fieldScreenX * domScaleX}px`;
        this.gmInput.style.top = `${canvasRect.top + fieldScreenY * domScaleY}px`;
        this.gmInput.style.width = `${field.width * scale * domScaleX}px`;
        this.gmInput.style.height = `${field.height * scale * domScaleY}px`;
    }

    destroy() {
        this.gmInput.remove();
    }
}
