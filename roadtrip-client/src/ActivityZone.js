export const FISHING_SPOT = { lat: 34.008924, lng: -118.497891 };
export const SURF_SPOT = { lat: 34.0016697, lng: -118.4886589 }
export const ZONE_RADIUS = 15;

export function distance2D(x1, z1, x2, z2) {
    return Math.sqrt((x1 - x2) ** 2 + (z1 - z2) ** 2);
}