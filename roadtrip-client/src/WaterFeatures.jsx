import { useEffect, useState } from 'react';
import * as THREE from 'three';
import { latLngToXZ } from './utils/geo';

const WATER_URL = 'http://localhost:4000/water';

function buildCoastPolygon(points, width) {
    const shape = new THREE.Shape();
    const offsetPoints = [];

    for (let i = 0; i < points.length; i++) {
        const prev = points[Math.max(i - 1, 0)];
        const next = points[Math.min(i + 1, points.length - 1)];
        const dx = next[0] - prev[0];
        const dz = next[1] - prev[1];
        const len = Math.sqrt(dx * dx + dz * dz) || 1;
        const nx = (dz / len) * width;
        const nz = (-dx / len) * width;
        offsetPoints.push([points[i][0] + nx, points[i][1] + nz]);
    }

    shape.moveTo(points[0][0], points[0][1]);
    points.forEach(([x, z]) => shape.lineTo(x, z));
    for (let i = offsetPoints.length - 1; i >= 0; i--) {
        shape.lineTo(offsetPoints[i][0], offsetPoints[i][1]);
    }
    shape.closePath();
    return shape;
}

function WaterFeatures({ origin }) {
    const [features, setFeatures] = useState([]);

    useEffect(() => {
        fetch(WATER_URL)
            .then(res => res.json())
            .then(data => setFeatures(data.features))
            .catch(err => console.error('Failed to load water features:', err));
    }, []);

    if (!origin) return null;

    const coastlineSegments = features.filter(f => f.waterType === 'coastline');
    const beaches = features.filter(f => f.waterType === 'beach');
    const lakes = features.filter(f => f.waterType === 'water');

    return (
        <>
            {coastlineSegments.map(seg => {
                const points = seg.points.map(([lat, lng]) => latLngToXZ(lat, lng, origin.lat, origin.lng));
                if (points.length < 2) return null;
                const shape = buildCoastPolygon(points, 300);
                return (
                    <mesh key={seg.id} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
                        <shapeGeometry args={[shape]} />
                        <meshStandardMaterial color="#3E7CA6" side={THREE.DoubleSide} />
                    </mesh>
                );
            })}

            {beaches.map(b => {
                const points = b.points.map(([lat, lng]) => latLngToXZ(lat, lng, origin.lat, origin.lng));
                if (points.length < 3) return null;
                const shape = new THREE.Shape();
                shape.moveTo(points[0][0], points[0][1]);
                points.forEach(([x, z]) => shape.lineTo(x, z));
                shape.closePath();
                return (
                    <mesh key={b.id} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
                        <shapeGeometry args={[shape]} />
                        <meshStandardMaterial color="#E4D5A8" side={THREE.DoubleSide} />
                    </mesh>
                );
            })}

            {lakes.map(w => {
                const points = w.points.map(([lat, lng]) => latLngToXZ(lat, lng, origin.lat, origin.lng));
                if (points.length < 3) return null;
                const shape = new THREE.Shape();
                shape.moveTo(points[0][0], points[0][1]);
                points.forEach(([x, z]) => shape.lineTo(x, z));
                shape.closePath();
                return (
                    <mesh key={w.id} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
                        <shapeGeometry args={[shape]} />
                        <meshStandardMaterial color="#3E7CA6" side={THREE.DoubleSide} />
                    </mesh>
                );
            })}
        </>
    );
}

export default WaterFeatures;