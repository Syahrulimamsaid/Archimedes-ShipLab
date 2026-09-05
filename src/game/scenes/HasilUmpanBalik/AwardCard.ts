import { GameObjects, Scene } from "phaser";

import { BODY_TEXT, PRIMARY_BLUE } from "../../../component/ModulePanel/ModulePanel";
import { createResultCardChrome } from "./ResultCardChrome";

/** The "PREDIKAT PENGHARGAAN" card: a hand-drawn medal (no matching art
 * asset exists yet), the earned title banner, and a short description. */
export function createAwardCard(
    scene: Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    predicateTitle: string,
    description: string,
): GameObjects.GameObject[] {
    const chrome = createResultCardChrome(scene, x, y, width, height, "🏆", PRIMARY_BLUE, "PREDIKAT PENGHARGAAN");

    const centerX = x + width / 2;
    const medalCenterY = chrome.contentY + 58;
    const medalRadius = 44;

    const medal = scene.add.graphics();

    // Sparkle accents around the medal.
    const sparkles: GameObjects.Text[] = [-1, 1].map((side) =>
        scene.add
            .text(centerX + side * (medalRadius + 26), medalCenterY - medalRadius * 0.6, "✨", {
                fontFamily: "Arial",
                fontSize: 18,
            })
            .setOrigin(0.5),
    );

    // Ribbon tails behind the medal.
    medal.fillStyle(0xd68a1f, 1);
    medal.beginPath();
    medal.moveTo(centerX - 22, medalCenterY + medalRadius - 10);
    medal.lineTo(centerX - 34, medalCenterY + medalRadius + 40);
    medal.lineTo(centerX - 10, medalCenterY + medalRadius + 24);
    medal.closePath();
    medal.fillPath();
    medal.beginPath();
    medal.moveTo(centerX + 22, medalCenterY + medalRadius - 10);
    medal.lineTo(centerX + 34, medalCenterY + medalRadius + 40);
    medal.lineTo(centerX + 10, medalCenterY + medalRadius + 24);
    medal.closePath();
    medal.fillPath();

    // Medal disc.
    medal.fillStyle(0xf0c04a, 1);
    medal.fillCircle(centerX, medalCenterY, medalRadius);
    medal.lineStyle(4, 0xd68a1f, 1);
    medal.strokeCircle(centerX, medalCenterY, medalRadius);
    medal.fillStyle(0xd68a1f, 1);
    medal.fillCircle(centerX, medalCenterY, medalRadius - 12);
    medal.lineStyle(2, 0xf0c04a, 0.8);
    medal.strokeCircle(centerX, medalCenterY, medalRadius - 12);

    const anchorIcon = scene.add
        .text(centerX, medalCenterY, "⚓", {
            fontFamily: "Arial",
            fontSize: 34,
            color: "#f0c04a",
        })
        .setOrigin(0.5);

    // Banner with the predicate title.
    const bannerY = medalCenterY + medalRadius + 46;
    const bannerWidth = Math.min(chrome.contentWidth, 260);
    const bannerHeight = 40;
    const banner = scene.add.graphics();
    banner.fillStyle(0xf0c04a, 1);
    banner.fillRoundedRect(centerX - bannerWidth / 2, bannerY - bannerHeight / 2, bannerWidth, bannerHeight, 8);

    const bannerText = scene.add
        .text(centerX, bannerY, predicateTitle, {
            fontFamily: "Arial Black",
            fontSize: 15,
            color: "#7a4a06",
            align: "center",
            wordWrap: { width: bannerWidth - 20 },
        })
        .setOrigin(0.5);

    const descText = scene.add
        .text(centerX, bannerY + bannerHeight / 2 + 14, description, {
            fontFamily: "Arial",
            fontSize: 12,
            color: BODY_TEXT,
            align: "center",
            lineSpacing: 4,
            wordWrap: { width: chrome.contentWidth },
        })
        .setOrigin(0.5, 0);

    return [...chrome.view, medal, ...sparkles, anchorIcon, banner, bannerText, descText];
}
