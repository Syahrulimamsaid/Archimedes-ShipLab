import { box3D, extrude, mirrorProfileY, ProfilePoint } from "./primitives";
import { Face3D, ShipComponentId } from "./types";

/**
 * A schematic segment of a double-bottom cross-section — 2 frame/floor
 * stations along a 340-unit length, built once from Box3D and extruded
 * prism/plate primitives. World axes: X = length, Y = width (0 = centreline),
 * Z = height (0 = keel baseline). Nothing here depends on the camera —
 * orbiting only re-projects these fixed vertices.
 */

const LENGTH_HALF = 170;
const TANK_TOP_Z = 172;
const TANK_TOP_THICK = 8;
const TANK_HALF_WIDTH = 130;
const GIRDER_HALF_THICK = 6;

const FLOOR_STATION_OPEN_X = -70;
const FLOOR_STATION_FULL_X = 70;
const FLOOR_HALF_THICK = 7;
// The hull narrows toward the keel and widens toward the tank-top edge (a
// real hull's turn of bilge flares outward going up, not down) — floors are
// approximated as two stacked bands so their rectangular edges stay inside
// that taper instead of poking through the sloped side plate.
const FLOOR_LOWER_HALF_WIDTH = 70;
const FLOOR_UPPER_HALF_WIDTH = 110;
const FLOOR_SPLIT_Z = 55;

const FRAME_STATIONS_X = [-150, -50, 50, 150];
const BRACKET_STATIONS_X = [FLOOR_STATION_OPEN_X, FLOOR_STATION_FULL_X];

// Sloped side plate (margin plate) profile, tank-top edge -> turn of bilge
// -> baseline, for the +Y (starboard) side. Mirrored for -Y (port). Narrows
// going down to the keel, matching a real hull's shape.
const SIDE_PLATE_PROFILE: ProfilePoint[] = [
    { y: TANK_HALF_WIDTH, z: TANK_TOP_Z },
    { y: FLOOR_UPPER_HALF_WIDTH, z: FLOOR_SPLIT_Z },
    { y: FLOOR_LOWER_HALF_WIDTH, z: 0 },
];

function buildTankTop(): Face3D[] {
    return box3D(
        "tank-top",
        { x: -LENGTH_HALF, y: -TANK_HALF_WIDTH, z: TANK_TOP_Z },
        { x: LENGTH_HALF, y: TANK_HALF_WIDTH, z: TANK_TOP_Z + TANK_TOP_THICK },
    );
}

function buildCentreGirder(): Face3D[] {
    return box3D(
        "centre-girder",
        { x: -LENGTH_HALF, y: -GIRDER_HALF_THICK, z: 0 },
        { x: LENGTH_HALF, y: GIRDER_HALF_THICK, z: TANK_TOP_Z },
    );
}

function buildSidePlate(): Face3D[] {
    return [
        ...extrude("lempeng-samping", SIDE_PLATE_PROFILE, -LENGTH_HALF, LENGTH_HALF, false),
        ...extrude(
            "lempeng-samping",
            mirrorProfileY(SIDE_PLATE_PROFILE),
            -LENGTH_HALF,
            LENGTH_HALF,
            false,
        ),
    ];
}

function buildFullFloor(): Face3D[] {
    const x0 = FLOOR_STATION_FULL_X - FLOOR_HALF_THICK;
    const x1 = FLOOR_STATION_FULL_X + FLOOR_HALF_THICK;

    return [
        ...box3D("wrang-penuh", { x: x0, y: -FLOOR_LOWER_HALF_WIDTH, z: 0 }, { x: x1, y: FLOOR_LOWER_HALF_WIDTH, z: FLOOR_SPLIT_Z }),
        ...box3D(
            "wrang-penuh",
            { x: x0, y: -FLOOR_UPPER_HALF_WIDTH, z: FLOOR_SPLIT_Z },
            { x: x1, y: FLOOR_UPPER_HALF_WIDTH, z: TANK_TOP_Z },
        ),
    ];
}

function buildOpenFloor(): Face3D[] {
    const x0 = FLOOR_STATION_OPEN_X - FLOOR_HALF_THICK;
    const x1 = FLOOR_STATION_OPEN_X + FLOOR_HALF_THICK;
    const wLower = FLOOR_LOWER_HALF_WIDTH;
    const wUpper = FLOOR_UPPER_HALF_WIDTH;
    const inset = 15;

    // A border "ring" (top/bottom/left/right strips, each following the
    // same two-band taper as the full floor) around a big lightening
    // opening, in place of true boolean geometry — reads clearly as an open
    // floor without needing polygon-with-hole support.
    return [
        ...box3D("wrang-terbuka", { x: x0, y: -wUpper, z: 155 }, { x: x1, y: wUpper, z: TANK_TOP_Z }),
        ...box3D("wrang-terbuka", { x: x0, y: -wLower, z: 0 }, { x: x1, y: wLower, z: 17 }),
        ...box3D("wrang-terbuka", { x: x0, y: -wLower, z: 17 }, { x: x1, y: -wLower + inset, z: FLOOR_SPLIT_Z }),
        ...box3D("wrang-terbuka", { x: x0, y: -wUpper, z: FLOOR_SPLIT_Z }, { x: x1, y: -wUpper + inset, z: 155 }),
        ...box3D("wrang-terbuka", { x: x0, y: wLower - inset, z: 17 }, { x: x1, y: wLower, z: FLOOR_SPLIT_Z }),
        ...box3D("wrang-terbuka", { x: x0, y: wUpper - inset, z: FLOOR_SPLIT_Z }, { x: x1, y: wUpper, z: 155 }),
    ];
}

function buildLongitudinals(): Face3D[] {
    const faces: Face3D[] = [];
    const offsets = [45, 85];

    for (const offset of offsets) {
        for (const sign of [1, -1]) {
            const y = offset * sign;
            faces.push(
                ...box3D(
                    "longitudinals",
                    { x: -LENGTH_HALF, y: y - 5, z: 158 },
                    { x: LENGTH_HALF, y: y + 5, z: TANK_TOP_Z },
                ),
            );
        }
    }

    return faces;
}

function buildFrames(): Face3D[] {
    const faces: Face3D[] = [];
    const half = 6;

    // A thin trapezoid strip following the hull slope, roughly parallel to
    // the margin plate — narrower near the keel, wider near the tank-top
    // edge, matching SIDE_PLATE_PROFILE's taper.
    const profile: ProfilePoint[] = [
        { y: 122, z: 170 },
        { y: 132, z: 170 },
        { y: 102, z: 50 },
        { y: 92, z: 50 },
    ];

    for (const stationX of FRAME_STATIONS_X) {
        for (const mirror of [false, true]) {
            const p = mirror ? mirrorProfileY(profile) : profile;
            faces.push(...extrude("gading-gading", p, stationX - half, stationX + half, true));
        }
    }

    return faces;
}

function buildTankSideBrackets(): Face3D[] {
    const faces: Face3D[] = [];
    const half = 7;

    const profile: ProfilePoint[] = [
        { y: 105, z: 172 },
        { y: 115, z: 100 },
        { y: 100, z: 130 },
    ];

    for (const stationX of BRACKET_STATIONS_X) {
        for (const mirror of [false, true]) {
            const p = mirror ? mirrorProfileY(profile) : profile;
            faces.push(
                ...extrude("tank-side-bracket", p, stationX - half, stationX + half, true),
            );
        }
    }

    return faces;
}

function buildBrackets(): Face3D[] {
    const faces: Face3D[] = [];
    const half = 7;

    const profile: ProfilePoint[] = [
        { y: GIRDER_HALF_THICK, z: 150 },
        { y: 40, z: TANK_TOP_Z },
        { y: GIRDER_HALF_THICK, z: TANK_TOP_Z },
    ];

    for (const stationX of BRACKET_STATIONS_X) {
        for (const mirror of [false, true]) {
            const p = mirror ? mirrorProfileY(profile) : profile;
            faces.push(...extrude("bracket", p, stationX - half, stationX + half, true));
        }
    }

    return faces;
}

export function buildShipGeometry(): Record<ShipComponentId, Face3D[]> {
    return {
        "tank-top": buildTankTop(),
        "centre-girder": buildCentreGirder(),
        "lempeng-samping": buildSidePlate(),
        "wrang-penuh": buildFullFloor(),
        "wrang-terbuka": buildOpenFloor(),
        longitudinals: buildLongitudinals(),
        "gading-gading": buildFrames(),
        "tank-side-bracket": buildTankSideBrackets(),
        bracket: buildBrackets(),
    };
}
