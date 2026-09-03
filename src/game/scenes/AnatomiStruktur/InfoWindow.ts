import { GameObjects, Scene } from "phaser";

export interface HullComponentSpec {
    label: string;
    value: string;
}

export interface HullComponentInfo {
    number: number;
    name: string;
    englishName: string;
    description: string;
    specs: HullComponentSpec[];
}

const PRIMARY_BLUE = 0x2f68d8;
const DARK_NAVY = "#143a84";
const BODY_TEXT = "#4a5b78";
const TABLE_ALT_BG = 0xeaf3ff;
const BORDER_BLUE = 0xbcd4f5;
const HEADER_HEIGHT = 48;
const RADIUS = 16;
const PADDING_X = 24;

/**
 * "Jendela Informasi" — a blue header tab over a white body card showing the
 * numbered component name, description, and a material spec table.
 */
export class InfoWindow {
    private scene: Scene;
    private container: GameObjects.Container;
    private width: number;
    private bodyHeight = 0;

    private headerBg: GameObjects.Graphics;
    private headerText: GameObjects.Text;
    private bodyBg: GameObjects.Graphics;
    private badgeCircle: GameObjects.Graphics;
    private badgeText: GameObjects.Text;
    private nameText: GameObjects.Text;
    private englishNameText: GameObjects.Text;
    private descriptionText: GameObjects.Text;
    private specLabelText: GameObjects.Text;
    private tableRows: GameObjects.GameObject[] = [];

    constructor(scene: Scene, width: number) {
        this.scene = scene;
        this.width = width;

        this.container = scene.add.container(0, 0).setDepth(40);

        this.bodyBg = scene.add.graphics();
        this.headerBg = scene.add.graphics();
        this.headerText = scene.add
            .text(width / 2, HEADER_HEIGHT / 2, "JENDELA INFORMASI", {
                fontFamily: "Arial Black",
                fontSize: 15,
                color: "#ffffff",
            })
            .setOrigin(0.5);

        this.badgeCircle = scene.add.graphics();
        this.badgeText = scene.add
            .text(0, 0, "", {
                fontFamily: "Arial Black",
                fontSize: 18,
                color: "#ffffff",
            })
            .setOrigin(0.5);

        this.nameText = scene.add.text(0, 0, "", {
            fontFamily: "Arial Black",
            fontSize: 19,
            color: DARK_NAVY,
        });

        this.englishNameText = scene.add.text(0, 0, "", {
            fontFamily: "Arial",
            fontSize: 14,
            color: BODY_TEXT,
        });

        this.descriptionText = scene.add.text(PADDING_X, 0, "", {
            fontFamily: "Arial",
            fontSize: 14,
            color: BODY_TEXT,
            wordWrap: { width: width - PADDING_X * 2 },
            lineSpacing: 6,
        });

        this.specLabelText = scene.add.text(PADDING_X, 0, "SPESIFIKASI MATERIAL", {
            fontFamily: "Arial Black",
            fontSize: 13,
            color: `#${PRIMARY_BLUE.toString(16).padStart(6, "0")}`,
        });

        this.container.add([
            this.bodyBg,
            this.headerBg,
            this.headerText,
            this.badgeCircle,
            this.badgeText,
            this.nameText,
            this.englishNameText,
            this.descriptionText,
            this.specLabelText,
        ]);
        this.container.setVisible(false);
        this.container.setAlpha(0);
    }

    get view() {
        return this.container;
    }

    /** Bottom Y edge of the panel, in the same local space as setPosition(). */
    get bottom() {
        return this.container.y + this.bodyHeight;
    }

    show(info: HullComponentInfo) {
        this.badgeText.setText(String(info.number));
        this.nameText.setText(info.name);
        this.englishNameText.setText(`(${info.englishName})`);
        this.descriptionText.setText(info.description);

        this.tableRows.forEach((row) => row.destroy());
        this.tableRows = [];

        const badgeX = PADDING_X + 22;
        const badgeY = HEADER_HEIGHT + 46;
        const titleX = PADDING_X + 60;

        this.badgeCircle.clear();
        this.badgeCircle.fillStyle(PRIMARY_BLUE, 1);
        this.badgeCircle.fillCircle(badgeX, badgeY, 22);
        this.badgeText.setPosition(badgeX, badgeY);

        this.nameText.setPosition(titleX, badgeY - 20);
        this.englishNameText.setPosition(titleX, badgeY + 4);

        const descY = badgeY + 46;
        this.descriptionText.setPosition(PADDING_X, descY);

        const specLabelY = descY + this.descriptionText.height + 20;
        this.specLabelText.setPosition(PADDING_X, specLabelY);

        const tableWidth = this.width - PADDING_X * 2;
        const labelColWidth = 140;
        const valueColWidth = tableWidth - labelColWidth - 16;
        let rowY = specLabelY + 26;

        info.specs.forEach((spec, index) => {
            const valueText = this.scene.add.text(
                PADDING_X + labelColWidth + 16,
                rowY,
                spec.value,
                {
                    fontFamily: "Arial",
                    fontSize: 13,
                    color: BODY_TEXT,
                    wordWrap: { width: valueColWidth },
                    lineSpacing: 4,
                },
            );
            const rowHeight = Math.max(34, valueText.height + 16);

            const rowBg = this.scene.add.graphics();
            if (index % 2 === 1) {
                rowBg.fillStyle(TABLE_ALT_BG, 1);
                rowBg.fillRect(
                    PADDING_X - 8,
                    rowY - 8,
                    tableWidth + 16,
                    rowHeight,
                );
            }

            const labelText = this.scene.add.text(PADDING_X, rowY, spec.label, {
                fontFamily: "Arial Black",
                fontSize: 13,
                color: DARK_NAVY,
            });

            this.container.add([rowBg, labelText, valueText]);
            this.tableRows.push(rowBg, labelText, valueText);

            rowY += rowHeight + 4;
        });

        this.bodyHeight = HEADER_HEIGHT + (rowY - HEADER_HEIGHT) + 24;
        this.redrawChrome();

        this.scene.tweens.killTweensOf(this.container);
        this.container.setVisible(true);
        this.scene.tweens.add({
            targets: this.container,
            alpha: 1,
            duration: 180,
            ease: "Quad.Out",
        });
    }

    hide() {
        this.scene.tweens.killTweensOf(this.container);
        this.container.setVisible(false);
        this.container.setAlpha(0);
    }

    setPosition(x: number, y: number) {
        this.container.setPosition(x, y);
    }

    private redrawChrome() {
        this.headerBg.clear();
        this.headerBg.fillStyle(PRIMARY_BLUE, 1);
        this.headerBg.fillRoundedRect(0, 0, this.width, HEADER_HEIGHT, {
            tl: RADIUS,
            tr: RADIUS,
            bl: 0,
            br: 0,
        });

        const bodyOnlyHeight = this.bodyHeight - HEADER_HEIGHT;

        this.bodyBg.clear();
        this.bodyBg.fillStyle(0xffffff, 1);
        this.bodyBg.fillRoundedRect(0, HEADER_HEIGHT, this.width, bodyOnlyHeight, {
            tl: 0,
            tr: 0,
            bl: RADIUS,
            br: RADIUS,
        });
        this.bodyBg.lineStyle(2, BORDER_BLUE, 1);
        this.bodyBg.strokeRoundedRect(
            0,
            HEADER_HEIGHT,
            this.width,
            bodyOnlyHeight,
            { tl: 0, tr: 0, bl: RADIUS, br: RADIUS },
        );
    }
}
