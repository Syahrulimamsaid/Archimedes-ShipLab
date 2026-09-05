import { GameObjects, Scene } from "phaser";

import { DARK_NAVY } from "../../../component/ModulePanel/ModulePanel";

export interface ResultCardChrome {
    view: GameObjects.GameObject[];
    /** Y just below the icon+title row — where each card's own body starts. */
    contentY: number;
    contentX: number;
    contentWidth: number;
}

/**
 * The plain white rounded card with a small circular icon badge + title row
 * shared by every card on this screen (Skor Akhir, Predikat Penghargaan,
 * Evaluasi Checklist, Refleksi Mandiri, Tips) — only the body below the
 * title differs per card.
 */
export function createResultCardChrome(
    scene: Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    icon: string,
    iconColor: number,
    title: string,
): ResultCardChrome {
    const radius = 18;
    const paddingX = 24;

    const card = scene.add.graphics();
    card.fillStyle(0xffffff, 1);
    card.fillRoundedRect(x, y, width, height, radius);
    card.lineStyle(2, 0xd7e6fb, 1);
    card.strokeRoundedRect(x, y, width, height, radius);

    const iconRadius = 18;
    const iconX = x + paddingX + iconRadius;
    const iconY = y + 26 + iconRadius;
    const iconBg = scene.add.circle(iconX, iconY, iconRadius, iconColor, 1);
    const iconText = scene.add
        .text(iconX, iconY, icon, {
            fontFamily: "Arial",
            fontSize: 17,
        })
        .setOrigin(0.5);

    const titleText = scene.add
        .text(iconX + iconRadius + 12, iconY, title, {
            fontFamily: "Arial Black",
            fontSize: 15,
            color: DARK_NAVY,
            wordWrap: { width: width - (iconRadius * 2 + 12) - paddingX * 2 },
        })
        .setOrigin(0, 0.5);

    return {
        view: [card, iconBg, iconText, titleText],
        contentY: iconY + iconRadius + 20,
        contentX: x + paddingX,
        contentWidth: width - paddingX * 2,
    };
}
