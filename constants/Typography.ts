/**
 * NiviDoc Design System — Typography Tokens (Hybrid Blue)
 * Clean medical typography with proper hierarchy
 * Platform-adaptive fonts with balanced weight distribution
 */
import { Platform } from 'react-native';

const fontFamily = Platform.select({
  ios: 'SF Pro Display',
  android: 'Roboto',
  default: 'System',
});

export const Typography = {
  // ── HEADINGS ──────────────────────────────────────────
  h1: {
    fontFamily,
    fontSize: 28,
    fontWeight: '800' as const,
    lineHeight: 36,
    letterSpacing: -0.4,
    color: '#0F172A',
  },
  h2: {
    fontFamily,
    fontSize: 22,
    fontWeight: '700' as const,
    lineHeight: 30,
    letterSpacing: -0.3,
    color: '#0F172A',
  },
  h3: {
    fontFamily,
    fontSize: 18,
    fontWeight: '700' as const,
    lineHeight: 26,
    letterSpacing: -0.2,
    color: '#0F172A',
  },
  heading: {
    fontFamily,
    fontSize: 20,
    fontWeight: '700' as const,
    lineHeight: 28,
    letterSpacing: -0.2,
    color: '#0F172A',
  },
  subheading: {
    fontFamily,
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24,
    letterSpacing: -0.1,
    color: '#0F172A',
  },

  // ── BODY ──────────────────────────────────────────────
  body1: {
    fontFamily,
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 24,
    letterSpacing: 0.1,
    color: '#0F172A',
  },
  body2: {
    fontFamily,
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 22,
    letterSpacing: 0.1,
    color: '#475569',
  },

  // ── LABELS / CAPTIONS ─────────────────────────────────
  label: {
    fontFamily,
    fontSize: 13,
    fontWeight: '600' as const,
    lineHeight: 18,
    letterSpacing: 0.2,
    color: '#0F172A',
  },
  caption: {
    fontFamily,
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 18,
    letterSpacing: 0.2,
    color: '#94A3B8',
  },
  overline: {
    fontFamily,
    fontSize: 11,
    fontWeight: '700' as const,
    lineHeight: 16,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
    color: '#94A3B8',
  },

  // ── BUTTONS ───────────────────────────────────────────
  button: {
    fontFamily,
    fontSize: 15,
    fontWeight: '700' as const,
    lineHeight: 24,
    letterSpacing: 0.2,
    color: '#FFFFFF',
  },
  buttonSm: {
    fontFamily,
    fontSize: 13,
    fontWeight: '700' as const,
    lineHeight: 18,
    letterSpacing: 0.2,
    color: '#FFFFFF',
  },
};
