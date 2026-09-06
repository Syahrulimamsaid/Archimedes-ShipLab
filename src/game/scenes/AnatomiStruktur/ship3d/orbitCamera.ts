import { sub, Vec3, vec3 } from "./vec3";
import { OrbitCamera, Vec2 } from "./types";

const DEG = Math.PI / 180;

export const PITCH_MIN = -10 * DEG;
export const PITCH_MAX = 65 * DEG;

export function defaultCamera(target: Vec3 = vec3(0, 0, 90)): OrbitCamera {
    return {
        yaw: -35 * DEG,
        pitch: 20 * DEG,
        zoom: 1,
        target,
    };
}

export function clampPitch(pitch: number): number {
    return Math.min(PITCH_MAX, Math.max(PITCH_MIN, pitch));
}

/** Named viewpoints for the toolbar. Only yaw/pitch are prescribed here —
 * target/zoom are left to whatever the camera currently has, since presets
 * are meant to reorient the view, not recenter or reframe it. */
export const CAMERA_PRESETS: Record<string, { yaw: number; pitch: number }> = {
    depan: { yaw: 0, pitch: 0 },
    samping: { yaw: 90 * DEG, pitch: 0 },
    atas: { yaw: -35 * DEG, pitch: PITCH_MAX },
    isometrik: { yaw: -35 * DEG, pitch: 25 * DEG },
};

/**
 * world point -> translate to camera target -> yaw around Z -> pitch around
 * the (already-yawed) X axis -> orthographic drop of the depth axis -> zoom
 * -> translate to the SVG/canvas center. No perspective divide anywhere.
 *
 * Returns the depth (distance along the camera's view axis) alongside the
 * screen position so callers can paint back-to-front without a second pass.
 */
export function projectPoint(
    point: Vec3,
    camera: OrbitCamera,
    centerX: number,
    centerY: number,
): { screen: Vec2; depth: number } {
    const d = sub(point, camera.target);

    const cosYaw = Math.cos(camera.yaw);
    const sinYaw = Math.sin(camera.yaw);
    const x1 = d.x * cosYaw - d.y * sinYaw;
    const y1 = d.x * sinYaw + d.y * cosYaw;
    const z1 = d.z;

    const cosPitch = Math.cos(camera.pitch);
    const sinPitch = Math.sin(camera.pitch);
    const y2 = y1 * cosPitch - z1 * sinPitch;
    const z2 = y1 * sinPitch + z1 * cosPitch;

    const screenX = centerX + x1 * camera.zoom;
    const screenY = centerY - z2 * camera.zoom;

    return { screen: { x: screenX, y: screenY }, depth: y2 };
}

