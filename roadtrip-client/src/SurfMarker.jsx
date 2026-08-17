import { latLngToXZ } from './utils/geo';
import { SURF_SPOT } from './ActivityZone';

function SurfMarker({ origin }) {
    if (!origin) return null;

    const [x, z] = latLngToXZ(SURF_SPOT.lat, SURF_SPOT.lng, origin.lat, origin.lng);

    return (
        <mesh position={[x, 3, z]}>
            <coneGeometry args={[1, 3, 8]} />
            <meshStandardMaterial color="#3FA9F5" />
        </mesh>
    );
}

export default SurfMarker;