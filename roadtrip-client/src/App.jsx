import { Canvas } from '@react-three/fiber';
import RoadNetwork from './RoadNetwork';
import Van from './Van';
import { useEffect } from 'react';
import { io } from 'socket.io-client';

function App() {

  useEffect(() => {
    const socket = io('http://localhost:5000')

    socket.on('connect', () => {
      console.log('Connected to game server:', socket.id)
      socket.emit('join-room', 'TEST123')
    })

    socket.on('room-state', (players) => {
      console.log("Current room state:", players)
    })

    socket.on('player-joined', (player) => {
      console.log('Player joined:', player)
    })

    socket.on('player-left', ({ playerId }) => {
      console.log('Player left:', playerId)
    })
    return () => socket.disconnect();

  }, [])

  return (

    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas camera={{ position: [0, 8, 12], fov: 60 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1} />

        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[2000, 2000]} />
          <meshStandardMaterial color="#639922" />
        </mesh>

        <RoadNetwork />
        <Van />
      </Canvas>
    </div>
  );

}

export default App;