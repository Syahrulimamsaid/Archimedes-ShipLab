import { GameObjects, Scene } from "phaser";

import { BODY_TEXT, DARK_NAVY, PRIMARY_BLUE } from "../../../component/ModulePanel/ModulePanel";
import { createResultCardChrome } from "./ResultCardChrome";

interface ScoreBand {
    label: string;
    range: string;
    color: number;
}

const SCORE_BANDS: ScoreBand[] = [
    { label: "Sangat Baik", range: "80 – 100", color: 0x2aa658 },
    { label: "Baik", range: "60 – 79", color: 0x8a97a8 },
    { label: "Cukup", range: "40 – 59", color: 0xd68a1f },
    { label: "Perlu Peningkatan", range: "< 40", color: 0xc0392b },
];

/** The "SKOR AKHIR" card: a progress ring, the score-band legend, and a
 * short green takeaway note. */
export function createScoreCard(
    scene: Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    score: number,
    maxScore: number,
): GameObjects.GameObject[] {
    const chrome = createResultCardChrome(scene, x, y, width, height, "🎯", PRIMARY_BLUE, "SKOR AKHIR");

    const ringRadius = 52;
    const ringThickness = 13;
    const ringCenterX = chrome.contentX + ringRadius;
    const ringCenterY = chrome.contentY + ringRadius;
    const value = clamp01(score / maxScore);

    const ring = scene.add.graphics();
    ring.lineStyle(ringThickness, 0xd9f0df, 1);
    ring.beginPath();
    ring.arc(ringCenterX, ringCenterY, ringRadius, 0, Math.PI * 2);
    ring.strokePath();

    ring.lineStyle(ringThickness, 0x2aa658, 1);
    ring.beginPath();
    ring.arc(
        ringCenterX,
        ringCenterY,
        ringRadius,
        (-90 * Math.PI) / 180,
        ((-90 + 360 * value) * Math.PI) / 180,
    );
    ring.strokePath();

    const scoreText = scene.add
        .text(ringCenterX, ringCenterY - 8, String(score), {
            fontFamily: "Arial Black",
            fontSize: 30,
            color: DARK_NAVY,
        })
        .setOrigin(0.5);
    const maxScoreText = scene.add
        .text(ringCenterX, ringCenterY + 18, `/ ${maxScore}`, {
            fontFamily: "Arial",
            fontSize: 13,
            color: BODY_TEXT,
        })
        .setOrigin(0.5);

    // Legend, to the right of the ring.
    const legendX = ringCenterX + ringRadius + 24;
    const legendRowHeight = 24;
    const legendTop = ringCenterY - ((SCORE_BANDS.length - 1) * legendRowHeight) / 2;
    const legendItems: GameObjects.GameObject[] = [];

    SCORE_BANDS.forEach((band, index) => {
        const rowY = legendTop + index * legendRowHeight;
        const dot = scene.add.rectangle(legendX, rowY, 12, 12, band.color, 1).setOrigin(0, 0.5);
        const label = scene.add
            .text(legendX + 20, rowY, band.label, {
                fontFamily: "Arial",
                fontSize: 12,
                color: DARK_NAVY,
            })
            .setOrigin(0, 0.5);
        const range = scene.add
            .text(chrome.contentX + chrome.contentWidth, rowY, band.range, {
                fontFamily: "Arial Black",
                fontSize: 12,
                color: BODY_TEXT,
            })
            .setOrigin(1, 0.5);
        legendItems.push(dot, label, range);
    });

    // Takeaway note.
    const noteY = ringCenterY + ringRadius + 24;
    const noteHeight = y + height - noteY - 16;
    const note = scene.add.graphics();
    note.fillStyle(0xe6f7ea, 1);
    note.fillRoundedRect(chrome.contentX, noteY, chrome.contentWidth, noteHeight, 12);

    const noteIcon = scene.add.text(chrome.contentX + 14, noteY + noteHeight / 2, "🌿", {
        fontFamily: "Arial",
        fontSize: 16,
    }).setOrigin(0, 0.5);

    const noteText = scene.add
        .text(
            chrome.contentX + 42,
            noteY + noteHeight / 2,
            "Kamu telah memahami konsep dengan baik dan mampu\nmenerapkan prosedur keselamatan sesuai standar.",
            {
                fontFamily: "Arial",
                fontSize: 12,
                color: "#1f8d52",
                lineSpacing: 4,
                wordWrap: { width: chrome.contentWidth - 56 },
            },
        )
        .setOrigin(0, 0.5);

    return [...chrome.view, ring, scoreText, maxScoreText, ...legendItems, note, noteIcon, noteText];
}

function clamp01(value: number) {
    return Math.min(1, Math.max(0, value));
}
