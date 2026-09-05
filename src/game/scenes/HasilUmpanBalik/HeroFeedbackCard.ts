import { GameObjects, Scene } from "phaser";

import { BODY_TEXT, DARK_NAVY } from "../../../component/ModulePanel/ModulePanel";

/**
 * The left-hand hero card: a congratulatory speech bubble over the cadet
 * character illustration, welcoming the student to their results.
 */
export function createHeroFeedbackCard(
    scene: Scene,
    x: number,
    y: number,
    width: number,
    height: number,
): GameObjects.GameObject[] {
    const radius = 18;

    const card = scene.add.graphics();
    card.fillStyle(0xdceafd, 1);
    card.fillRoundedRect(x, y, width, height, radius);
    card.lineStyle(2, 0xbcd4f5, 1);
    card.strokeRoundedRect(x, y, width, height, radius);

    // Character, anchored to the bottom so it reads like it's standing on
    // the card's floor. Kept short of the full height so its head clears
    // the speech bubble above it.
    const character = scene.add.image(x + width / 2, y + height, "character");
    const characterHeight = height * 0.74;
    const characterWidth = characterHeight * (1024 / 1536);
    character.setOrigin(0.5, 1);
    character.setDisplaySize(characterWidth, characterHeight);

    // Speech bubble, top-anchored above the character's head.
    const bubbleWidth = width - 56;
    const bubbleHeight = 118;
    const bubbleX = x + 28;
    const bubbleY = y + 28;
    const bubbleRadius = 16;

    const bubble = scene.add.graphics();
    bubble.fillStyle(0xffffff, 1);
    bubble.fillRoundedRect(bubbleX, bubbleY, bubbleWidth, bubbleHeight, bubbleRadius);
    bubble.lineStyle(2, 0xbcd4f5, 1);
    bubble.strokeRoundedRect(bubbleX, bubbleY, bubbleWidth, bubbleHeight, bubbleRadius);

    // Little tail pointing down toward the character.
    const tailX = bubbleX + 48;
    const tailY = bubbleY + bubbleHeight;
    bubble.fillStyle(0xffffff, 1);
    bubble.beginPath();
    bubble.moveTo(tailX, tailY);
    bubble.lineTo(tailX + 22, tailY);
    bubble.lineTo(tailX, tailY + 18);
    bubble.closePath();
    bubble.fillPath();

    const title = scene.add.text(bubbleX + 20, bubbleY + 22, "Kerja bagus, Taruna!", {
        fontFamily: "Arial Black",
        fontSize: 17,
        color: DARK_NAVY,
    });

    const body = scene.add.text(
        bubbleX + 20,
        bubbleY + 50,
        "Kamu telah menyelesaikan misi ini. Lihat hasil dan\numpan balik di bawah ini.",
        {
            fontFamily: "Arial",
            fontSize: 13,
            color: BODY_TEXT,
            lineSpacing: 5,
            wordWrap: { width: bubbleWidth - 40 },
        },
    );

    return [card, character, bubble, title, body];
}
