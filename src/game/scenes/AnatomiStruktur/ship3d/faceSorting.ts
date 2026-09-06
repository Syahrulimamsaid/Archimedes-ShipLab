import { projectPoint } from "./orbitCamera";
import { Face3D, OrbitCamera, ProjectedFace } from "./types";

/** Projects every face's vertices and sorts back-to-front (painter's
 * algorithm) using each face's average depth. Geometry itself never changes
 * here — only the projected 2D points and the sort order are recomputed,
 * which is what makes this cheap enough to call on every orbit frame. */
export function projectAndSortFaces(
    faces: Face3D[],
    camera: OrbitCamera,
    centerX: number,
    centerY: number,
): ProjectedFace[] {
    const projected: ProjectedFace[] = faces.map((face) => {
        let depthSum = 0;
        const points = face.vertices.map((vertex) => {
            const { screen, depth } = projectPoint(vertex, camera, centerX, centerY);
            depthSum += depth;
            return screen;
        });

        return { face, points, depth: depthSum / face.vertices.length };
    });

    projected.sort((a, b) => b.depth - a.depth);

    return projected;
}
