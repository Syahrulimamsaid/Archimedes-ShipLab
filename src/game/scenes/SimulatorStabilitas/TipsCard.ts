import { GameObjects, Scene } from "phaser";

import { BODY_TEXT, PURPLE } from "../../../component/ModulePanel/ModulePanel";

/** The small static tips card at the bottom of the right column. */
export function createTipsCard(
    scene: Scene,
    x: number,
    y: number,
    width: number,
    height: number,
): GameObjects.GameObject[] {
    const radius = 16;

    const card = scene.add.graphics();
    card.fillStyle(0xffffff, 1);
    card.fillRoundedRect(x, y, width, height, radius);
    card.lineStyle(2, PURPLE, 0.85);
    card.strokeRoundedRect(x, y, width, height, radius);

    const icon = scene.add.text(x + 20, y + 20, "💡", {
        fontFamily: "Arial",
        fontSize: 22,
    });

    const body = scene.add.text(
        x + 60,
        y + 20,
        "Distribusi beban yang tepat menjaga nilai GM tetap positif agar kapal stabil.\nBeban berlebih di geladak atas dapat menyebabkan kapal oleng.",
        {
            fontFamily: "Arial",
            fontSize: 13,
            color: BODY_TEXT,
            lineSpacing: 6,
            wordWrap: { width: width - 80 },
        },
    );

    return [card, icon, body];
}
