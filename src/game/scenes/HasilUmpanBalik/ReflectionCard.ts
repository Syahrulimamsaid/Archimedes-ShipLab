import { GameObjects, Scene } from "phaser";

import { BODY_TEXT, BORDER_BLUE, PRIMARY_BLUE, PRIMARY_BLUE_HEX } from "../../../component/ModulePanel/ModulePanel";
import { createResultCardChrome } from "./ResultCardChrome";

const MAX_LENGTH = 500;

/** The "REFLEKSI MANDIRI" card: instructions over a real HTML `<textarea>`
 * (overlaid on the canvas, same approach as the GM input elsewhere) with a
 * live character counter. */
export class ReflectionCard {
    private viewObjects: GameObjects.GameObject[] = [];
    private textarea: HTMLTextAreaElement;
    private counterText: GameObjects.Text;
    private fieldPosition: { x: number; y: number; width: number; height: number };

    constructor(scene: Scene, x: number, y: number, width: number, height: number) {
        const chrome = createResultCardChrome(scene, x, y, width, height, "✏️", PRIMARY_BLUE, "REFLEKSI MANDIRI");
        this.viewObjects.push(...chrome.view);

        const instruction = scene.add.text(
            chrome.contentX,
            chrome.contentY,
            "Tuliskan apa yang sudah kamu pelajari, kesulitan yang kamu\nalami, atau hal yang ingin kamu tingkatkan ke depannya.",
            {
                fontFamily: "Arial",
                fontSize: 12,
                color: BODY_TEXT,
                lineSpacing: 4,
                wordWrap: { width: chrome.contentWidth },
            },
        );
        this.viewObjects.push(instruction);

        const fieldY = chrome.contentY + instruction.height + 14;
        const fieldHeight = Math.max(60, y + height - fieldY - 16);
        this.fieldPosition = { x: chrome.contentX, y: fieldY, width: chrome.contentWidth, height: fieldHeight };

        const fieldBg = scene.add.graphics();
        fieldBg.fillStyle(0xf7fafd, 1);
        fieldBg.lineStyle(1.5, BORDER_BLUE, 1);
        fieldBg.fillRoundedRect(chrome.contentX, fieldY, chrome.contentWidth, fieldHeight, 10);
        fieldBg.strokeRoundedRect(chrome.contentX, fieldY, chrome.contentWidth, fieldHeight, 10);
        this.viewObjects.push(fieldBg);

        this.counterText = scene.add
            .text(chrome.contentX + chrome.contentWidth - 10, fieldY + fieldHeight - 10, `0/${MAX_LENGTH}`, {
                fontFamily: "Arial",
                fontSize: 11,
                color: BODY_TEXT,
            })
            .setOrigin(1, 1);
        this.viewObjects.push(this.counterText);

        this.textarea = document.createElement("textarea");
        this.textarea.maxLength = MAX_LENGTH;
        this.textarea.placeholder =
            "Contoh: Saya jadi lebih memahami pentingnya memeriksa komponen sebelum pelayaran...";
        Object.assign(this.textarea.style, {
            position: "absolute",
            font: "13px Arial",
            color: "#143a84",
            border: `1.5px solid ${PRIMARY_BLUE_HEX}`,
            borderRadius: "10px",
            outline: "none",
            resize: "none",
            padding: "10px",
            boxSizing: "border-box",
            zIndex: "10",
        });
        this.textarea.addEventListener("input", () => {
            this.counterText.setText(`${this.textarea.value.length}/${MAX_LENGTH}`);
        });
        document.body.appendChild(this.textarea);
    }

    get view() {
        return this.viewObjects;
    }

    /** Repositions the HTML `<textarea>` over its design-space slot, called
     * by the scene's layout() on create and every resize. */
    layout(scale: number, rootX: number, rootY: number, canvasRect: DOMRect, domScaleX: number, domScaleY: number) {
        const field = this.fieldPosition;
        const fieldScreenX = rootX + field.x * scale;
        const fieldScreenY = rootY + field.y * scale;

        this.textarea.style.left = `${canvasRect.left + fieldScreenX * domScaleX}px`;
        this.textarea.style.top = `${canvasRect.top + fieldScreenY * domScaleY}px`;
        this.textarea.style.width = `${field.width * scale * domScaleX}px`;
        this.textarea.style.height = `${field.height * scale * domScaleY}px`;
        this.textarea.style.fontSize = `${Math.max(11, 13 * scale)}px`;
    }

    destroy() {
        this.textarea.remove();
    }
}
