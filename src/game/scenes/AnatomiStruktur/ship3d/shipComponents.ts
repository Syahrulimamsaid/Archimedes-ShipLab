import { buildShipGeometry } from "./shipGeometry";
import { ShipComponent, ShipComponentId } from "./types";

/** Archimedes-ShipLab flat-educational-vector palette for the double-bottom
 * viewer. Visual state (hover/selected/inactive) is layered on top of these
 * base colors at render time — geometry and color stay separate from that
 * state, same as HULL_COMPONENTS keeps material specs separate from it. */
export const OUTLINE_COLOR = 0x123b70;
export const SELECTED_COLOR = 0x1677ff;

const BASE_COLORS: Record<ShipComponentId, number> = {
    "gading-gading": 0xf59e0b,
    "tank-side-bracket": 0x808b4f,
    "lempeng-samping": 0xd9e4ef,
    longitudinals: 0xc2703d,
    "centre-girder": 0x64748b,
    bracket: 0x8f7bb0,
    "wrang-penuh": 0x5dd9e7,
    "wrang-terbuka": 0x5dd9e7,
    "tank-top": 0xd9e4ef,
};

/** Numbers/labels mirror HULL_COMPONENTS in HullComponentsData.ts so the
 * viewer's numbered chips match the info window's badge numbers. */
const META: Record<ShipComponentId, { number: number; label: string; englishLabel: string }> = {
    "gading-gading": { number: 1, label: "Gading-gading", englishLabel: "Frame" },
    "tank-side-bracket": { number: 2, label: "Tank Side Bracket", englishLabel: "Tank Side Bracket" },
    "lempeng-samping": { number: 3, label: "Lempeng Samping", englishLabel: "Margin Plate" },
    longitudinals: { number: 4, label: "Longitudinals", englishLabel: "Longitudinals" },
    "centre-girder": { number: 5, label: "Penyangga Tengah", englishLabel: "Centre Girder" },
    bracket: { number: 6, label: "Bracket", englishLabel: "Bracket" },
    "wrang-penuh": { number: 7, label: "Wrang Penuh", englishLabel: "Solid Floor" },
    "wrang-terbuka": { number: 8, label: "Wrang Terbuka", englishLabel: "Open Floor" },
    "tank-top": { number: 9, label: "Pelat Tank Top", englishLabel: "Tank Top Plating" },
};

export function buildShipComponents(): ShipComponent[] {
    const geometry = buildShipGeometry();

    return (Object.keys(META) as ShipComponentId[])
        .map((id) => ({
            id,
            ...META[id],
            geometry: geometry[id],
            baseColor: BASE_COLORS[id],
        }))
        .sort((a, b) => a.number - b.number);
}
