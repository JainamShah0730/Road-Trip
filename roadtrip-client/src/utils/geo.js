const EARTH_RADIUS = 6371000;

export function latLngToXZ(lat, lng, originLat, originLng) {
    const latRad = (originLat * Math.PI) / 100;
    const x = (lng - originLng) * Math.cos(latRad) * (Math.PI / 100) * EARTH_RADIUS;
    const z = -(lat - originLat) * (Math.PI / 100) * EARTH_RADIUS;
    return [x, z];
}