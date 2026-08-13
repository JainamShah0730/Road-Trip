import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from 'three';
import { useKeyboardControls } from "./useKeyboardControls";
import { socket } from "./socket";
const SPEED = 8;
const TURN_SPEED = 2;

function Van({ onPositionUpdate }) {
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
            -Math.sin(rotationY.current) * 10,
            6,
            -Math.cos(rotationY.current) * 10
        );
        const targetCamPos = meshRef.current.position.clone().add(camOffset);
        camera.position.lerp(targetCamPos, 0.1);
        camera.lookAt(meshRef.current.position)

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
        <mesh ref={meshRef} position={[0, 0.5, 0]}>
            <boxGeometry args={[1, 1, 2]} />
            <meshStandardMaterial color="#D85A30" />
        </mesh>
    )
}

export default Van;