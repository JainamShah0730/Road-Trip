import { useEffect, useState, useCallback } from 'react';

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
        <div style={{
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            color: '#fff', zIndex: 10
        }}>
            {!finished ? (
                <>
                    <div style={{ fontSize: 18, marginBottom: 16 }}>🎣 Mash SPACE or click to reel it in!</div>
                    <div style={{ width: 280, height: 24, background: '#333', borderRadius: 12, overflow: 'hidden' }}>
                        <div style={{
                            width: `${progress}%`, height: '100%', background: '#1D9E75',
                            transition: 'width 0.1s linear'
                        }} />
                    </div>
                    <div style={{ marginTop: 8, fontSize: 13, opacity: 0.7 }}>{timeLeft.toFixed(1)}s left</div>
                    <button
                        onClick={handleMash}
                        style={{
                            marginTop: 24, padding: '14px 28px', fontSize: 16, borderRadius: 10,
                            background: '#D85A30', color: '#fff', border: 'none', cursor: 'pointer'
                        }}
                    >
                        Reel!
                    </button>
                    <button onClick={onClose} style={{ marginTop: 16, background: 'none', border: 'none', color: '#aaa', fontSize: 12, cursor: 'pointer' }}>
                        cancel
                    </button>
                </>
            ) : (
                <div style={{ fontSize: 22 }}>
                    {progress >= 100 ? '🐟 Caught one!' : '💨 It got away...'}
                </div>
            )}
        </div>
    );
}

export default FishingMinigame;