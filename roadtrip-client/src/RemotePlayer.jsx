
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import { useRef, useEffect, useMemo } from 'react';

const LERP_SPEED = 8; // higher = snappier, lower = smoother but more "laggy" feeling

function RemotePlayer({ player }) {
    const { scene } = useGLTF('/models/van.glb');
    const clonedScene = useMemo(() => scene.clone(), [scene]);
    const meshRef = useRef();
    const targetPos = useRef(new THREE.Vector3(player.x, player.y, player.z));
    const targetRotY = useRef(player.rotationY || 0);

    // Update the target whenever a new position arrives from the server
    useEffect(() => {
        targetPos.current.set(player.x, player.y, player.z);
        targetRotY.current = player.rotationY || 0;
    }, [player.x, player.y, player.z, player.rotationY]);

    // Every frame, smoothly move toward the latest target instead of snapping
    useFrame((state, delta) => {
        if (!meshRef.current) return;
        const t = 1 - Math.pow(0.001, delta * LERP_SPEED); // frame-rate independent smoothing factor
        meshRef.current.position.lerp(targetPos.current, t);

        // Smoothly rotate too (simple lerp works fine for small angle changes)
        meshRef.current.rotation.y += (targetRotY.current - meshRef.current.rotation.y) * t;
    });

    return (
        <primitive
            ref={meshRef}
            object={clonedScene}
            position={[player.x, player.y, player.z]}
            scale={0.6}
        />
    );
}

export default RemotePlayer;