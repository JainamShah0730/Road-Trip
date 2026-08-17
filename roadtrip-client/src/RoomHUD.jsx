import { theme } from './uiTheme';

const AVATAR_COLORS = ['#7F77DD', '#1D9E75', '#D4537E', '#E0A83F', '#4FA8D8'];

function colorForId(id) {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function RoomHUD({ roomCode, myId, remotePlayerIds }) {
    const allIds = [myId, ...remotePlayerIds].filter(Boolean);

    return (
        <div style={{
            position: 'absolute', top: 16, left: 16,
            display: 'flex', alignItems: 'center', gap: 10,
            background: theme.colors.bg, backdropFilter: 'blur(6px)',
            border: '1px solid rgba(255,255,255,0.08)',
            padding: '8px 14px', borderRadius: theme.radius.pill,
            color: theme.colors.text, fontFamily: theme.font,
            boxShadow: theme.shadow,
        }}>
            <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: 0.5 }}>
                Room {roomCode}
            </span>
            <div style={{ display: 'flex' }}>
                {allIds.map((id, i) => (
                    <div
                        key={id}
                        title={id === myId ? 'You' : id}
                        style={{
                            width: 24, height: 24, borderRadius: '50%',
                            background: colorForId(id),
                            border: '2px solid rgba(0,0,0,0.4)',
                            marginLeft: i === 0 ? 0 : -8,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 11, fontWeight: 600, color: 'rgba(0,0,0,0.6)',
                        }}
                    >
                        {id === myId ? 'Y' : id.slice(0, 1).toUpperCase()}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default RoomHUD;