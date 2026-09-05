import { GameObjects, Scene } from "phaser";

import {
    DARK_NAVY,
    PRIMARY_BLUE,
    PURPLE,
    PURPLE_TEXT,
} from "../../../component/ModulePanel/ModulePanel";
import { SFX_KEYS, playSfx } from "../../SfxManager";
import { QuizConfig } from "./QuizScene";

/**
 * The purple "Kuis SOP Darurat Kebocoran" call-to-action card, shown below
 * the InfoWindow only for components that have a `quiz` attached (currently
 * just the watertight door).
 */
export class QuizPromptCard {
    private container: GameObjects.Container;
    private activeQuiz: QuizConfig | null = null;

    constructor(scene: Scene, x: number, width: number, onStart: (quiz: QuizConfig) => void) {
        const height = 196;

        this.container = scene.add.container(x, 0);
        this.container.setVisible(false);

        const card = scene.add.graphics();
        card.fillStyle(0xf3f0fc, 1);
        card.fillRoundedRect(0, 0, width, height, 16);
        card.lineStyle(2, PURPLE, 0.85);
        card.strokeRoundedRect(0, 0, width, height, 16);

        const title = scene.add.text(20, 18, "KUIS SOP DARURAT KEBOCORAN", {
            fontFamily: "Arial Black",
            fontSize: 15,
            color: PURPLE_TEXT,
            wordWrap: { width: width - 40 },
        });

        const body = scene.add.text(
            20,
            18 + title.height + 10,
            'Pintu kedap air adalah komponen penting saat keadaan darurat di kapal. Jawablah kuis berikut untuk membuka klaim lencana "Ship Construction Surveyor"!',
            {
                fontFamily: "Arial",
                fontSize: 13,
                color: DARK_NAVY,
                lineSpacing: 4,
                wordWrap: { width: width - 40 },
            },
        );

        const buttonWidth = width - 40;
        const buttonHeight = 42;
        const buttonY = height - 20 - buttonHeight;
        const buttonBg = scene.add
            .rectangle(20, buttonY, buttonWidth, buttonHeight, PRIMARY_BLUE, 1)
            .setOrigin(0, 0)
            .setInteractive({ useHandCursor: true });
        const buttonLabel = scene.add
            .text(20 + buttonWidth / 2, buttonY + buttonHeight / 2, "Mulai Kuis  ›", {
                fontFamily: "Arial Black",
                fontSize: 14,
                color: "#ffffff",
            })
            .setOrigin(0.5);

        buttonBg.on("pointerover", () => buttonBg.setFillStyle(0x2558b8, 1));
        buttonBg.on("pointerout", () => buttonBg.setFillStyle(PRIMARY_BLUE, 1));
        buttonBg.on("pointerdown", () => {
            if (this.activeQuiz) {
                playSfx(scene, SFX_KEYS.click);
                onStart(this.activeQuiz);
            }
        });

        this.container.add([card, title, body, buttonBg, buttonLabel]);
    }

    get view() {
        return this.container;
    }

    show(quiz: QuizConfig, y: number) {
        this.activeQuiz = quiz;
        this.container.setY(y);
        this.container.setVisible(true);
    }

    hide() {
        this.activeQuiz = null;
        this.container.setVisible(false);
    }
}
