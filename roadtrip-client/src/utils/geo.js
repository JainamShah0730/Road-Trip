const EARTH_RADIUS = 6371000;

export function latLngToXZ(lat, lng, originLat, originLng) {
    const latRad = (originLat * Math.PI) / 180;
    const x = (lng - originLng) * Math.cos(latRad) * (Math.PI / 180) * EARTH_RADIUS;
    const z = -(lat - originLat) * (Math.PI / 180) * EARTH_RADIUS;
    return [x, z];
}