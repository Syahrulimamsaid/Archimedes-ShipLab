/** Small integer-color helpers used to turn a component's base color into a
 * shaded / hovered / dimmed variant without ever touching real lighting. */

function clampChannel(v: number): number {
    return Math.max(0, Math.min(255, Math.round(v)));
}

function toChannels(color: number) {
    return {
        r: (color >> 16) & 0xff,
        g: (color >> 8) & 0xff,
        b: color & 0xff,
    };
}

function fromChannels(r: number, g: number, b: number): number {
    return (clampChannel(r) << 16) | (clampChannel(g) << 8) | clampChannel(b);
}

/** Multiplies each channel by a fixed shade factor (the static per-face-
 * direction tint — see primitives.ts). */
export function shadeColor(color: number, shade: number): number {
    const { r, g, b } = toChannels(color);
    return fromChannels(r * shade, g * shade, b * shade);
}

/** Lerps each channel toward white — used for the hover highlight. */
export function lighten(color: number, amount: number): number {
    const { r, g, b } = toChannels(color);
    return fromChannels(
        r + (255 - r) * amount,
        g + (255 - g) * amount,
        b + (255 - b) * amount,
    );
}

/** Lerps each channel toward its grayscale luminance — a cheap stand-in for
 * `filter: saturate()` on inactive/unselected components. */
export function desaturate(color: number, amount: number): number {
    const { r, g, b } = toChannels(color);
    const gray = r * 0.3 + g * 0.59 + b * 0.11;
    return fromChannels(
        r + (gray - r) * amount,
        g + (gray - g) * amount,
        b + (gray - b) * amount,
    );
}
