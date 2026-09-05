import { GameObjects, Scene } from "phaser";

import { BODY_TEXT, BORDER_BLUE, DARK_NAVY, PRIMARY_BLUE } from "../../../component/ModulePanel/ModulePanel";
import { createResultCardChrome } from "./ResultCardChrome";

interface ChecklistRow {
    label: string;
    status: "ok" | "warning";
    note: string;
}

const ROWS: ChecklistRow[] = [
    { label: "Identifikasi Bahaya", status: "ok", note: "Sesuai" },
    { label: "Pemeriksaan Komponen", status: "ok", note: "Sesuai" },
    { label: "Prosedur Keselamatan", status: "ok", note: "Sesuai" },
    { label: "Penggunaan Alat", status: "ok", note: "Sesuai" },
    { label: "Pelaporan dan Dokumentasi", status: "warning", note: "Sebagian sesuai" },
    { label: "Tindakan Pencegahan", status: "ok", note: "Sesuai" },
];

const TABLE_ALT_BG = 0xeaf3ff;

/** The "EVALUASI KEPATUHAN SOP CHECKLIST AUDITOR" card: a compliance-score
 * pill plus a checklist table (status icon + note per row). */
export function createChecklistCard(
    scene: Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    compliancePercent: number,
): GameObjects.GameObject[] {
    const chrome = createResultCardChrome(
        scene,
        x,
        y,
        width,
        height,
        "📋",
        PRIMARY_BLUE,
        "EVALUASI KEPATUHAN SOP\nCHECKLIST AUDITOR",
    );

    // Compliance score pill, top-right corner.
    const pillWidth = 84;
    const pillHeight = 46;
    const pillX = x + width - 20 - pillWidth;
    const pillY = y + 20;
    const pill = scene.add.graphics();
    pill.fillStyle(0xf3f7fc, 1);
    pill.lineStyle(1.5, BORDER_BLUE, 1);
    pill.fillRoundedRect(pillX, pillY, pillWidth, pillHeight, 10);
    pill.strokeRoundedRect(pillX, pillY, pillWidth, pillHeight, 10);

    const pillLabel = scene.add
        .text(pillX + pillWidth / 2, pillY + 13, "Skor Kepatuhan", {
            fontFamily: "Arial",
            fontSize: 9,
            color: BODY_TEXT,
        })
        .setOrigin(0.5);
    const pillValue = scene.add
        .text(pillX + pillWidth / 2, pillY + 31, `${compliancePercent}%`, {
            fontFamily: "Arial Black",
            fontSize: 16,
            color: DARK_NAVY,
        })
        .setOrigin(0.5);

    // Table.
    const tableTop = chrome.contentY + 6;
    const noColWidth = 26;
    const statusColWidth = 46;
    const noteColWidth = 108;
    const labelColWidth = chrome.contentWidth - noColWidth - statusColWidth - noteColWidth;
    const headerHeight = 22;
    const rowHeight = 25;

    const tableObjects: GameObjects.GameObject[] = [];

    const headerBg = scene.add.rectangle(
        chrome.contentX,
        tableTop,
        chrome.contentWidth,
        headerHeight,
        0xf3f7fc,
        1,
    ).setOrigin(0, 0);
    tableObjects.push(headerBg);

    const headerStyle = { fontFamily: "Arial Black", fontSize: 10, color: BODY_TEXT };
    tableObjects.push(
        scene.add.text(chrome.contentX + 6, tableTop + headerHeight / 2, "No.", headerStyle).setOrigin(0, 0.5),
        scene.add
            .text(chrome.contentX + noColWidth, tableTop + headerHeight / 2, "Aspek Penilaian", headerStyle)
            .setOrigin(0, 0.5),
        scene.add
            .text(
                chrome.contentX + noColWidth + labelColWidth + statusColWidth / 2,
                tableTop + headerHeight / 2,
                "Status",
                headerStyle,
            )
            .setOrigin(0.5),
        scene.add
            .text(
                chrome.contentX + noColWidth + labelColWidth + statusColWidth,
                tableTop + headerHeight / 2,
                "Keterangan",
                headerStyle,
            )
            .setOrigin(0, 0.5),
    );

    ROWS.forEach((row, index) => {
        const rowY = tableTop + headerHeight + index * rowHeight;

        if (index % 2 === 1) {
            tableObjects.push(
                scene.add
                    .rectangle(chrome.contentX, rowY, chrome.contentWidth, rowHeight, TABLE_ALT_BG, 1)
                    .setOrigin(0, 0),
            );
        }

        const rowCenterY = rowY + rowHeight / 2;
        const isOk = row.status === "ok";

        tableObjects.push(
            scene.add
                .text(chrome.contentX + 6, rowCenterY, String(index + 1), {
                    fontFamily: "Arial",
                    fontSize: 11,
                    color: BODY_TEXT,
                })
                .setOrigin(0, 0.5),
            scene.add
                .text(chrome.contentX + noColWidth, rowCenterY, row.label, {
                    fontFamily: "Arial",
                    fontSize: 11,
                    color: DARK_NAVY,
                    wordWrap: { width: labelColWidth - 6 },
                })
                .setOrigin(0, 0.5),
            scene.add
                .text(
                    chrome.contentX + noColWidth + labelColWidth + statusColWidth / 2,
                    rowCenterY,
                    isOk ? "✅" : "⚠️",
                    { fontFamily: "Arial", fontSize: 13 },
                )
                .setOrigin(0.5),
            scene.add
                .text(
                    chrome.contentX + noColWidth + labelColWidth + statusColWidth,
                    rowCenterY,
                    row.note,
                    {
                        fontFamily: "Arial",
                        fontSize: 11,
                        color: isOk ? "#1f8d52" : "#c0392b",
                        wordWrap: { width: noteColWidth - 6 },
                    },
                )
                .setOrigin(0, 0.5),
        );
    });

    return [...chrome.view, pill, pillLabel, pillValue, ...tableObjects];
}
