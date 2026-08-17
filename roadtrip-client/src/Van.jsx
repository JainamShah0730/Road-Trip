import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from 'three';
import { useKeyboardControls } from "./useKeyboardControls";
import { socket } from "./socket";
import { useGLTF } from '@react-three/drei';
useGLTF.preload('/models/van.glb');

const SPEED = 10;
const TURN_SPEED = 4;

function Van({ onPositionUpdate }) {
    const { scene } = useGLTF('/models/van.glb');
    const meshRef = useRef()
    const keys = useKeyboardControls();
    const { camera } = useThree();
    const rotationY = useRef(0)

    useFrame((state, delta) => {
        if (!meshRef.current) return;

        let velocity = 0;
        if (keys.current.forward) velocity = SPEED;
        else if (keys.current.backward) velocity = -SPEED * 0.5;

        if (keys.current.left) rotationY.current += TURN_SPEED * delta;
        if (keys.current.right) rotationY.current -= TURN_SPEED * delta;


        meshRef.current.rotation.y = rotationY.current;
        meshRef.current.position.x += Math.sin(rotationY.current) * velocity * delta;
        meshRef.current.position.z += Math.cos(rotationY.current) * velocity * delta;

        const camOffset = new THREE.Vector3(
            -Math.sin(rotationY.current) * 14,
            10,
            -Math.cos(rotationY.current) * 14
        );
        const targetCamPos = meshRef.current.position.clone().add(camOffset);
        camera.position.lerp(targetCamPos, 0.1);

        const lookTarget = meshRef.current.position.clone();
        lookTarget.y = 6; // look toward the horizon, not down at the van
        camera.lookAt(lookTarget);
        if (!Van.lastEmit || state.clock.elapsedTime - Van.lastEmit > 0.05) {
            Van.lastEmit = state.clock.elapsedTime;
            const pos = {
                x: meshRef.current.position.x,
                y: meshRef.current.position.y,
                z: meshRef.current.position.z,
                rotationY: rotationY.current
            }
            socket.emit('position-update', pos)
            onPositionUpdate?.(pos)
        }
    })

    return (
        <primitive
            ref={meshRef}
            object={scene}
            position={[0, 0, 0]}
            scale={0.6}
        />
    )
}

export default Van;