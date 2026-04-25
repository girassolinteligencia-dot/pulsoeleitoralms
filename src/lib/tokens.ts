/**
 * PULSOELEITORAL - Design Tokens
 * 
 * Based on the 'Pulso' design system specification.
 */

export const TOKENS = {
  COLORS: {
    DARK: '#141413',
    DARK_WARM: '#1c1814',
    DARK_MID: '#241e18',
    SURF_1: '#2e251d',
    SURFACE_1: '#2e251d', // Alias for compatibility
    SURF_2: '#3a2e24',
    SURFACE_2: '#3a2e24', // Alias for compatibility
    SURF_3: '#4a3b2e',
    CREAM: '#f5f0e8',
    MID_GRAY: '#b0aea5',
    TEXT_FAINT: '#7a6e64',
    BORDER: '#3d3128',
    BORDER_WARM: '#5a4535',
    ORANGE: '#d97757',
    ORANGE_DEEP: '#c4633d',
    MUSTARD: '#c8933a',
    BROWN: '#8b6347',
    POSITIVE: '#a8c47a',
    NEGATIVE: '#d97757',
    VOTER: '#c8933a',
    // Maintaining legacy keys for gradual migration in A3
    BACKGROUND: '#141413',
    PRIMARY: '#d97757',
    TEXT: '#f5f0e8',
    TEXT_MUTED: '#b0aea5',
  },
  FONTS: {
    DISPLAY: "'Poppins', sans-serif",
    BODY: "'Lora', serif",
  },
  SIZES: {
    FRAGMENT_MOBILE: 68, // Updated for 412px reference
    FRAGMENT_TABLET: 80,
    PHOTO_CENTER: 110,
    TOUCH_AREA: 44,
  },
  ANIMATION: {
    PLASMA_DURATION: 6000, // 4-8s average
    TRAIL_DECAY_MS: 300,
  }
} as const;

export type Tokens = typeof TOKENS;
