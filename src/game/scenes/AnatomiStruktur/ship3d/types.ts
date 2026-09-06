import { Vec3 } from "./vec3";

/** The 9 labelled double-bottom structural members. Matches the `key` field
 * of HULL_COMPONENTS in HullComponentsData.ts one-to-one so the viewer's
 * onSelectComponent callback can be wired straight into the existing info
 * window / progress tracking without a translation table. */
export type ShipComponentId =
    | "gading-gading"
    | "tank-side-bracket"
    | "lempeng-samping"
    | "longitudinals"
    | "centre-girder"
    | "bracket"
    | "wrang-penuh"
    | "wrang-terbuka"
    | "tank-top";

/** Static shade category based purely on which world axis a face's normal
 * points along — no dynamic light source. */
export type FaceDirection = "top" | "bottom" | "front" | "side";

export interface Face3D {
    componentId: ShipComponentId;
    vertices: Vec3[];
    direction: FaceDirection;
    shade: number;
}

export interface ShipComponent {
    id: ShipComponentId;
    number: number;
    label: string;
    englishLabel: string;
    geometry: Face3D[];
    baseColor: number;
}

export interface Vec2 {
    x: number;
    y: number;
}

export interface OrbitCamera {
    yaw: number;
    pitch: number;
    zoom: number;
    target: Vec3;
}

/** A face after projection: its 2D screen polygon plus the depth used for
 * painter's-algorithm sorting (larger = farther from the camera). */
export interface ProjectedFace {
    face: Face3D;
    points: Vec2[];
    depth: number;
}
