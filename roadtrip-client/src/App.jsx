import { Canvas } from '@react-three/fiber';
import { useEffect, useState, useRef, useCallback } from 'react';
import RoadNetwork from './RoadNetwork';
import Van from './Van';
import RemotePlayer from './RemotePlayer';
import { socket } from './socket';
import { latLngToXZ } from './utils/geo';
import { FISHING_SPOT, SURF_SPOT, ZONE_RADIUS, distance2D } from './ActivityZone';
import FishingMarker from './FishingMarker';
import FishingMinigame from './FishingMinigame';
import SurfMarker from './SurfMarker';
import SurfingMinigame from './SurfingMinigame';
import { bannerStyle, theme } from './uiTheme';
import RoomHUD from './RoomHUD';
import { Suspense } from 'react';
import WaterFeatures from './WaterFeatures';

function App() {
  const [remotePlayers, setRemotePlayers] = useState({});
  const [origin, setOrigin] = useState(null);
  const [nearFishingSpot, setNearFishingSpot] = useState(false);
  const [fishingActive, setFishingActive] = useState(false);
  const [lastCatch, setLastCatch] = useState(null);
  const [nearSurfSpot, setNearSurfSpot] = useState(false);
  const [surfingActive, setSurfingActive] = useState(false);





  // Use refs instead of state for high-frequency updates from useFrame
  const originRef = useRef(null);
  const nearRef = useRef(false);
  const nearSurfRef = useRef(false);

  // Keep originRef in sync with origin state
  useEffect(() => { originRef.current = origin; }, [origin]);

  // Called ~60fps from Van's useFrame — must NOT call setState on every frame
  const handlePositionUpdate = useCallback((pos) => {
    const orig = originRef.current;
    if (!orig) return;

    const [fishX, fishZ] = latLngToXZ(FISHING_SPOT.lat, FISHING_SPOT.lng, orig.lat, orig.lng);
    const fishDist = distance2D(pos.x, pos.z, fishX, fishZ);
    const isNearFish = fishDist < ZONE_RADIUS;
    if (isNearFish !== nearRef.current) {
      nearRef.current = isNearFish;
      setNearFishingSpot(isNearFish);
    }

    const [surfX, surfZ] = latLngToXZ(SURF_SPOT.lat, SURF_SPOT.lng, orig.lat, orig.lng);
    const surfDist = distance2D(pos.x, pos.z, surfX, surfZ);
    const isNearSurf = surfDist < ZONE_RADIUS;
    if (isNearSurf !== nearSurfRef.current) {
      nearSurfRef.current = isNearSurf;
      setNearSurfSpot(isNearSurf);
    }
  }, []);

  const handleFishingComplete = (result) => {
    socket.emit('activity-result', { activityType: 'fishing', ...result });
    setFishingActive(false);
  };

  const handleSurfingComplete = (result) => {
    socket.emit('activity-result', { activityType: 'surfing', ...result });
    setSurfingActive(false);
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
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Canvas camera={{ position: [0, 8, 12], fov: 60 }}>
        <color attach="background" args={['#8FC9E8']} />
        <Suspense fallback={null}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[10, 10, 5]} intensity={1} />

          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[2000, 2000]} />
            <meshStandardMaterial color="#9BA779" />
          </mesh>

          {/* Beach strip */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-420, 0.01, 0]}>
            <planeGeometry args={[80, 2000]} />
            <meshStandardMaterial color="#E4D5A8" />
          </mesh>

          {/* Ocean */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-900, 0.005, 0]}>
            <planeGeometry args={[900, 2000]} />
            <meshStandardMaterial color="#3E7CA6" />
          </mesh>

          <RoadNetwork onLoaded={setOrigin} />
          <Van onPositionUpdate={handlePositionUpdate} />

          {Object.entries(remotePlayers).map(([playerId, player]) => (
            <RemotePlayer key={playerId} player={player} />
          ))}
          <FishingMarker origin={origin} />
          <SurfMarker origin={origin} />
          <WaterFeatures origin={origin} />
        </Suspense>
      </Canvas>
      <RoomHUD
        roomCode="TEST123"
        myId={socket.id}
        remotePlayerIds={Object.keys(remotePlayers)}
      />

      {(nearFishingSpot || nearSurfSpot) && !fishingActive && !surfingActive && (
        <div
          onClick={() => nearFishingSpot ? setFishingActive(true) : setSurfingActive(true)}
          style={{
            ...bannerStyle,
            position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateX(-50%) translateY(-2px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateX(-50%)'}
        >
          <span style={{ fontSize: 20 }}>{nearFishingSpot ? '🎣' : '🏄'}</span>
          <span>{nearFishingSpot ? 'Fishing spot nearby' : 'Surf spot nearby'}</span>
          <span style={{ color: theme.colors.textMuted, fontSize: 12 }}>· click to start</span>
        </div>
      )}

      {fishingActive && (
        <FishingMinigame
          onComplete={handleFishingComplete}
          onClose={() => setFishingActive(false)}
        />
      )}

      {surfingActive && (
        <SurfingMinigame
          onComplete={handleSurfingComplete}
          onClose={() => setSurfingActive(false)}
        />
      )}

      {lastCatch && (
        <div style={{
          position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
          ...bannerStyle, padding: '8px 14px', fontSize: 13,
        }}>
          {lastCatch.activityType === 'fishing'
            ? (lastCatch.success ? `🐟 Player caught a fish! (+${lastCatch.score})` : `💨 A fish got away`)
            : (lastCatch.success ? `🌊 Player caught a wave! (+${lastCatch.score})` : `💦 Player wiped out`)}
        </div>
      )}


    </div>
  );
}

export default App;