import { useEffect, useState, useCallback } from 'react';
import { overlayStyle, primaryButtonStyle, theme } from './uiTheme';

const TIME_LIMIT = 6; // seconds
const CLICK_BOOST = 6;
const DECAY_PER_TICK = 1.5;
const TICK_MS = 100;

function FishingMinigame({ onComplete, onClose }) {
    const [progress, setProgress] = useState(0);
    const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
    const [finished, setFinished] = useState(false);

    // Countdown + decay loop
    useEffect(() => {
        if (finished) return;

        const interval = setInterval(() => {
            setProgress(p => Math.max(0, p - DECAY_PER_TICK));
            setTimeLeft(t => {
                const next = t - TICK_MS / 1000;
                if (next <= 0) {
                    setFinished(true);
                    return 0;
                }
                return next;
            });
        }, TICK_MS);

        return () => clearInterval(interval);
    }, [finished]);

    // Check for success as progress updates
    useEffect(() => {
        if (progress >= 100 && !finished) {
            setFinished(true);
        }
    }, [progress, finished]);

    // Report result once finished
    useEffect(() => {
        if (finished) {
            const success = progress >= 100;
            const score = success ? Math.round(timeLeft * 20) : 0;
            const timer = setTimeout(() => onComplete({ success, score }), 900);
            return () => clearTimeout(timer);
        }
    }, [finished]);

    const handleMash = useCallback(() => {
        if (finished) return;
        setProgress(p => Math.min(100, p + CLICK_BOOST));
    }, [finished]);

    useEffect(() => {
        const handleKey = (e) => { if (e.code === 'Space') handleMash(); };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [handleMash]);

    return (
        <div style={overlayStyle}>
            {!finished ? (
                <>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>🎣</div>
                    <div style={{ fontSize: 18, marginBottom: 20, fontWeight: 500 }}>Mash SPACE or click to reel it in!</div>
                    <div style={{ width: 300, height: 20, background: 'rgba(255,255,255,0.1)', borderRadius: theme.radius.pill, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{
                            width: `${progress}%`, height: '100%', background: theme.colors.success,
                            transition: 'width 0.1s linear', borderRadius: theme.radius.pill
                        }} />
                    </div>
                    <div style={{ marginTop: 10, fontSize: 13, color: theme.colors.textMuted }}>{timeLeft.toFixed(1)}s left</div>
                    <button onClick={handleMash} style={{ ...primaryButtonStyle(theme.colors.accent), marginTop: 28 }}>
                        Reel!
                    </button>
                    <button onClick={onClose} style={{ marginTop: 14, background: 'none', border: 'none', color: theme.colors.textMuted, fontSize: 12, cursor: 'pointer' }}>
                        cancel
                    </button>
                </>
            ) : (
                <>
                    <div style={{ fontSize: 40, marginBottom: 8 }}>{progress >= 100 ? '🐟' : '💨'}</div>
                    <div style={{ fontSize: 22, fontWeight: 500 }}>
                        {progress >= 100 ? 'Caught one!' : 'It got away...'}
                    </div>
                </>
            )}
        </div>
    );
}

export default FishingMinigame;