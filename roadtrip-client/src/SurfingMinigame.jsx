import { useEffect, useState, useRef, useCallback } from 'react';
import { overlayStyle, primaryButtonStyle, theme } from './uiTheme';

const TARGET_MIN = 60;
const TARGET_MAX = 85;
const SPEED = 90; // % per second the marker moves

function SurfingMinigame({ onComplete, onClose }) {
    const [markerPos, setMarkerPos] = useState(0);
    const [direction, setDirection] = useState(1);
    const [finished, setFinished] = useState(false);
    const [result, setResult] = useState(null);
    const lastTime = useRef(performance.now());

    useEffect(() => {
        if (finished) return;
        let frameId;

        const tick = (now) => {
            const delta = (now - lastTime.current) / 1000;
            lastTime.current = now;

            setMarkerPos(prev => {
                let next = prev + direction * SPEED * delta;
                if (next >= 100) { next = 100; setDirection(-1); }
                if (next <= 0) { next = 0; setDirection(1); }
                return next;
            });

            frameId = requestAnimationFrame(tick);
        };

        frameId = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frameId);
    }, [direction, finished]);

    const handleCatchWave = useCallback(() => {
        if (finished) return;
        const inZone = markerPos >= TARGET_MIN && markerPos <= TARGET_MAX;
        const success = inZone;
        const score = success ? Math.round(100 - Math.abs(((TARGET_MIN + TARGET_MAX) / 2) - markerPos) * 4) : 0;
        setResult({ success, score });
        setFinished(true);
    }, [markerPos, finished]);

    useEffect(() => {
        const handleKey = (e) => { if (e.code === 'Space') handleCatchWave(); };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [handleCatchWave]);

    useEffect(() => {
        if (finished && result) {
            const timer = setTimeout(() => onComplete(result), 900);
            return () => clearTimeout(timer);
        }
    }, [finished, result]);

    return (
        <div style={overlayStyle}>
            {!finished ? (
                <>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>🏄</div>
                    <div style={{ fontSize: 18, marginBottom: 20, fontWeight: 500 }}>Hit SPACE when the marker's in the wave zone!</div>
                    <div style={{ position: 'relative', width: 300, height: 20, background: 'rgba(255,255,255,0.1)', borderRadius: theme.radius.pill, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{
                            position: 'absolute', left: `${TARGET_MIN}%`, width: `${TARGET_MAX - TARGET_MIN}%`, height: '100%',
                            background: theme.colors.success, opacity: 0.6
                        }} />
                        <div style={{
                            position: 'absolute', left: `${markerPos}%`, width: 4, height: '100%',
                            background: '#fff', transform: 'translateX(-2px)'
                        }} />
                    </div>
                    <button onClick={handleCatchWave} style={{ ...primaryButtonStyle('#3FA9F5'), marginTop: 28 }}>
                        Catch the wave!
                    </button>
                    <button onClick={onClose} style={{ marginTop: 14, background: 'none', border: 'none', color: theme.colors.textMuted, fontSize: 12, cursor: 'pointer' }}>
                        cancel
                    </button>
                </>
            ) : (
                <>
                    <div style={{ fontSize: 40, marginBottom: 8 }}>{result?.success ? '🌊' : '💦'}</div>
                    <div style={{ fontSize: 22, fontWeight: 500 }}>
                        {result?.success ? 'Nice wave!' : 'Wiped out...'}
                    </div>
                </>
            )}
        </div>
    );
}

export default SurfingMinigame;