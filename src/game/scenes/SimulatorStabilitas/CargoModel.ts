export interface CargoType {
    label: string;
    color: number;
    weight: number;
}

export const CARGO_TYPES: CargoType[] = [
    { label: "5 TON", color: 0x8a97a8, weight: 5 },
    { label: "10 TON", color: 0x2f68d8, weight: 10 },
    { label: "15 TON", color: 0xc0392b, weight: 15 },
    { label: "20 TON", color: 0xd68a1f, weight: 20 },
    { label: "25 TON", color: 0x3f9a5c, weight: 25 },
];

export type ZoneKey = "geladak-atas" | "palka-bawah";

export interface PlacedCargo {
    id: number;
    cargo: CargoType;
}

// ---- Simplified naval-architecture model --------------------------------
// KM is treated as roughly constant across this small loading range (a
// reasonable classroom simplification). KG shifts with where cargo is
// placed: loading the upper deck raises KG (lower GM, closer to "oleng"),
// while loading the lower hold lowers KG (higher GM, more stable) — the
// same trade-off real cargo planners have to manage.
export const LIGHT_SHIP_WEIGHT = 2000; // ton — bobot kapal kosong (light ship)
export const LIGHT_SHIP_KG = 4.2; // m — titik berat kapal kosong di atas lunas
export const KM_METACENTER = 8.2; // m — tinggi metacenter di atas lunas
export const UPPER_DECK_VCG = 9.5; // m — titik berat muatan di geladak atas
export const LOWER_HOLD_VCG = 2.0; // m — titik berat muatan di palka bawah
export const MIN_STABLE_GM = 0.15; // m — ambang GM minimum agar kapal dinyatakan stabil
export const GM_ANSWER_TOLERANCE = 0.05; // m — toleransi penilaian jawaban GM

// `Phaser.Math.Clamp` needs the global `Phaser` namespace, which these files
// never import (only named exports) — use a local clamp instead.
export const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export interface StabilityResult {
    km: number;
    kg: number;
    gm: number;
    isStable: boolean;
    /** Illustrative hull list angle, in degrees. */
    listAngle: number;
}

/** Recomputes KG from wherever cargo currently sits — upper-deck cargo
 * raises KG (VCG 9.5m), lower-hold cargo lowers it (VCG 2.0m) — then
 * derives GM = KM - KG. Everything the scene displays (KM/KG fields,
 * STABIL/OLENG pill, list angle, hull tilt, graph) is driven from this one
 * result instead of independent static placeholders. */
export function computeStability(upperWeight: number, lowerWeight: number): StabilityResult {
    const totalWeight = LIGHT_SHIP_WEIGHT + upperWeight + lowerWeight;
    const momentSum =
        LIGHT_SHIP_WEIGHT * LIGHT_SHIP_KG +
        upperWeight * UPPER_DECK_VCG +
        lowerWeight * LOWER_HOLD_VCG;
    const kg = momentSum / totalWeight;
    const gm = KM_METACENTER - kg;
    const isStable = gm >= MIN_STABLE_GM;

    // Baseline GM (no cargo) is ~4.0m; the further GM sinks below that, the
    // harder the ship lists. Direction just reflects which zone is
    // currently heavier, for visual variety.
    const gmDeficit = Math.max(0, KM_METACENTER - LIGHT_SHIP_KG - gm);
    const direction = upperWeight - lowerWeight < 0 ? -1 : 1;
    const listAngle = clamp(gmDeficit * 6 * direction, -25, 25);

    return { km: KM_METACENTER, kg, gm, isStable, listAngle };
}
