/** Minimal 3D vector math for the ship structure viewer. Pure functions only —
 * geometry built from these is never mutated in place once created. */
export interface Vec3 {
    x: number;
    y: number;
    z: number;
}

export const vec3 = (x: number, y: number, z: number): Vec3 => ({ x, y, z });

export function add(a: Vec3, b: Vec3): Vec3 {
    return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

export function sub(a: Vec3, b: Vec3): Vec3 {
    return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

export function scale(a: Vec3, s: number): Vec3 {
    return { x: a.x * s, y: a.y * s, z: a.z * s };
}

export function cross(a: Vec3, b: Vec3): Vec3 {
    return {
        x: a.y * b.z - a.z * b.y,
        y: a.z * b.x - a.x * b.z,
        z: a.x * b.y - a.y * b.x,
    };
}

export function length(a: Vec3): number {
    return Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
}

export function normalize(a: Vec3): Vec3 {
    const len = length(a) || 1;
    return scale(a, 1 / len);
}

export function average(points: Vec3[]): Vec3 {
    const sum = points.reduce((acc, p) => add(acc, p), vec3(0, 0, 0));
    return scale(sum, 1 / points.length);
}

export function faceNormal(vertices: Vec3[]): Vec3 {
    const edge1 = sub(vertices[1], vertices[0]);
    const edge2 = sub(vertices[2], vertices[0]);
    return normalize(cross(edge1, edge2));
}

export interface Bounds3D {
    min: Vec3;
    max: Vec3;
}

export function boundsOf(points: Vec3[]): Bounds3D {
    const min = { x: Infinity, y: Infinity, z: Infinity };
    const max = { x: -Infinity, y: -Infinity, z: -Infinity };

    for (const p of points) {
        min.x = Math.min(min.x, p.x);
        min.y = Math.min(min.y, p.y);
        min.z = Math.min(min.z, p.z);
        max.x = Math.max(max.x, p.x);
        max.y = Math.max(max.y, p.y);
        max.z = Math.max(max.z, p.z);
    }

    return { min, max };
}

export function boundsCenter(bounds: Bounds3D): Vec3 {
    return scale(add(bounds.min, bounds.max), 0.5);
}
