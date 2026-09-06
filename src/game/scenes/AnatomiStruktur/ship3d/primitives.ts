import { faceNormal, Vec3 } from "./vec3";
import { Face3D, FaceDirection, ShipComponentId } from "./types";

/** Fixed shade per face orientation — no dynamic light source anywhere.
 * World axes: X = length, Y = width/depth, Z = height. A face whose normal
 * is Z-dominant is the top or bottom of a part; Y-dominant faces read as the
 * "front" of a part in the default pose; X-dominant faces read as its
 * lengthwise "side" ends. */
const SHADE: Record<FaceDirection, number> = {
    top: 1.0,
    front: 0.92,
    side: 0.82,
    bottom: 0.72,
};

function classifyDirection(normal: Vec3): FaceDirection {
    const ax = Math.abs(normal.x);
    const ay = Math.abs(normal.y);
    const az = Math.abs(normal.z);

    if (az >= ax && az >= ay) {
        return normal.z >= 0 ? "top" : "bottom";
    }
    if (ay >= ax) {
        return "front";
    }
    return "side";
}

function makeFace(componentId: ShipComponentId, vertices: Vec3[]): Face3D {
    const direction = classifyDirection(faceNormal(vertices));
    return { componentId, vertices, direction, shade: SHADE[direction] };
}

/** An axis-aligned box (Beam / Plate / Box3D) spanning [min, max]. Produces
 * 6 quad faces. */
export function box3D(componentId: ShipComponentId, min: Vec3, max: Vec3): Face3D[] {
    const a = { x: min.x, y: min.y, z: min.z }; // back-left-bottom
    const b = { x: max.x, y: min.y, z: min.z }; // back-right-bottom
    const c = { x: max.x, y: max.y, z: min.z }; // front-right-bottom
    const dd = { x: min.x, y: max.y, z: min.z }; // front-left-bottom
    const e = { x: min.x, y: min.y, z: max.z }; // back-left-top
    const f = { x: max.x, y: min.y, z: max.z }; // back-right-top
    const g = { x: max.x, y: max.y, z: max.z }; // front-right-top
    const h = { x: min.x, y: max.y, z: max.z }; // front-left-top

    return [
        makeFace(componentId, [e, f, g, h]), // top (+Z)
        makeFace(componentId, [dd, c, b, a]), // bottom (-Z)
        makeFace(componentId, [a, b, f, e]), // -Y
        makeFace(componentId, [c, dd, h, g]), // +Y
        makeFace(componentId, [dd, a, e, h]), // -X
        makeFace(componentId, [b, c, g, f]), // +X
    ];
}

export interface ProfilePoint {
    y: number;
    z: number;
}

/**
 * Extrudes a 2D profile (in the Y-Z plane) along X from x0 to x1 — covers
 * both Prism3D (closed profile, solid gusset/beam cross-section) and
 * ExtrudedPlate/ExtrudedPolygon (open profile, a thin surface like a sloped
 * plate with no real thickness).
 *
 * `closed`: when true the last profile point connects back to the first and
 * both ends are capped with a filled polygon, producing a solid prism. When
 * false the profile is treated as an open surface (no caps, no closing edge).
 */
export function extrude(
    componentId: ShipComponentId,
    profile: ProfilePoint[],
    x0: number,
    x1: number,
    closed: boolean,
): Face3D[] {
    const faces: Face3D[] = [];
    const segmentCount = closed ? profile.length : profile.length - 1;

    for (let i = 0; i < segmentCount; i++) {
        const p0 = profile[i];
        const p1 = profile[(i + 1) % profile.length];

        const v0 = { x: x0, y: p0.y, z: p0.z };
        const v1 = { x: x1, y: p0.y, z: p0.z };
        const v2 = { x: x1, y: p1.y, z: p1.z };
        const v3 = { x: x0, y: p1.y, z: p1.z };

        faces.push(makeFace(componentId, [v0, v1, v2, v3]));
    }

    if (closed) {
        const startCap = profile.map((p) => ({ x: x0, y: p.y, z: p.z }));
        const endCap = [...profile].reverse().map((p) => ({ x: x1, y: p.y, z: p.z }));
        faces.push(makeFace(componentId, startCap));
        faces.push(makeFace(componentId, endCap));
    }

    return faces;
}

/** Mirrors a profile across the centreline (Y = 0) — used to build the
 * port/starboard pair of a symmetric part from one authored profile. */
export function mirrorProfileY(profile: ProfilePoint[]): ProfilePoint[] {
    return profile.map((p) => ({ y: -p.y, z: p.z }));
}
