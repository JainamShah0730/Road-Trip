import { Canvas } from '@react-three/fiber';
import { useEffect, useState, useRef, useCallback } from 'react';
import RoadNetwork from './RoadNetwork';
import Van from './Van';
import RemotePlayer from './RemotePlayer';
import { socket } from './socket';
import { latLngToXZ } from './utils/geo';
import { FISHING_SPOT, ZONE_RADIUS, distance2D } from './ActivityZone';
import FishingMarker from './FishingMarker';
import FishingMinigame from './FishingMinigame';

function App() {
  const [remotePlayers, setRemotePlayers] = useState({});
  const [origin, setOrigin] = useState(null);
  const [nearFishingSpot, setNearFishingSpot] = useState(false);
  const [fishingActive, setFishingActive] = useState(false);
  const [lastCatch, setLastCatch] = useState(null);




  // Use refs instead of state for high-frequency updates from useFrame
  const originRef = useRef(null);
  const nearRef = useRef(false);

  // Keep originRef in sync with origin state
  useEffect(() => { originRef.current = origin; }, [origin]);

  // Called ~60fps from Van's useFrame — must NOT call setState on every frame
  const handlePositionUpdate = useCallback((pos) => {
    const orig = originRef.current;
    if (!orig) return;
    const [zoneX, zoneZ] = latLngToXZ(FISHING_SPOT.lat, FISHING_SPOT.lng, orig.lat, orig.lng);
    const dist = distance2D(pos.x, pos.z, zoneX, zoneZ);
    const isNear = dist < ZONE_RADIUS;
    if (isNear !== nearRef.current) {
      nearRef.current = isNear;
      setNearFishingSpot(isNear);
    }
  }, []);

  const handleFishingComplete = (result) => {
    socket.emit('activity-result', { activityType: 'fishing', ...result });
    setFishingActive(false);
  };

  // Socket connection — runs ONCE on mount
  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected to game server:', socket.id);
      socket.emit('join-room', 'TEST123');
    });

    socket.on('room-state', (players) => {
      const others = { ...players };
      delete others[socket.id];
      setRemotePlayers(others);
    });

    socket.on('player-joined', (player) => {
      setRemotePlayers(prev => ({ ...prev, [player.playerId]: player }));
    });

    socket.on('player-left', ({ playerId }) => {
      setRemotePlayers(prev => {
        const next = { ...prev };
        delete next[playerId];
        return next;
      });
    });

    socket.on('player-moved', ({ playerId, x, y, z, rotationY }) => {
      setRemotePlayers(prev => ({
        ...prev,
        [playerId]: { ...prev[playerId], x, y, z, rotationY }
      }));
    });

    socket.on('activity-result-broadcast', (result) => {
      setLastCatch(result);
      setTimeout(() => setLastCatch(null), 3000);
    });

    return () => {
      socket.off('connect');
      socket.off('room-state');
      socket.off('player-joined');
      socket.off('player-left');
      socket.off('player-moved');
      socket.off('activity-result-broadcast');
    };
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas camera={{ position: [0, 8, 12], fov: 60 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1} />

        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[2000, 2000]} />
          <meshStandardMaterial color="#639922" />
        </mesh>

        <RoadNetwork onLoaded={setOrigin} />
        <Van onPositionUpdate={handlePositionUpdate} />

        {Object.entries(remotePlayers).map(([playerId, player]) => (
          <RemotePlayer key={playerId} player={player} />
        ))}
        <FishingMarker origin={origin} />
      </Canvas>
      {nearFishingSpot && !fishingActive && (
        <div
          onClick={() => setFishingActive(true)}
          style={{
            position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.65)', padding: '10px 16px', borderRadius: 8,
            color: '#fff', fontSize: 14, cursor: 'pointer'
          }}
        >
          🎣 Fishing spot nearby — click to fish
        </div>
      )}

      {fishingActive && (
        <FishingMinigame
          onComplete={handleFishingComplete}
          onClose={() => setFishingActive(false)}
        />
      )}

      {lastCatch && (
        <div style={{
          position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.7)', padding: '8px 14px', borderRadius: 8,
          color: '#fff', fontSize: 13
        }}>
          {lastCatch.success ? `🐟 Player caught a fish! (+${lastCatch.score})` : `💨 A fish got away`}
        </div>
      )}
    </div>
  );
}

export default App;