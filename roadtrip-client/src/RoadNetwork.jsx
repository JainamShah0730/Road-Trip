import { useEffect, useState } from "react";
import { Line } from "@react-three/drei";
import { latLngToXZ } from "./utils/geo";

const TILE_URL = 'http://localhost:4000/tile';

function RoadNetwork({ onLoaded }) {
    const [roads, setRoads] = useState([]);
    const [origin, setOrigin] = useState(null);

    useEffect(() => {
        fetch(TILE_URL)
            .then(res => res.json())
            .then(data => {
                const { bounds } = data;
                const centerLat = (bounds.minLat + bounds.maxLat) / 2;
                const centerLng = (bounds.minLng + bounds.maxLng) / 2;
                setOrigin({ lat: centerLat, lng: centerLng })
                setRoads(data.roads);
                onLoaded?.({ lat: centerLat, lng: centerLng })
            })
            .catch(err => console.error('Failed to load tile:', err))
    }, [])

    if (!origin) return null

    return (
        <>
            {roads.map(road => {
                const points = road.points.map(([lat, lng, elevation]) => {
                    const [x, z] = latLngToXZ(lat, lng, origin.lat, origin.lng)
                    return [x, elevation + 0.02, z]
                })

                return (
                    <Line
                        key={road.id}
                        points={points}
                        color={road.roadType === 'footway' ? '#8a8a8a' : '#ffffff'}
                        lineWidth={2} />
                )
            })}

        </>
    )
}

export default RoadNetwork