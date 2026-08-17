// Shared design tokens for the game HUD — warm, sunset road-trip palette
export const theme = {
    colors: {
        bg: 'rgba(20, 16, 14, 0.78)',
        bgSolid: '#1a1512',
        accent: '#D85A30',      // van orange
        accentHover: '#c94f28',
        fish: '#3FA9F5',        // ocean blue
        surf: '#3FA9F5',
        success: '#4CAF7D',
        fail: '#E0684A',
        text: '#FFF8F0',
        textMuted: 'rgba(255,248,240,0.65)',
    },
    radius: {
        sm: 8,
        md: 14,
        lg: 20,
        pill: 999,
    },
    shadow: '0 8px 24px rgba(0,0,0,0.35)',
    font: `'Segoe UI', system-ui, sans-serif`,
};

export const bannerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: theme.colors.bg,
    backdropFilter: 'blur(6px)',
    border: '1px solid rgba(255,255,255,0.08)',
    padding: '12px 20px',
    borderRadius: theme.radius.pill,
    color: theme.colors.text,
    fontFamily: theme.font,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    boxShadow: theme.shadow,
    transition: 'transform 0.15s ease, background 0.15s ease',
};

export const overlayStyle = {
    position: 'absolute',
    inset: 0,
    background: 'rgba(10, 8, 7, 0.82)',
    backdropFilter: 'blur(3px)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: theme.colors.text,
    fontFamily: theme.font,
    zIndex: 10,
};

export const primaryButtonStyle = (color) => ({
    padding: '14px 32px',
    fontSize: 16,
    fontWeight: 600,
    borderRadius: theme.radius.md,
    background: color,
    color: '#1a1512',
    border: 'none',
    cursor: 'pointer',
    boxShadow: theme.shadow,
    fontFamily: theme.font,
});
