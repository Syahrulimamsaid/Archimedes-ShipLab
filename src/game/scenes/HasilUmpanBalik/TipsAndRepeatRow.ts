import { GameObjects, Scene } from "phaser";

import { BODY_TEXT, PRIMARY_BLUE, PURPLE } from "../../../component/ModulePanel/ModulePanel";
import { SFX_KEYS, playSfx } from "../../SfxManager";

/** The bottom strip: the small "TIPS PENGEMBANGAN DIRI" note on the left,
 * and the "ULANGI MISI" button on the right. */
export function createTipsAndRepeatRow(
    scene: Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    onRepeat: () => void,
): GameObjects.GameObject[] {
    const buttonWidth = 190;
    const gap = 20;
    const tipsWidth = width - buttonWidth - gap;
    const radius = 16;

    const tipsCard = scene.add.graphics();
    tipsCard.fillStyle(0xffffff, 1);
    tipsCard.fillRoundedRect(x, y, tipsWidth, height, radius);
    tipsCard.lineStyle(2, PURPLE, 0.85);
    tipsCard.strokeRoundedRect(x, y, tipsWidth, height, radius);

    const tipsIcon = scene.add
        .text(x + 20, y + height / 2, "💡", {
            fontFamily: "Arial",
            fontSize: 20,
        })
        .setOrigin(0, 0.5);

    const tipsText = scene.add
        .text(
            x + 54,
            y + height / 2,
            "Tinjau kembali bagian yang masih kurang dan ulangi misi\nuntuk memperoleh hasil yang lebih baik.",
            {
                fontFamily: "Arial Black",
                fontSize: 12,
                color: BODY_TEXT,
                lineSpacing: 4,
                wordWrap: { width: tipsWidth - 74 },
            },
        )
        .setOrigin(0, 0.5);

    const buttonX = x + tipsWidth + gap;
    const buttonBg = scene.add
        .rectangle(buttonX, y, buttonWidth, height, PRIMARY_BLUE, 1)
        .setOrigin(0, 0)
        .setInteractive({ useHandCursor: true });
    const buttonLabel = scene.add
        .text(buttonX + buttonWidth / 2, y + height / 2, "🔄  ULANGI MISI", {
            fontFamily: "Arial Black",
            fontSize: 14,
            color: "#ffffff",
        })
        .setOrigin(0.5);

    buttonBg.on("pointerover", () => buttonBg.setFillStyle(0x2558b8, 1));
    buttonBg.on("pointerout", () => buttonBg.setFillStyle(PRIMARY_BLUE, 1));
    buttonBg.on("pointerdown", () => {
        playSfx(scene, SFX_KEYS.click);
        onRepeat();
    });

    return [tipsCard, tipsIcon, tipsText, buttonBg, buttonLabel];
}
