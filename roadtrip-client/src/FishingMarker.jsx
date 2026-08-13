import { latLngToXZ } from './utils/geo';
import { FISHING_SPOT } from './ActivityZone';

function FishingMarker({ origin }) {
    if (!origin) return null;

    const [x, z] = latLngToXZ(FISHING_SPOT.lat, FISHING_SPOT.lng, origin.lat, origin.lng);

    return (
        <mesh position={[x, 3, z]}>
            <coneGeometry args={[1, 3, 8]} />
            <meshStandardMaterial color="#FFD23F" />
        </mesh>
    );
}

export default FishingMarker;