import { useEffect, useState, useMemo } from "react";
import { latLngToXZ } from "./utils/geo";
import * as THREE from 'three';

const TILE_URL = 'http://localhost:4000/tile';
const roadWidths = {
    motorway: 6, primary: 5, secondary: 4.5, tertiary: 4,
    residential: 3.5, service: 2.5, footway: 1.2, cycleway: 1.5,
    pedestrian: 2, steps: 1, path: 1, unclassified: 3, construction: 3,
};

const PATH_TYPES = new Set(['footway', 'cycleway', 'pedestrian', 'steps', 'path']);

function buildRibbonVertices(points, width) {
    const verts = [];
    for (let i = 0; i < points.length - 1; i++) {
        const [x1, y1, z1] = points[i];
        const [x2, y2, z2] = points[i + 1];
        const dx = x2 - x1, dz = z2 - z1;
        const len = Math.sqrt(dx * dx + dz * dz) || 1;
        const nx = (-dz / len) * (width / 2);
        const nz = (dx / len) * (width / 2);

        // Two triangles for each segment quad (CCW winding for upward normals)
        // Triangle 1: top-left, bottom-left, top-right
        verts.push(
            x1 + nx, y1, z1 + nz,
            x1 - nx, y1, z1 - nz,
            x2 + nx, y2, z2 + nz,
        );
        // Triangle 2: bottom-left, bottom-right, top-right
        verts.push(
            x1 - nx, y1, z1 - nz,
            x2 - nx, y2, z2 - nz,
            x2 + nx, y2, z2 + nz,
        );
    }
    return verts;
}

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

    // Batch all road and path segments into two merged geometries
    const { roadGeometry, pathGeometry } = useMemo(() => {
        if (!origin || roads.length === 0) return { roadGeometry: null, pathGeometry: null };

        const roadVerts = [];
        const pathVerts = [];

        for (const road of roads) {
            const points = road.points.map(([lat, lng, elevation]) => {
                const [x, z] = latLngToXZ(lat, lng, origin.lat, origin.lng);
                return [x, elevation + 0.03, z];
            });

            if (points.length < 2) continue;

            const width = roadWidths[road.roadType] || 3;
            const isPath = PATH_TYPES.has(road.roadType);
            const target = isPath ? pathVerts : roadVerts;
            target.push(...buildRibbonVertices(points, width));
        }

        const makeGeo = (verts) => {
            if (verts.length === 0) return null;
            const geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verts), 3));
            geo.computeVertexNormals();
            return geo;
        };

        return {
            roadGeometry: makeGeo(roadVerts),
            pathGeometry: makeGeo(pathVerts),
        };
    }, [roads, origin]);

    if (!origin) return null

    return (
        <>
            {roadGeometry && (
                <mesh geometry={roadGeometry}>
                    <meshStandardMaterial color="#4A4A4A" side={THREE.DoubleSide} />
                </mesh>
            )}
            {pathGeometry && (
                <mesh geometry={pathGeometry}>
                    <meshStandardMaterial color="#C7B899" side={THREE.DoubleSide} />
                </mesh>
            )}
        </>
    )
}

export default RoadNetwork