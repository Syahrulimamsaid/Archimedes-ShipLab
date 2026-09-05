import { GameObjects, Scale, Scene } from "phaser";

import {
    BODY_TEXT,
    BORDER_BLUE,
    DARK_NAVY,
    PRIMARY_BLUE,
    PRIMARY_BLUE_HEX,
    createHeaderBarCard,
} from "../../../component/ModulePanel/ModulePanel";
import { playSceneEnter, playSceneExit } from "../../../component/SceneTransition";
import { BadgeId, unlockBadge } from "../../BadgeState";
import { EventBus } from "../../EventBus";

export interface QuizQuestion {
    question: string;
    options: string[];
    correctIndex: number;
}

export interface QuizConfig {
    title: string;
    questions: QuizQuestion[];
    passScore: number;
    badgeId: BadgeId;
    badgeName: string;
}

export interface QuizSceneData {
    config: QuizConfig;
    /** Scene key to return to once the quiz has been completed (pass or fail). */
    returnScene: string;
}

// Authored at a fixed reference resolution and uniformly scaled to fit the
// window, same approach as the other module scenes.
const DESIGN_WIDTH = 1536;
const DESIGN_HEIGHT = 980;
const CARD_WIDTH = 860;
const CARD_HEIGHT = 640;
const HEADER_HEIGHT = 64;
const CARD_X = DESIGN_WIDTH / 2 - CARD_WIDTH / 2;
const CARD_Y = DESIGN_HEIGHT / 2 - CARD_HEIGHT / 2;
const CONTENT_X = CARD_X + 40;
const CONTENT_WIDTH = CARD_WIDTH - 80;
const BODY_TOP = CARD_Y + HEADER_HEIGHT;

/**
 * A dedicated full-screen quiz scene — deliberately *not* a dismissible
 * modal: while questions are in progress there is no back/close control
 * anywhere on screen, so a student can't skip past the SOP quiz. A way out
 * (retry or return) only appears once every question has been answered.
 */
export class QuizScene extends Scene {
    private background!: GameObjects.Image;
    private root!: GameObjects.Container;
    private bodyContainer!: GameObjects.Container;

    private quizData!: QuizSceneData;
    private questionIndex = 0;
    private selectedIndex: number | null = null;
    private correctCount = 0;

    constructor() {
        super("QuizScene");
    }

    init(data: QuizSceneData) {
        this.quizData = data;
        this.questionIndex = 0;
        this.selectedIndex = null;
        this.correctCount = 0;
    }

    create() {
        this.background = this.add.image(0, 0, "AnatomiStructure.background");
        this.root = this.add.container(0, 0);

        const chrome = createHeaderBarCard(
            this,
            CARD_X,
            CARD_Y,
            CARD_WIDTH,
            CARD_HEIGHT,
            this.quizData.config.title,
            HEADER_HEIGHT,
        );
        this.root.add(chrome);

        const notice = this.add
            .text(
                CARD_X + CARD_WIDTH / 2,
                CARD_Y - 30,
                "Kuis ini tidak dapat dilewati — selesaikan seluruh soal untuk kembali ke modul.",
                {
                    fontFamily: "Arial Black",
                    fontSize: 14,
                    color: "#ffffff",
                    backgroundColor: "#c0392b",
                    padding: { x: 14, y: 8 },
                },
            )
            .setOrigin(0.5);
        this.root.add(notice);

        this.bodyContainer = this.add.container(0, 0);
        this.root.add(this.bodyContainer);

        this.playCountdown(() => this.renderQuestion());

        this.layout(this.scale.width, this.scale.height);
        this.scale.on(Scale.Events.RESIZE, this.handleResize, this);
        playSceneEnter(this, this.root);

        EventBus.emit("current-scene-ready", this);

        this.events.once("shutdown", () => {
            this.scale.off(Scale.Events.RESIZE, this.handleResize, this);
        });
    }

    private handleResize(gameSize: Phaser.Structs.Size) {
        this.layout(gameSize.width, gameSize.height);
    }

    private returnToModule() {
        playSceneExit(this, this.root, () => this.scene.start(this.quizData.returnScene));
    }

    /** A 3-2-1 countdown shown once, right when the quiz starts, before the
     * first question appears. Lives in bodyContainer so renderQuestion()'s
     * own removeAll() clears it away automatically once the countdown ends. */
    private playCountdown(onComplete: () => void) {
        const centerX = CARD_X + CARD_WIDTH / 2;
        const centerY = BODY_TOP + (CARD_HEIGHT - HEADER_HEIGHT) / 2;
        const STEP_DURATION = 1000;

        const countdownText = this.add
            .text(centerX, centerY - 20, "3", {
                fontFamily: "Arial Black",
                fontSize: 130,
                color: PRIMARY_BLUE_HEX,
            })
            .setOrigin(0.5);
        const hint = this.add
            .text(centerX, centerY + 90, "Kuis akan segera dimulai...", {
                fontFamily: "Arial",
                fontSize: 15,
                color: BODY_TEXT,
            })
            .setOrigin(0.5);
        this.bodyContainer.add([countdownText, hint]);

        let remaining = 3;

        const showNumber = () => {
            countdownText.setText(String(remaining));
            countdownText.setScale(0.3);
            countdownText.setAlpha(0);

            this.tweens.add({
                targets: countdownText,
                scale: 1,
                alpha: 1,
                duration: 240,
                ease: "Back.Out",
            });

            this.time.delayedCall(STEP_DURATION, () => {
                remaining -= 1;
                if (remaining > 0) {
                    showNumber();
                } else {
                    onComplete();
                }
            });
        };

        showNumber();
    }

    private renderQuestion() {
        const config = this.quizData.config;
        this.bodyContainer.removeAll(true);

        const total = config.questions.length;
        const question = config.questions[this.questionIndex];

        const progress = this.add.text(
            CONTENT_X,
            BODY_TOP + 28,
            `SOAL ${this.questionIndex + 1} DARI ${total}`,
            {
                fontFamily: "Arial Black",
                fontSize: 13,
                color: PRIMARY_BLUE_HEX,
            },
        );

        const questionText = this.add.text(CONTENT_X, BODY_TOP + 54, question.question, {
            fontFamily: "Arial Black",
            fontSize: 19,
            color: DARK_NAVY,
            wordWrap: { width: CONTENT_WIDTH },
            lineSpacing: 5,
        });

        this.bodyContainer.add([progress, questionText]);

        const optionsTop = BODY_TOP + 54 + questionText.height + 30;
        const rowHeight = 52;
        const gap = 14;

        question.options.forEach((option, index) => {
            const rowY = optionsTop + index * (rowHeight + gap);
            const isSelected = this.selectedIndex === index;

            const rowBg = this.add
                .rectangle(CONTENT_X, rowY, CONTENT_WIDTH, rowHeight, isSelected ? 0xeaf3ff : 0xffffff, 1)
                .setOrigin(0, 0)
                .setStrokeStyle(2, isSelected ? PRIMARY_BLUE : BORDER_BLUE, 1)
                .setInteractive({ useHandCursor: true });

            const letterBg = this.add
                .circle(CONTENT_X + 30, rowY + rowHeight / 2, 16, isSelected ? PRIMARY_BLUE : 0xeaf3ff, 1)
                .setStrokeStyle(1.5, PRIMARY_BLUE, isSelected ? 1 : 0.4);

            const letterText = this.add
                .text(CONTENT_X + 30, rowY + rowHeight / 2, String.fromCharCode(65 + index), {
                    fontFamily: "Arial Black",
                    fontSize: 14,
                    color: isSelected ? "#ffffff" : PRIMARY_BLUE_HEX,
                })
                .setOrigin(0.5);

            const optionText = this.add
                .text(CONTENT_X + 60, rowY + rowHeight / 2, option, {
                    fontFamily: "Arial",
                    fontSize: 15,
                    color: DARK_NAVY,
                    wordWrap: { width: CONTENT_WIDTH - 80 },
                })
                .setOrigin(0, 0.5);

            rowBg.on("pointerdown", () => {
                this.selectedIndex = index;
                this.renderQuestion();
            });

            this.bodyContainer.add([rowBg, letterBg, letterText, optionText]);
        });

        const isLast = this.questionIndex === total - 1;
        const buttonWidth = 160;
        const buttonHeight = 46;
        const buttonX = CARD_X + CARD_WIDTH - 36 - buttonWidth;
        // Anchored to the actual options bottom (not a fixed offset from the
        // card's bottom edge) so a longer, wrapped question never pushes the
        // option rows down into the button.
        const optionsBottom = optionsTop + question.options.length * (rowHeight + gap) - gap;
        const buttonY = optionsBottom + 28;
        const isEnabled = this.selectedIndex !== null;

        const nextButton = this.add
            .rectangle(buttonX, buttonY, buttonWidth, buttonHeight, PRIMARY_BLUE, isEnabled ? 1 : 0.4)
            .setOrigin(0, 0)
            .setInteractive({ useHandCursor: isEnabled });
        const nextLabel = this.add
            .text(buttonX + buttonWidth / 2, buttonY + buttonHeight / 2, isLast ? "Selesai" : "Berikutnya", {
                fontFamily: "Arial Black",
                fontSize: 15,
                color: "#ffffff",
            })
            .setOrigin(0.5);

        nextButton.on("pointerdown", () => this.confirmAnswer());

        this.bodyContainer.add([nextButton, nextLabel]);
    }

    private confirmAnswer() {
        const config = this.quizData.config;
        if (this.selectedIndex === null) {
            return;
        }

        const question = config.questions[this.questionIndex];
        if (this.selectedIndex === question.correctIndex) {
            this.correctCount += 1;
        }

        if (this.questionIndex < config.questions.length - 1) {
            this.questionIndex += 1;
            this.selectedIndex = null;
            this.renderQuestion();
        } else {
            this.renderResult();
        }
    }

    private renderResult() {
        const config = this.quizData.config;
        this.bodyContainer.removeAll(true);

        const total = config.questions.length;
        const passed = this.correctCount >= config.passScore;
        const centerX = CARD_X + CARD_WIDTH / 2;

        if (passed) {
            unlockBadge(config.badgeId);
        }

        const icon = this.add
            .text(centerX, BODY_TOP + 70, passed ? "✅" : "⚠️", {
                fontFamily: "Arial",
                fontSize: 48,
            })
            .setOrigin(0.5);

        const title = this.add
            .text(centerX, BODY_TOP + 138, passed ? "Selamat!" : "Belum Berhasil", {
                fontFamily: "Arial Black",
                fontSize: 26,
                color: passed ? "#1f8d52" : "#c0392b",
            })
            .setOrigin(0.5);

        const scoreText = this.add
            .text(centerX, BODY_TOP + 182, `Anda menjawab ${this.correctCount} dari ${total} soal dengan benar.`, {
                fontFamily: "Arial",
                fontSize: 15,
                color: BODY_TEXT,
                align: "center",
                wordWrap: { width: CONTENT_WIDTH },
            })
            .setOrigin(0.5, 0);

        this.bodyContainer.add([icon, title, scoreText]);

        const buttonWidth = 220;
        const buttonHeight = 48;
        const buttonY = BODY_TOP + 260;

        if (passed) {
            const badgeLine = this.add
                .text(centerX, BODY_TOP + 222, `Lencana "${config.badgeName}" berhasil diklaim!`, {
                    fontFamily: "Arial Black",
                    fontSize: 15,
                    color: PRIMARY_BLUE_HEX,
                    align: "center",
                    wordWrap: { width: CONTENT_WIDTH },
                })
                .setOrigin(0.5, 0);
            this.bodyContainer.add(badgeLine);

            const returnBtn = this.add
                .rectangle(centerX - buttonWidth / 2, buttonY, buttonWidth, buttonHeight, PRIMARY_BLUE, 1)
                .setOrigin(0, 0)
                .setInteractive({ useHandCursor: true });
            const returnLabel = this.add
                .text(centerX, buttonY + buttonHeight / 2, "Kembali ke Modul", {
                    fontFamily: "Arial Black",
                    fontSize: 15,
                    color: "#ffffff",
                })
                .setOrigin(0.5);
            returnBtn.on("pointerdown", () => this.returnToModule());
            this.bodyContainer.add([returnBtn, returnLabel]);
        } else {
            const hint = this.add
                .text(
                    centerX,
                    BODY_TOP + 222,
                    `Diperlukan minimal ${config.passScore} dari ${total} jawaban benar untuk klaim lencana.`,
                    {
                        fontFamily: "Arial",
                        fontSize: 14,
                        color: BODY_TEXT,
                        align: "center",
                        wordWrap: { width: CONTENT_WIDTH },
                    },
                )
                .setOrigin(0.5, 0);
            this.bodyContainer.add(hint);

            const gap = 12;
            const retryBtn = this.add
                .rectangle(centerX - buttonWidth - gap / 2, buttonY, buttonWidth, buttonHeight, PRIMARY_BLUE, 1)
                .setOrigin(0, 0)
                .setInteractive({ useHandCursor: true });
            const retryLabel = this.add
                .text(centerX - gap / 2 - buttonWidth / 2, buttonY + buttonHeight / 2, "Coba Lagi", {
                    fontFamily: "Arial Black",
                    fontSize: 15,
                    color: "#ffffff",
                })
                .setOrigin(0.5);
            retryBtn.on("pointerdown", () => {
                this.questionIndex = 0;
                this.selectedIndex = null;
                this.correctCount = 0;
                this.renderQuestion();
            });

            const returnBtn = this.add
                .rectangle(centerX + gap / 2, buttonY, buttonWidth, buttonHeight, 0xffffff, 1)
                .setOrigin(0, 0)
                .setStrokeStyle(2, PRIMARY_BLUE, 1)
                .setInteractive({ useHandCursor: true });
            const returnLabel = this.add
                .text(centerX + gap / 2 + buttonWidth / 2, buttonY + buttonHeight / 2, "Kembali ke Modul", {
                    fontFamily: "Arial Black",
                    fontSize: 14,
                    color: PRIMARY_BLUE_HEX,
                })
                .setOrigin(0.5);
            returnBtn.on("pointerdown", () => this.returnToModule());

            this.bodyContainer.add([retryBtn, retryLabel, returnBtn, returnLabel]);
        }
    }

    private layout(width: number, height: number) {
        this.background.setPosition(width / 2, height / 2);
        this.background.setDisplaySize(width, height);

        const scale = Math.min(width / DESIGN_WIDTH, height / DESIGN_HEIGHT);
        this.root.setScale(scale);
        this.root.setPosition(
            (width - DESIGN_WIDTH * scale) / 2,
            (height - DESIGN_HEIGHT * scale) / 2,
        );
    }
}
