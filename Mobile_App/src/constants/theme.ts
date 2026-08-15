// ============================================================
// A.E.G.I.S. – Design Tokens
// Dispatch-inspired retro-futurist ops theme.
// Deep space navy + CRT glow accents + hero brand colors.
// ============================================================

import '@/global.css';

import { Platform } from 'react-native';

// ─── AEGIS Color System ──────────────────────────────────────

export const AegisColors = {
  // Backgrounds
  bg: '#0d0f1a',           // Deep space navy — main background
  surface: '#161929',      // Card / panel background
  surfaceHigh: '#1e2235',  // Elevated surface (modals, drawers)
  border: '#2a2f4a',       // Subtle divider / border

  // Brand accents (Dispatch CRT palette)
  accentBlue: '#4fc3f7',   // Comms / links / online status
  accentAmber: '#ffd54f',  // Alerts / warnings / high priority
  critical: '#ff5252',     // Critical priority / errors
  success: '#69f0ae',      // Mission complete / online

  // Text
  textPrimary: '#e8eaf6',
  textSecondary: '#7986cb',
  textMuted: '#4a5180',

  // Scanline / CRT texture overlay
  scanlineOpacity: 0.04,

  // Priority colors
  priority: {
    low: '#69f0ae',
    medium: '#4fc3f7',
    high: '#ffd54f',
    critical: '#ff5252',
  },

  // Hero brand colors (unique per hero — shown as glow rings + card strips)
  heroes: {
    'Spider-Man':       '#e53935',
    'Thor':             '#1565c0',
    'Iron Man':         '#ff8f00',
    'Hulk':             '#2e7d32',
    'Captain America':  '#0277bd',
    default:            '#4fc3f7',
  },

  // Status colors
  status: {
    online:     '#69f0ae',
    busy:       '#ffd54f',
    on_mission: '#ff8f00',
    offline:    '#4a5180',
  },
} as const;

// ─── Theme (light/dark kept for compatibility) ───────────────

export const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
  },
  dark: {
    text: AegisColors.textPrimary,
    background: AegisColors.bg,
    backgroundElement: AegisColors.surface,
    backgroundSelected: AegisColors.surfaceHigh,
    textSecondary: AegisColors.textSecondary,
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

// ─── Typography ──────────────────────────────────────────────

export const Fonts = Platform.select({
  ios: {
    // Space Grotesk loaded via expo-font (add in _layout.tsx)
    display: 'SpaceGrotesk-Bold',
    sans: 'SpaceGrotesk-Regular',
    mono: 'JetBrainsMono-Regular',
  },
  default: {
    display: 'normal',
    sans: 'normal',
    mono: 'monospace',
  },
  web: {
    display: 'var(--font-display)',
    sans: 'var(--font-display)',
    mono: 'var(--font-mono)',
  },
});

// ─── Spacing ─────────────────────────────────────────────────

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

// ─── Layout ──────────────────────────────────────────────────

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

// ─── Helper — get hero brand color ───────────────────────────

export function getHeroBrandColor(codename: string): string {
  return (
    AegisColors.heroes[codename as keyof typeof AegisColors.heroes] ??
    AegisColors.heroes.default
  );
}

// ─── Helper — get status color ───────────────────────────────

export function getStatusColor(status: keyof typeof AegisColors.status): string {
  return AegisColors.status[status];
}

// ─── Helper — get priority color ─────────────────────────────

export function getPriorityColor(priority: keyof typeof AegisColors.priority): string {
  return AegisColors.priority[priority];
}
